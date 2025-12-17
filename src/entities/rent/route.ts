import express from 'express';
import {
  getAllRents,
  getRentById,
  createRent,
  updateRent,
  deleteRent,
  markRentAsPaid,
  generateRentSheets
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllRents);


router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager']), getRentById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createRent);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateRent);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteRent);


router.patch('/:id/mark-paid', authMiddleware, authorizeRole(['admin', 'manager']), markRentAsPaid);


router.post('/generate-sheets', authMiddleware, authorizeRole(['admin']), generateRentSheets);

export default router;