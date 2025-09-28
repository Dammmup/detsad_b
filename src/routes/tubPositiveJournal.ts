import express from 'express';
import TubPositiveRecord from '../models/TubPositiveRecord';

const router = express.Router();

// Получить все записи с фильтрами
router.get('/', async (req, res) => {
  try {
    const { search = '', group = '', referral = '', doctor = '' } = req.query;
    let filter: any = {};
    if (search) filter.fio = { $regex: search, $options: 'i' };
    if (group) filter.group = group;
    if (referral) filter.referral = { $regex: referral, $options: 'i' };
    if (doctor) filter.doctor = { $regex: doctor, $options: 'i' };
    const records = await TubPositiveRecord.find(filter).sort({ date: -1, fio: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении записей' });
  }
});

// Добавить новую запись
router.post('/', async (req, res) => {
  try {
    const record = new TubPositiveRecord(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при добавлении записи' });
  }
});

// Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const record = await TubPositiveRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Запись не найдена' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при обновлении записи' });
  }
});

// Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    await TubPositiveRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при удалении записи' });
  }
});

export default router;
