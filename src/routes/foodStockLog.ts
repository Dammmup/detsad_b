import { Router, Request, Response } from 'express';
import FoodStockLog from '../models/FoodStockLog';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.json(await FoodStockLog.find().sort({ date: -1 }));
});
router.post('/', async (req: Request, res: Response) => {
  res.json(await FoodStockLog.create(req.body));
});
router.put('/:id', async (req: Request, res: Response) => {
  res.json(await FoodStockLog.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});
router.delete('/:id', async (req: Request, res: Response) => {
  await FoodStockLog.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
