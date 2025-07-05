import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users';
import { comparePassword } from '../utils/hash';
import nodemailer from 'nodemailer';
import { info } from 'console';

const router = express.Router();

// Универсальная функция создания JWT-токена для пользователя
function createJwtToken(user: any) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      level: user.level,
      access: user.access,
      emailVerified: user.emailVerified,
      blocked: user.blocked
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );
}

// Настройка Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru', // Заменить на твой SMTP-сервер
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'dochky.1@mail.ru',
    pass: process.env.EMAIL_PASS || 'D1W0YffYmDPNtjRkWSgL'
  }
});
const emailTemplate = ({username,link}:{username:string,link:string})=>`
<P>Hello ${username},</P>
<P>We glad you interested in our service!</P>
<P>You must type verification code on our page</P>
`
// Временное хранилище кодов верификации
const verificationCodes = new Map<string, string>();

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('login:', username, password);
  try {
    const user = await User.findOne({ username: username || '' });
    if (!user) {
      return res.status(401).json({ error: 'No account with this data' });
    }
    const isMatch = await comparePassword(password, user.passwordHash || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'incorrect password' });
    }
    console.log('user for JWT:', user);
    const token = createJwtToken(user);
    res.json({ token, role: user.role, username: user.username, id: user._id, emailVerified: user.emailVerified });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Отправка верификационного письма
router.post('/send-verification-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email, code);

  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@example.com',
    to: email,
    subject: 'Email Verification',
    text: `${emailTemplate}Your verification code is: ${code}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('mail sent:', info);
    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Проверка кода верификации
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const storedCode = verificationCodes.get(email);
  if (!storedCode) {
    return res.status(404).json({ error: 'No verification code found for this email' });
  }

  if (storedCode === code) {
    const user = await User.findOneAndUpdate(
      { email },
      { emailVerified: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const token = createJwtToken(user);
    res.status(200).json({ message: 'Email verified', token });
  } else {
    res.status(401).json({ error: 'Invalid verification code' });
  }
});

export default router;
