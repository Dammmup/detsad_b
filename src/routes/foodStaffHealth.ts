import { Router, Request, Response } from 'express';
import FoodStaffHealth from '../models/FoodStaffHealth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.json(await FoodStaffHealth.find().sort({ date: -1 }));
});
router.post('/', async (req: Request, res: Response) => {
  res.json(await FoodStaffHealth.create(req.body));
});
router.put('/:id', async (req: Request, res: Response) => {
  res.json(await FoodStaffHealth.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});
router.delete('/:id', async (req: Request, res: Response) => {
  await FoodStaffHealth.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
