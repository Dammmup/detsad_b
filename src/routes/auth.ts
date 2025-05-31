import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { comparePassword } from '../utils/hash';
const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const user = await Admin.findOne({ login });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ login: user.login }, process.env.JWT_SECRET || 'secret', { expiresIn: '2h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
