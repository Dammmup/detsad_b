import { Request, Response } from 'express';
import { TaskListService } from './service';
import { logAction, computeChanges } from '../../utils/auditLogger';

const taskListService = new TaskListService();

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { assignedTo, assignedBy, status, priority, category, dueDate, startDate, endDate } = req.query;

    const tasks = await taskListService.getAll({
      assignedTo: assignedTo as string,
      assignedBy: assignedBy as string,
      status: status as string,
      priority: priority as string,
      category: category as string,
      dueDate: dueDate as string,
      startDate: startDate as string,
      endDate: endDate as string
    }, req.user.id as string);

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Ошибка получения задач' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const task = await taskListService.getById(req.params.id);







    const userId = req.user.id as string;
    const userRole = req.user.role as string;

    const canView =
      task.assignedTo.toString() === userId ||
      task.assignedBy.toString() === userId ||
      (task.assignedToSpecificUser && task.assignedToSpecificUser.toString() === userId) ||
      ['admin', 'manager'].includes(userRole);

    if (!canView) {
      return res.status(403).json({ error: 'Нет прав для просмотра этой задачи' });
    }

    res.json(task);
  } catch (err: any) {
    console.error('Error fetching task:', err);
    res.status(404).json({ error: err.message || 'Задача не найдена' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const task = await taskListService.create(req.body, req.user.id as string);

    logAction({
      userId: req.user.id,
      userFullName: req.user.fullName,
      userRole: req.user.role,
      action: 'create',
      entityType: 'task',
      entityId: task._id.toString(),
      entityName: task.title
    });

    res.status(201).json(task);
  } catch (err: any) {
    console.error('Error creating task:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания задачи' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }



    const task = await taskListService.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    const canUpdate =
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      task.assignedTo.toString() === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update this task' });
    }

    const updatedTask = await taskListService.update(req.params.id, req.body);

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'update',
      entityType: 'task',
      entityId: req.params.id,
      entityName: updatedTask?.title || ''
    });

    res.json(updatedTask);
  } catch (err: any) {
    console.error('Error updating task:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления задачи' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete tasks' });
    }

    const result = await taskListService.delete(req.params.id);

    logAction({
      userId: req.user!.id,
      userFullName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'delete',
      entityType: 'task',
      entityId: req.params.id,
      entityName: ''
    });

    res.json(result);
  } catch (err: any) {
    console.error('Error deleting task:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления задачи' });
  }
};

export const markTaskAsCompleted = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    const task = await taskListService.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }


    const canComplete =
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      task.assignedTo.toString() === req.user.id;

    if (!canComplete) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to complete this task' });
    }

    const updatedTask = await taskListService.markAsCompleted(req.params.id, req.user.id as string);

    logAction({
      userId: req.user.id,
      userFullName: req.user.fullName,
      userRole: req.user.role,
      action: 'status_change',
      entityType: 'task',
      entityId: req.params.id,
      entityName: updatedTask?.title || '',
      details: 'Задача завершена'
    });

    res.json(updatedTask);
  } catch (err: any) {
    console.error('Error marking task as completed:', err);
    res.status(404).json({ error: err.message || 'Ошибка завершения задачи' });
  }
};

export const markTaskAsCancelled = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    const task = await taskListService.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }


    const canCancel =
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      task.assignedTo.toString() === req.user.id;

    if (!canCancel) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to cancel this task' });
    }

    const updatedTask = await taskListService.markAsCancelled(req.params.id, req.user.id as string);

    logAction({
      userId: req.user.id,
      userFullName: req.user.fullName,
      userRole: req.user.role,
      action: 'status_change',
      entityType: 'task',
      entityId: req.params.id,
      entityName: updatedTask?.title || '',
      details: 'Задача отменена'
    });

    res.json(updatedTask);
  } catch (err: any) {
    console.error('Error marking task as cancelled:', err);
    res.status(404).json({ error: err.message || 'Ошибка отмены задачи' });
  }
};

export const markTaskAsInProgress = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const task = await taskListService.markAsInProgress(req.params.id);
    res.json(task);
  } catch (err: any) {
    console.error('Error marking task as in progress:', err);
    res.status(404).json({ error: err.message || 'Ошибка перевода задачи в статус "в работе"' });
  }
};

export const updateTaskPriority = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { priority } = req.body;

    if (!priority) {
      return res.status(400).json({ error: 'Не указан приоритет задачи' });
    }

    const task = await taskListService.updatePriority(req.params.id, priority);
    res.json(task);
  } catch (err: any) {
    console.error('Error updating task priority:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления приоритета задачи' });
  }
};

export const addTaskAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { attachment } = req.body;

    if (!attachment) {
      return res.status(400).json({ error: 'Не указано вложение' });
    }

    const task = await taskListService.addAttachment(req.params.id, attachment);
    res.json(task);
  } catch (err: any) {
    console.error('Error adding task attachment:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления вложения к задаче' });
  }
};

export const removeTaskAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { attachment } = req.body;

    if (!attachment) {
      return res.status(400).json({ error: 'Не указано вложение' });
    }

    const task = await taskListService.removeAttachment(req.params.id, attachment);
    res.json(task);
  } catch (err: any) {
    console.error('Error removing task attachment:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления вложения из задачи' });
  }
};

export const addTaskNote = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Не указана заметка' });
    }

    const task = await taskListService.addNote(req.params.id, note);
    res.json(task);
  } catch (err: any) {
    console.error('Error adding task note:', err);
    res.status(404).json({ error: err.message || 'Ошибка добавления заметки к задаче' });
  }
};

export const getOverdueTasks = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }



    let tasks;
    if (req.user.role === 'admin' || req.user.role === 'manager') {

      tasks = await taskListService.getOverdueTasks();
    } else {

      tasks = await taskListService.getOverdueTasks(req.user.id as string);
    }

    res.json(tasks);
  } catch (err: any) {
    console.error('Error fetching overdue tasks:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения просроченных задач' });
  }
};

export const getTasksByUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.params;



    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (req.user.id !== userId) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access this user\'s tasks' });
      }
    }

    const tasks = await taskListService.getTasksByUser(userId);
    res.json(tasks);
  } catch (err: any) {
    console.error('Error fetching tasks by user:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения задач по пользователю' });
  }
};

export const getTaskStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }


    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access task statistics' });
    }

    const stats = await taskListService.getTaskStatistics();
    res.json(stats);
  } catch (err: any) {
    console.error('Error fetching task statistics:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения статистики задач' });
  }
};

export const toggleTaskStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updatedTask = await taskListService.toggleStatus(req.params.id, userId);
    res.json(updatedTask);
  } catch (err: any) {
    console.error('Error toggling task status:', err);
    res.status(404).json({ error: err.message || 'Ошибка переключения статуса задачи' });
  }
};