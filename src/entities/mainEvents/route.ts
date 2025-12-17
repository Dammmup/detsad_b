import express, { Router } from 'express';
import { MainEventsService } from './service';
import { authenticate } from '../../middlewares/authenticate';

const router: Router = express.Router();
const mainEventsService = new MainEventsService();


router.get('/', authenticate, async (req, res) => {
  try {
    const { enabled } = req.query;
    const filters: any = {};

    if (enabled !== undefined) {
      filters.enabled = enabled === 'true';
    }

    const mainEvents = await mainEventsService.getAll(filters);
    res.json(mainEvents);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:id', authenticate, async (req, res) => {
  try {
    const mainEvent = await mainEventsService.getById(req.params.id);
    res.json(mainEvent);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});


router.post('/', authenticate, async (req, res) => {
  try {
    const mainEvent = await mainEventsService.create(req.body);
    res.status(201).json(mainEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.put('/:id', authenticate, async (req, res) => {
  try {
    const mainEvent = await mainEventsService.update(req.params.id, req.body);
    res.json(mainEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await mainEventsService.delete(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});


router.patch('/:id/toggle-enabled', authenticate, async (req, res) => {
  try {
    const mainEvent = await mainEventsService.toggleEnabled(req.params.id, req.body.enabled);
    res.json(mainEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.post('/:id/export', authenticate, async (req, res) => {
  try {
    const result = await mainEventsService.executeScheduledExport(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.post('/execute-scheduled', authenticate, async (req, res) => {
  try {
    const results = await mainEventsService.checkAndExecuteScheduledEvents();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;