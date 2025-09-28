import express from 'express';
import HelminthRecord from '../models/HelminthRecord';

const router = express.Router();

// Получить все записи с фильтрами
router.get('/', async (req, res) => {
  try {
    const { month, year, examType, result } = req.query;
    let filter: any = {};
    if (month && month !== 'all') filter.month = month;
    if (year && year !== 'all') filter.year = year;
    if (examType && examType !== 'all') filter.examType = examType;
    if (result && result !== 'all') filter.result = result;
    const records = await HelminthRecord.find(filter).sort({ year: -1, month: 1, fio: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
});

// Добавить новую запись
router.post('/', async (req, res) => {
  try {
    const record = new HelminthRecord(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при добавлении записи' });
  }
});

// Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const record = await HelminthRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Запись не найдена' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при обновлении записи' });
  }
});

// Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    const record = await HelminthRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Запись не найдена' });
    res.json({ message: 'Запись удалена' });
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при удалении записи' });
  }
});

export default router;
