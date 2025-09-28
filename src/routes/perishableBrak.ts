import { Router, Request, Response } from 'express';
import PerishableBrak from '../models/PerishableBrak';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.json(await PerishableBrak.find().sort({ date: -1 }));
});
router.post('/', async (req: Request, res: Response) => {
  res.json(await PerishableBrak.create(req.body));
});
router.put('/:id', async (req: Request, res: Response) => {
  res.json(await PerishableBrak.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});
router.delete('/:id', async (req: Request, res: Response) => {
  await PerishableBrak.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
