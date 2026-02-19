import express, { Router } from 'express';
import { MainEventsService } from './service';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router: Router = express.Router();
const mainEventsService = new MainEventsService();


router.get('/', authMiddleware, async (req, res) => {
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


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const mainEvent = await mainEventsService.getById(req.params.id);
    res.json(mainEvent);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});


router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const mainEvent = await mainEventsService.create(req.body);
    res.status(201).json(mainEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const mainEvent = await mainEventsService.update(req.params.id, req.body);
    res.json(mainEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await mainEventsService.delete(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
});


router.patch('/:id/toggle-enabled', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const mainEvent = await mainEventsService.toggleEnabled(req.params.id, req.body.enabled);
    res.json(mainEvent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.post('/:id/export', authMiddleware, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const result = await mainEventsService.executeScheduledExport(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});


router.post('/execute-scheduled', authMiddleware, authorizeRole(['admin']), async (req, res) => {
  try {
    const results = await mainEventsService.checkAndExecuteScheduledEvents();
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;