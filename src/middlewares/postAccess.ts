import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PostCategory } from '../models/Post';

// Роли, которым разрешено создавать посты для каждой категории
const ALLOWED_ROLES: Record<PostCategory, string[]> = {
  question: ['student', 'teacher', 'admin'],
  discussion: ['student', 'teacher', 'admin'],
  news: ['teacher', 'admin'],
  history: ['teacher', 'admin'],
};

export function canCreatePost(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const category: PostCategory = req.body.category;
    if (!category || !ALLOWED_ROLES[category]) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!ALLOWED_ROLES[category].includes(decoded.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
