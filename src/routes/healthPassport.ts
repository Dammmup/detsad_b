import express from 'express';
import HealthPassport from '../models/HealthPassport';

const router = express.Router();

// Получить все паспорта (с фильтрами)
router.get('/', async (req, res) => {
  try {
    const { childId, year } = req.query;
    let filter: any = {};
    if (childId) filter.childId = childId;
    if (year) filter.year = year;
    const records = await HealthPassport.find(filter).sort({ year: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении паспортов' });
  }
});

// Получить паспорт по id
router.get('/:id', async (req, res) => {
  try {
    const record = await HealthPassport.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Паспорт не найден' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при получении паспорта' });
  }
});

// Добавить новый паспорт
router.post('/', async (req, res) => {
  try {
    const record = new HealthPassport(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при добавлении паспорта' });
  }
});

// Обновить паспорт
router.put('/:id', async (req, res) => {
  try {
    const record = await HealthPassport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ error: 'Паспорт не найден' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при обновлении паспорта' });
  }
});

// Удалить паспорт
router.delete('/:id', async (req, res) => {
  try {
    const record = await HealthPassport.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Паспорт не найден' });
    res.json({ message: 'Паспорт удалён' });
  } catch (err) {
    res.status(400).json({ error: 'Ошибка при удалении паспорта' });
  }
});

export default router;
