import express from 'express';
import { create, getAll, getById, update, deleteItem, getByPeriod, generate } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();


router.post('/', authMiddleware, create);
router.post('/generate', authMiddleware, generate);
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, deleteItem);



router.get('/period', authMiddleware, getByPeriod);

export default router;