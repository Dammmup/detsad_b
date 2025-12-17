import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  markTaskAsCompleted,
  markTaskAsCancelled,
  markTaskAsInProgress,
  updateTaskPriority,
  addTaskAttachment,
  removeTaskAttachment,
  addTaskNote,
  getOverdueTasks,
  getTasksByUser,
  getTaskStatistics,
  toggleTaskStatus
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();


router.get('/', authMiddleware, getAllTasks);


router.get('/:id', authMiddleware, getTaskById);


router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createTask);


router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateTask);


router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteTask);


router.patch('/:id/complete', authMiddleware, authorizeRole(['admin', 'manager']), markTaskAsCompleted);


router.patch('/:id/cancel', authMiddleware, authorizeRole(['admin', 'manager']), markTaskAsCancelled);


router.patch('/:id/in-progress', authMiddleware, authorizeRole(['admin', 'manager']), markTaskAsInProgress);


router.patch('/:id/priority', authMiddleware, authorizeRole(['admin', 'manager']), updateTaskPriority);


router.post('/:id/attachment', authMiddleware, authorizeRole(['admin', 'manager']), addTaskAttachment);


router.delete('/:id/attachment', authMiddleware, authorizeRole(['admin', 'manager']), removeTaskAttachment);


router.post('/:id/note', authMiddleware, authorizeRole(['admin', 'manager']), addTaskNote);


router.get('/overdue', authMiddleware, getOverdueTasks);


router.get('/user/:userId', authMiddleware, getTasksByUser);


router.get('/statistics', authMiddleware, getTaskStatistics);


router.patch('/:id/toggle', authMiddleware, toggleTaskStatus);

export default router;