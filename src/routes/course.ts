import express from 'express';
import Course from '../models/Course';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to check JWT
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Add new course
router.post('/', authenticateToken, async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Delete course
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Course.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Get all courses (public)
router.get('/', async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

export default router;
