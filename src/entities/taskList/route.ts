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
  getTaskStatistics
} from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

// Get all tasks (with filters)
router.get('/', authMiddleware, authorizeRole(['admin', 'manager']), getAllTasks);

// Get task by ID
router.get('/:id', authMiddleware, authorizeRole(['admin', 'manager']), getTaskById);

// Create new task
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), createTask);

// Update task
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), updateTask);

// Delete task
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'manager']), deleteTask);

// Mark task as completed
router.patch('/:id/complete', authMiddleware, authorizeRole(['admin', 'manager']), markTaskAsCompleted);

// Mark task as cancelled
router.patch('/:id/cancel', authMiddleware, authorizeRole(['admin', 'manager']), markTaskAsCancelled);

// Mark task as in progress
router.patch('/:id/in-progress', authMiddleware, authorizeRole(['admin', 'manager']), markTaskAsInProgress);

// Update task priority
router.patch('/:id/priority', authMiddleware, authorizeRole(['admin', 'manager']), updateTaskPriority);

// Add attachment to task
router.post('/:id/attachment', authMiddleware, authorizeRole(['admin', 'manager']), addTaskAttachment);

// Remove attachment from task
router.delete('/:id/attachment', authMiddleware, authorizeRole(['admin', 'manager']), removeTaskAttachment);

// Add note to task
router.post('/:id/note', authMiddleware, authorizeRole(['admin', 'manager']), addTaskNote);

// Get overdue tasks
router.get('/overdue', authMiddleware, authorizeRole(['admin', 'manager']), getOverdueTasks);

// Get tasks by user
router.get('/user/:userId', authMiddleware, authorizeRole(['admin', 'manager']), getTasksByUser);

// Get task statistics
router.get('/statistics', authMiddleware, authorizeRole(['admin', 'manager']), getTaskStatistics);

export default router;