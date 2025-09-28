import express from 'express';
import Child from '../models/Child';
import { AuthenticatedRequest } from '../types/express';

const router = express.Router();

// Получить список всех детей
router.get('/', async (req, res) => {
  try {
    const children = await Child.find();
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении списка детей' });
  }
});

// Получить одного ребенка по id
router.get('/:id', async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) return res.status(404).json({ error: 'Ребенок не найден' });
    res.json(child);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении данных ребенка' });
  }
});

// Создать нового ребенка
router.post('/', async (req, res) => {
  try {
    const child = new Child(req.body);
    await child.save();
    res.status(201).json(child);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при создании ребенка', details: error });
  }
});

// Обновить данные ребенка
router.put('/:id', async (req, res) => {
  try {
    const child = await Child.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!child) return res.status(404).json({ error: 'Ребенок не найден' });
    res.json(child);
  } catch (error) {
    res.status(400).json({ error: 'Ошибка при обновлении данных ребенка', details: error });
  }
});

// Удалить ребенка
router.delete('/:id', async (req, res) => {
  try {
    const child = await Child.findByIdAndDelete(req.params.id);
    if (!child) return res.status(404).json({ error: 'Ребенок не найден' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении ребенка' });
  }
});

export default router;
