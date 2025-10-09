import express from 'express';
import { 
  getAllFines, 
  getFineById, 
  createFine, 
  updateFine, 
  deleteFine,
  getFinesByUserId,
  getTotalFinesByUserId
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all fines
router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllFines);

// Get fine by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager']), getFineById);

// Create new fine
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createFine);

// Update fine
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateFine);

// Delete fine
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteFine);

// Get fines by user ID
router.get('/user/:userId', authMiddleware, authorizeRole(['admin', 'manager']), getFinesByUserId);

// Get total fines by user ID
router.get('/user/:userId/total', authMiddleware, authorizeRole(['admin', 'manager']), getTotalFinesByUserId);

export default router;