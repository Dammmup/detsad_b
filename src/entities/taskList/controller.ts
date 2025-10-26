import { Request, Response } from 'express';
import { AuthUser } from '../../middlewares/authMiddleware';
import { TaskListService } from './service';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const taskListService = new TaskListService();

export const getAllTasks = async (req: AuthenticatedRequest, res: Response) => {
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
    }, req.user.id as string);  // Передаем userId для фильтрации задач
    
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Ошибка получения задач' });
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const task = await taskListService.getById(req.params.id);
    
    // Проверяем, имеет ли пользователь право видеть эту задачу
    // Пользователь может видеть задачу, если:
    // 1. Он является исполнителем (assignedTo)
    // 2. Он является автором (assignedBy)
    // 3. Задача назначена конкретно ему (assignedToSpecificUser)
    // 4. Он администратор или менеджер
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

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const task = await taskListService.create(req.body, req.user.id as string);
    res.status(201).json(task);
  } catch (err: any) {
    console.error('Error creating task:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания задачи' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы и менеджеры могут обновлять любые задачи
    // Обычные пользователи могут обновлять только задачи, назначенные им
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
    res.json(updatedTask);
  } catch (err: any) {
    console.error('Error updating task:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления задачи' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы и менеджеры могут удалять задачи
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete tasks' });
    }
    
    const result = await taskListService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting task:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления задачи' });
  }
};

export const markTaskAsCompleted = async (req: AuthenticatedRequest, res: Response) => {
 try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем, может ли пользователь завершить задачу
    const task = await taskListService.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    
    // Только администраторы, менеджеры или исполнитель задачи могут завершить задачу
    const canComplete =
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      task.assignedTo.toString() === req.user.id;
    
    if (!canComplete) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to complete this task' });
    }
    
    const updatedTask = await taskListService.markAsCompleted(req.params.id, req.user.id as string);
    res.json(updatedTask);
 } catch (err: any) {
    console.error('Error marking task as completed:', err);
    res.status(404).json({ error: err.message || 'Ошибка завершения задачи' });
 }
};

export const markTaskAsCancelled = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем, может ли пользователь отменить задачу
    const task = await taskListService.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    
    // Только администраторы, менеджеры или исполнитель задачи могут отменить задачу
    const canCancel =
      req.user.role === 'admin' ||
      req.user.role === 'manager' ||
      task.assignedTo.toString() === req.user.id;
    
    if (!canCancel) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions to cancel this task' });
    }
    
    const updatedTask = await taskListService.markAsCancelled(req.params.id, req.user.id as string);
    res.json(updatedTask);
  } catch (err: any) {
    console.error('Error marking task as cancelled:', err);
    res.status(404).json({ error: err.message || 'Ошибка отмены задачи' });
  }
};

export const markTaskAsInProgress = async (req: AuthenticatedRequest, res: Response) => {
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

export const updateTaskPriority = async (req: AuthenticatedRequest, res: Response) => {
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

export const addTaskAttachment = async (req: AuthenticatedRequest, res: Response) => {
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

export const removeTaskAttachment = async (req: AuthenticatedRequest, res: Response) => {
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

export const addTaskNote = async (req: AuthenticatedRequest, res: Response) => {
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

export const getOverdueTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем права доступа
    // Пользователь может получать только просроченные задачи, назначенные ему, если он не администратор
    let tasks;
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      // Администраторы и менеджеры могут получать все просроченные задачи
      tasks = await taskListService.getOverdueTasks();
    } else {
      // Обычные пользователи получают только задачи, назначенные им
      tasks = await taskListService.getOverdueTasks(req.user.id as string);
    }
    
    res.json(tasks);
 } catch (err: any) {
    console.error('Error fetching overdue tasks:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения просроченных задач' });
  }
};

export const getTasksByUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { userId } = req.params;
    
    // Проверяем права доступа
    // Пользователь может получать задачи только для себя, если он не администратор
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

export const getTaskStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Только администраторы и менеджеры могут получить общую статистику
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

export const toggleTaskStatus = async (req: AuthenticatedRequest, res: Response) => {
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