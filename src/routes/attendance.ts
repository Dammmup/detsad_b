import express from 'express';
import Attendance from '../models/Attendance';
import { AuthenticatedRequest } from '../types/express';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Получить посещаемость по пользователю и диапазону дат
router.get('/', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }
    const records = await Attendance.find(filter).lean();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения посещаемости' });
  }
});

// Middleware: только admin, teacher, assistant
import { Request, Response, NextFunction } from 'express';

function canMarkAttendance(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.role;
  if (role === 'admin' || role === 'teacher' || role === 'assistant') {
    return next();
  }
  return res.status(403).json({ error: 'Недостаточно прав для отметки посещаемости' });
}

// Создать или обновить запись посещаемости
router.post('/', authMiddleware, canMarkAttendance, async (req, res) => {
  try {
    const { userId, date, status, notes } = req.body;
    if (!userId || !date || !status) {
      return res.status(400).json({ error: 'userId, date, status обязательны' });
    }
    const record = await Attendance.findOneAndUpdate(
      { userId, date },
      { $set: { status, notes } },
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сохранения посещаемости' });
  }
});

// Массовое сохранение посещаемости (bulk)
router.post('/bulk', authMiddleware, canMarkAttendance, async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Передайте массив записей' });
    }
    const results = [];
    for (const rec of records) {
      if (rec.userId && rec.date && rec.status) {
        const saved = await Attendance.findOneAndUpdate(
          { userId: rec.userId, date: rec.date },
          { $set: { status: rec.status, notes: rec.notes } },
          { upsert: true, new: true }
        );
        results.push(saved);
      }
    }
    res.json({ success: true, count: results.length });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при массовом сохранении посещаемости' });
  }
});

// Удалить запись посещаемости
router.delete('/', authMiddleware, canMarkAttendance, async (req, res) => {
  try {
    const { userId, date } = req.body;
    if (!userId || !date) {
      return res.status(400).json({ error: 'userId и date обязательны' });
    }
    await Attendance.deleteOne({ userId, date });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления посещаемости' });
  }
});

export default router;
