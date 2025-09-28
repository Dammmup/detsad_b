import { Router, Request, Response } from 'express';
import ProductCertificate from '../models/ProductCertificate';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  res.json(await ProductCertificate.find().sort({ date: -1 }));
});
router.post('/', async (req: Request, res: Response) => {
  res.json(await ProductCertificate.create(req.body));
});
router.put('/:id', async (req: Request, res: Response) => {
  res.json(await ProductCertificate.findByIdAndUpdate(req.params.id, req.body, { new: true }));
});
router.delete('/:id', async (req: Request, res: Response) => {
  await ProductCertificate.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
