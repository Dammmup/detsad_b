import express from 'express';
import MantouxRecord from '../models/MantouxRecord';

const router = express.Router();

// Получить все записи с фильтрами
router.get('/', async (req, res) => {
  try {
    const { search = '', year = '', atr = '', diagnosis = '' } = req.query;
    let filter: any = {};
    if (search) filter.fio = { $regex: search, $options: 'i' };
    if (year) filter.year = year;
    if (atr) filter.atr = { $regex: atr, $options: 'i' };
    if (diagnosis) filter.diagnosis = { $regex: diagnosis, $options: 'i' };
    const records = await MantouxRecord.find(filter).sort({ year: -1, fio: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
});

// Добавить новую запись
router.post('/', async (req, res) => {
  try {
    const record = new MantouxRecord(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при добавлении записи' });
  }
});

// Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const record = await MantouxRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Запись не найдена' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при обновлении записи' });
  }
});

// Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    const record = await MantouxRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Запись не найдена' });
    res.json({ message: 'Запись удалена' });
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при удалении записи' });
  }
});

export default router;
