import express from 'express';
import SomaticRecord from '../models/SomaticRecord';

const router = express.Router();

// Получить все записи с фильтрами
router.get('/', async (req, res) => {
  try {
    const { search = '', diagnosis = '', fromDate, toDate, onlyCurrentYear } = req.query;
    let filter: any = {};
    if (search) filter.fio = { $regex: search, $options: 'i' };
    if (diagnosis) filter.diagnosis = { $regex: diagnosis, $options: 'i' };
    if (fromDate) filter.fromDate = { $gte: fromDate };
    if (toDate) filter.toDate = { $lte: toDate };
    if (onlyCurrentYear === 'true') {
      const year = new Date().getFullYear().toString();
      filter.$or = [
        { fromDate: { $regex: `^${year}` } },
        { toDate: { $regex: `^${year}` } }
      ];
    }
    const records = await SomaticRecord.find(filter).sort({ fromDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
});

// Добавить новую запись
router.post('/', async (req, res) => {
  try {
    const record = new SomaticRecord(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при добавлении записи' });
  }
});

// Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const record = await SomaticRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Запись не найдена' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при обновлении записи' });
  }
});

// Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    const record = await SomaticRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Запись не найдена' });
    res.json({ message: 'Запись удалена' });
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при удалении записи' });
  }
});

export default router;
