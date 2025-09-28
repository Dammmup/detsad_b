import { Router } from 'express';
import MenuItem from '../models/MenuItem';

const router = Router();

// Получить все блюда
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка получения блюд' });
  }
});

// Создать блюдо
router.post('/', async (req, res) => {
  try {
    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: 'Ошибка создания блюда' });
  }
});

// Обновить блюдо
router.put('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: 'Ошибка обновления блюда' });
  }
});

// Удалить блюдо
router.delete('/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Ошибка удаления блюда' });
  }
});

export default router;
