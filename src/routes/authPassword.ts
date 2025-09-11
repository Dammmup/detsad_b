import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/Users';
import { hashPassword, comparePassword } from '../utils/hash';

const router = express.Router();

function createJwtToken(user: any) {
  const secret = process.env.JWT_SECRET || 'secret';
  return jwt.sign(
    {
      id: user._id,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
    },
    secret,
    { expiresIn: '24h' }
  );
}

// Registration route
router.post('/register', async (req, res) => {
  const { fullName, phone, password, role = 'teacher', type = 'adult' } = req.body;
  if (!fullName || !phone || !password) {
    return res.status(400).json({ error: 'fullName, phone and password are required' });
  }

  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this phone already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = new User({
      fullName,
      phone,
      passwordHash,
      role,
      type,
      active: true,
    });
    await user.save();

    const token = createJwtToken(user);
    res.status(201).json({ token, user: { id: user._id, fullName, phone, role } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password are required' });
  }
  try {
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createJwtToken(user);
    res.json({ token, user: { id: user._id, fullName: user.fullName, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Token validation route
router.get('/validate', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    res.json({ valid: true, user: { id: user._id, fullName: user.fullName, role: user.role } });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout route (client should simply discard the token)
router.post('/logout', (_req, res) => {
  res.json({ success: true });
});

export default router;
