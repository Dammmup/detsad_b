import express from 'express';
import MedicalJournal from '../models/MedicalJournal';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Получить все журналы
router.get('/', async (req: Request, res: Response) => {
  const journals = await MedicalJournal.find().sort({ date: -1 });
  res.json(journals);
});

// Получить журнал по id
router.get('/:id', async (req: Request, res: Response) => {
  const journal = await MedicalJournal.findById(req.params.id);
  if (!journal) return res.status(404).json({ message: 'Журнал не найден' });
  res.json(journal);
});

// Создать журнал
router.post('/', async (req: Request, res: Response) => {
  const journal = new MedicalJournal(req.body);
  await journal.save();
  res.status(201).json(journal);
});

// Добавить запись в журнал
router.post('/:id/entry', async (req: Request, res: Response) => {
  const journal = await MedicalJournal.findById(req.params.id);
  if (!journal) return res.status(404).json({ message: 'Журнал не найден' });
  journal.entries.push(req.body);
  await journal.save();
  res.json(journal);
});

// Обновить журнал
router.put('/:id', async (req: Request, res: Response) => {
  const journal = await MedicalJournal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!journal) return res.status(404).json({ message: 'Журнал не найден' });
  res.json(journal);
});

// Удалить журнал
router.delete('/:id', async (req: Request, res: Response) => {
  const journal = await MedicalJournal.findByIdAndDelete(req.params.id);
  if (!journal) return res.status(404).json({ message: 'Журнал не найден' });
  res.json({ message: 'Журнал удалён' });
});

export default router;
