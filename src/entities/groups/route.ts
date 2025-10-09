import express from 'express';
import {
 getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup
} from './controller';
import { authorizeRole } from '../../middlewares/authRole';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

// Get all groups
router.get('/', authMiddleware, getAllGroups);

// Get single group by ID
router.get('/:id', authMiddleware, getGroupById);

// Create new group (admin, teacher)
router.post('/', authMiddleware, authorizeRole(['admin', 'teacher']), createGroup);

// Update group (admin, teacher)
router.put('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), updateGroup);

// Delete group (admin, teacher)
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), deleteGroup);

export default router;