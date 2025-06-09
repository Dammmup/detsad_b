import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users';
import { comparePassword } from '../utils/hash';
const router = express.Router();

// Универсальная функция создания JWT-токена для пользователя
function createJwtToken(user: any) {
  return jwt.sign(
    {
      id: user._id?.toString?.() || user.id || '',
      username: user.username || '',
      role: user.role || 'student',
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '2h' }
  );
}

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
    res.json({ token, role: user.role, username: user.username, id: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
