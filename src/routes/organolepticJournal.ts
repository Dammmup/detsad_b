import { Router } from 'express';
import OrganolepticRecord from '../models/OrganolepticRecord';
import MenuItem from '../models/MenuItem';

const router = Router();

// Получить все записи с фильтрами
router.get('/', async (req, res) => {
  try {
    const query: any = {};
    if (req.query.group) query.group = req.query.group;
    if (req.query.dish) query.dish = { $regex: req.query.dish, $options: 'i' };
    if (req.query.date) query.date = req.query.date;
    const records = await OrganolepticRecord.find(query).sort({ date: -1 });
    res.json(records);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения записей' });
  }
});

// Создать запись
router.post('/', async (req, res) => {
  try {
    const record = new OrganolepticRecord(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (e) {
    res.status(400).json({ error: 'Ошибка создания записи' });
  }
});

// Обновить запись
router.put('/:id', async (req, res) => {
  try {
    const record = await OrganolepticRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(record);
  } catch (e) {
    res.status(400).json({ error: 'Ошибка обновления записи' });
  }
});

// Удалить запись
router.delete('/:id', async (req, res) => {
  try {
    await OrganolepticRecord.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ошибка удаления записи' });
  }
});

// Очистить все
router.delete('/', async (req, res) => {
  try {
    await OrganolepticRecord.deleteMany({});
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ошибка очистки' });
  }
});

// Генерация по меню
router.post('/generate-by-menu', async (req, res) => {
  try {
    const { date, group } = req.body;
    const menuQuery: any = { isActive: true };
    if (group && group !== 'all') menuQuery.$or = [{ group }, { group: 'all' }];
    const menuItems = await MenuItem.find(menuQuery);
    if (!menuItems.length) return res.status(404).json({ error: 'Нет подходящих блюд в меню' });
    const records = menuItems.map(item => ({
      date: date || new Date(),
      group: group || item.group || 'Все',
      dish: item.name,
      appearance: '',
      taste: '',
      smell: '',
      decision: '',
      responsibleSignature: '',
    }));
    const created = await OrganolepticRecord.insertMany(records);
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка генерации по меню' });
  }
});

export default router;
