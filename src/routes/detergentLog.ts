import { Router, Request, Response } from 'express';
import DetergentLog from '../models/DetergentLog';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.json(await DetergentLog.find().sort({ date: -1 }));
});
router.post('/', async (req: Request, res: Response) => {
  res.json(await DetergentLog.create(req.body));
});
router.put('/:id', async (req: Request, res: Response) => {
  res.json(await DetergentLog.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});
router.delete('/:id', async (req: Request, res: Response) => {
  await DetergentLog.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
