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


router.get('/', authMiddleware, getAllGroups);


router.get('/:id', authMiddleware, getGroupById);


router.post('/', authMiddleware, authorizeRole(['admin', 'teacher']), createGroup);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), updateGroup);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), deleteGroup);

export default router;