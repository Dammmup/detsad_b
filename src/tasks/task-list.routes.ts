import express, { Router } from 'express';
import { taskListController } from './task-list.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/auth';

const router: Router = express.Router();

// Маршруты для списков задач
router.get('/', authMiddleware, taskListController.getTaskLists);
router.get('/my', authMiddleware, taskListController.getUserTaskLists);
router.get('/statistics', authMiddleware, requireRole(['admin', 'manager']), taskListController.getTaskListStatistics);
router.get('/:id', authMiddleware, taskListController.getTaskListById);
router.post('/', authMiddleware, requireRole(['admin', 'manager', 'teacher']), taskListController.createTaskList);
router.put('/:id', authMiddleware, requireRole(['admin', 'manager', 'teacher']), taskListController.updateTaskList);
router.delete('/:id', authMiddleware, requireRole(['admin', 'manager']), taskListController.deleteTaskList);

// Маршруты для задач в списках
router.post('/:id/tasks', authMiddleware, requireRole(['admin', 'manager', 'teacher']), taskListController.addTaskToList);
router.put('/:taskListId/tasks/:taskId', authMiddleware, requireRole(['admin', 'manager', 'teacher', 'assistant']), taskListController.updateTaskStatus);
router.delete('/:taskListId/tasks/:taskId', authMiddleware, requireRole(['admin', 'manager', 'teacher']), taskListController.removeTaskFromList);

export default router;