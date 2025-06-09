import express from 'express';
import Event from '../models/Event';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// Add new event (admin, teacher)
router.post('/', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const event = new Event({ ...req.body, createdBy: req.user.id });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Delete event (admin, teacher)
router.delete('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    // Только admin или владелец может удалить
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

// Edit event (admin, teacher)
router.put('/:id', authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    // Только admin или владелец может редактировать
    if (req.user.role !== 'admin' && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    const error = err as Error;
    res.status(400).json({ error: error.message });
  }
});

export default router;
