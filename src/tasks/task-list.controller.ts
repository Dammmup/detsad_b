import { Request, Response, NextFunction } from 'express';
import { taskListService } from './task-list.service';

export class TaskListController {
  // Получение списков задач
  async getTaskLists(req: Request, res: Response, next: NextFunction) {
    try {
      const { assignedTo, status, priority, category } = req.query;
      
      const filter: any = {};
      if (assignedTo) filter.assignedTo = assignedTo;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;
      
      const taskLists = await taskListService.getTaskLists(filter);
      res.json({ success: true, data: taskLists });
    } catch (error) {
      next(error);
    }
  }

  // Получение списка задач по ID
  async getTaskListById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const taskList = await taskListService.getTaskListById(id);
      
      if (!taskList) {
        return res.status(404).json({ success: false, message: 'Список задач не найден' });
      }
      
      res.json({ success: true, data: taskList });
    } catch (error) {
      next(error);
    }
  }

  // Создание нового списка задач
  async createTaskList(req: Request, res: Response, next: NextFunction) {
    try {
      const taskListData = req.body;
      // Устанавливаем пользователя, создавшего список задач
      taskListData.createdBy = req.user!._id;
      
      const taskList = await taskListService.createTaskList(taskListData);
      res.status(201).json({ success: true, data: taskList });
    } catch (error) {
      next(error);
    }
  }

  // Обновление списка задач
  async updateTaskList(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const taskListData = req.body;
      // Устанавливаем пользователя, обновившего список задач
      taskListData.updatedBy = req.user!._id;
      
      const taskList = await taskListService.updateTaskList(id, taskListData);
      
      if (!taskList) {
        return res.status(404).json({ success: false, message: 'Список задач не найден' });
      }
      
      res.json({ success: true, data: taskList });
    } catch (error) {
      next(error);
    }
  }

  // Удаление списка задач
  async deleteTaskList(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await taskListService.deleteTaskList(id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Список задач не найден' });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
 }

  // Обновление статуса задачи в списке
  async updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskListId, taskId } = req.params;
      const { completed } = req.body;
      const userId = req.user!._id;
      
      const updatedTaskList = await taskListService.updateTaskStatus(
        taskListId, 
        parseInt(taskId), 
        completed, 
        userId
      );
      
      if (!updatedTaskList) {
        return res.status(404).json({ success: false, message: 'Список задач не найден' });
      }
      
      res.json({ success: true, data: updatedTaskList });
    } catch (error) {
      next(error);
    }
 }

  // Добавление задачи в список
  async addTaskToList(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const taskData = req.body;
      
      const updatedTaskList = await taskListService.addTaskToList(id, taskData);
      
      if (!updatedTaskList) {
        return res.status(404).json({ success: false, message: 'Список задач не найден' });
      }
      
      res.status(201).json({ success: true, data: updatedTaskList });
    } catch (error) {
      next(error);
    }
  }

  // Удаление задачи из списка
  async removeTaskFromList(req: Request, res: Response, next: NextFunction) {
    try {
      const { taskListId, taskId } = req.params;
      
      const updatedTaskList = await taskListService.removeTaskFromList(
        taskListId, 
        parseInt(taskId)
      );
      
      if (!updatedTaskList) {
        return res.status(404).json({ success: false, message: 'Список задач не найден' });
      }
      
      res.json({ success: true, data: updatedTaskList });
    } catch (error) {
      next(error);
    }
 }

  // Получение статистики по спискам задач
  async getTaskListStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await taskListService.getTaskListStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
 }

  // Получение списков задач текущего пользователя
 async getUserTaskLists(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!._id;
      const taskLists = await taskListService.getTaskListsByUser(userId);
      res.json({ success: true, data: taskLists });
    } catch (error) {
      next(error);
    }
 }
}

// Экземпляр контроллера для использования в маршрутах
export const taskListController = new TaskListController();