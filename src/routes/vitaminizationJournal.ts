import { Router } from 'express';
import VitaminizationRecord from '../models/VitaminizationRecord';
import generateByMenuRouter from './vitaminizationJournal.generate';

const router = Router();

router.use('/generate-by-menu', generateByMenuRouter);

// Получить все записи с фильтрами
router.get('/', async (req, res) => {
  try {
    const query: any = {};
    if (req.query.group) query.group = req.query.group;
    if (req.query.meal) query.meal = req.query.meal;
    if (req.query.status) query.status = req.query.status;
    if (req.query.dish) query.dish = { $regex: req.query.dish, $options: 'i' };
    if (req.query.dateFrom || req.query.dateTo) {
      query.date = {};
      if (req.query.dateFrom) query.date.$gte = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) query.date.$lte = new Date(req.query.dateTo as string);
    }
    const records = await VitaminizationRecord.find(query).sort({ date: -1 });
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
});

// Создать запись
router.post('/', async (req, res) => {
  try {
    const record = new VitaminizationRecord(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (e) {
    res.status(400).json({ error: 'Ошибка создания записи' });
  }
});

// Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const record = await VitaminizationRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(record);
  } catch (e) {
    res.status(400).json({ error: 'Ошибка обновления записи' });
  }
});

// Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    await VitaminizationRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ошибка удаления записи' });
  }
});

// Очистить все
router.delete('/', async (req, res) => {
  try {
    await VitaminizationRecord.deleteMany({});
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ошибка очистки' });
  }
});

export default router;
