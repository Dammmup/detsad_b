import { Document, Types } from 'mongoose';
import TaskList, { ITaskList } from './task-list.model';
import User from '../users/user.model';

// Сервис для работы со списками задач
export class TaskListService {
  // Получение списков задач с фильтрацией
  async getTaskLists(filter: any = {}) {
    try {
      return await TaskList.find(filter)
        .populate('assignedTo', 'fullName role')
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('tasks.completedBy', 'fullName role')
        .populate('tasks.assignedTo', 'fullName role')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error getting task lists: ${error}`);
    }
  }

  // Получение списка задач по ID
  async getTaskListById(id: string) {
    try {
      return await TaskList.findById(id)
        .populate('assignedTo', 'fullName role')
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('tasks.completedBy', 'fullName role')
        .populate('tasks.assignedTo', 'fullName role');
    } catch (error) {
      throw new Error(`Error getting task list by id: ${error}`);
    }
  }

  // Создание нового списка задач
  async createTaskList(taskListData: Partial<ITaskList>) {
    try {
      const taskList = new TaskList(taskListData);
      return await taskList.save();
    } catch (error) {
      throw new Error(`Error creating task list: ${error}`);
    }
 }

  // Обновление списка задач
  async updateTaskList(id: string, taskListData: Partial<ITaskList>) {
    try {
      return await TaskList.findByIdAndUpdate(id, taskListData, { new: true })
        .populate('assignedTo', 'fullName role')
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('tasks.completedBy', 'fullName role')
        .populate('tasks.assignedTo', 'fullName role');
    } catch (error) {
      throw new Error(`Error updating task list: ${error}`);
    }
  }

  // Удаление списка задач
  async deleteTaskList(id: string) {
    try {
      const result = await TaskList.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting task list: ${error}`);
    }
 }

  // Получение списков задач по пользователю
  async getTaskListsByUser(userId: string) {
    try {
      return await TaskList.find({ 
        $or: [
          { assignedTo: userId },
          { 'tasks.assignedTo': userId }
        ]
      })
        .populate('assignedTo', 'fullName role')
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('tasks.completedBy', 'fullName role')
        .populate('tasks.assignedTo', 'fullName role')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error getting task lists by user: ${error}`);
    }
 }

  // Получение списков задач по статусу
  async getTaskListsByStatus(status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled') {
    try {
      return await TaskList.find({ status })
        .populate('assignedTo', 'fullName role')
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('tasks.completedBy', 'fullName role')
        .populate('tasks.assignedTo', 'fullName role')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error getting task lists by status: ${error}`);
    }
  }

  // Получение списков задач по приоритету
  async getTaskListsByPriority(priority: 'low' | 'medium' | 'high' | 'urgent') {
    try {
      return await TaskList.find({ priority })
        .populate('assignedTo', 'fullName role')
        .populate('createdBy', 'fullName role')
        .populate('updatedBy', 'fullName role')
        .populate('tasks.completedBy', 'fullName role')
        .populate('tasks.assignedTo', 'fullName role')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error getting task lists by priority: ${error}`);
    }
  }

  // Обновление статуса задачи внутри списка
 async updateTaskStatus(taskListId: string, taskId: number, completed: boolean, completedBy?: string) {
    try {
      const taskList = await TaskList.findById(taskListId);
      if (!taskList) {
        throw new Error('Task list not found');
      }

      if (taskId < 0 || taskId >= taskList.tasks.length) {
        throw new Error('Task not found in task list');
      }

      // Обновляем задачу
      taskList.tasks[taskId].completed = completed;
      if (completed) {
        taskList.tasks[taskId].completedAt = new Date() as any;
        if (completedBy) {
          taskList.tasks[taskId].completedBy = new Types.ObjectId(completedBy);
        }
      } else {
        taskList.tasks[taskId].completedAt = undefined;
        taskList.tasks[taskId].completedBy = undefined;
      }

      // Проверяем, все ли задачи выполнены
      const allTasksCompleted = taskList.tasks.every(task => task.completed);
      if (allTasksCompleted && taskList.tasks.length > 0) {
        taskList.status = 'completed';
        taskList.completedAt = new Date() as any;
      } else if (taskList.status === 'completed' && !allTasksCompleted) {
        // Если были выполнены, но теперь не все выполнены, меняем статус обратно
        taskList.status = 'in_progress';
        taskList.completedAt = undefined;
      }

      taskList.updatedBy = new Types.ObjectId(completedBy || taskList.createdBy.toString());
      return await taskList.save();
    } catch (error) {
      throw new Error(`Error updating task status: ${error}`);
    }
 }

  // Добавление новой задачи в список
  async addTaskToList(taskListId: string, taskData: any) {
    try {
      const taskList = await TaskList.findById(taskListId);
      if (!taskList) {
        throw new Error('Task list not found');
      }

      // Добавляем новую задачу
      taskList.tasks.push({
        title: taskData.title,
        description: taskData.description,
        completed: false,
        assignedTo: taskData.assignedTo ? new Types.ObjectId(taskData.assignedTo) : undefined,
        dueDate: taskData.dueDate,
        priority: taskData.priority || 'medium',
        notes: taskData.notes,
        attachments: taskData.attachments || []
      });

      return await taskList.save();
    } catch (error) {
      throw new Error(`Error adding task to list: ${error}`);
    }
  }

  // Удаление задачи из списка
 async removeTaskFromList(taskListId: string, taskId: number) {
    try {
      const taskList = await TaskList.findById(taskListId);
      if (!taskList) {
        throw new Error('Task list not found');
      }

      if (taskId < 0 || taskId >= taskList.tasks.length) {
        throw new Error('Task not found in task list');
      }

      // Удаляем задачу
      taskList.tasks.splice(taskId, 1);

      // Если все задачи были выполнены, но теперь список пуст или есть невыполненные задачи,
      // обновляем статус
      if (taskList.status === 'completed' && taskList.tasks.length > 0) {
        taskList.status = 'in_progress';
        taskList.completedAt = undefined;
      }

      return await taskList.save();
    } catch (error) {
      throw new Error(`Error removing task from list: ${error}`);
    }
  }

  // Получение статистики по спискам задач
  async getTaskListStatistics() {
    try {
      const totalTaskLists = await TaskList.countDocuments();
      const todoTaskLists = await TaskList.countDocuments({ status: 'todo' });
      const inProgressTaskLists = await TaskList.countDocuments({ status: 'in_progress' });
      const reviewTaskLists = await TaskList.countDocuments({ status: 'review' });
      const completedTaskLists = await TaskList.countDocuments({ status: 'completed' });
      const cancelledTaskLists = await TaskList.countDocuments({ status: 'cancelled' });
      
      // Подсчет задач по статусам
      const taskLists = await TaskList.find({});
      let totalTasks = 0;
      let completedTasks = 0;
      
      for (const taskList of taskLists) {
        totalTasks += taskList.tasks.length;
        completedTasks += taskList.tasks.filter(task => task.completed).length;
      }
      
      return {
        totalTaskLists,
        todo: todoTaskLists,
        inProgress: inProgressTaskLists,
        review: reviewTaskLists,
        completed: completedTaskLists,
        cancelled: cancelledTaskLists,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks
      };
    } catch (error) {
      throw new Error(`Error getting task list statistics: ${error}`);
    }
  }
}

// Экземпляр сервиса для использования в контроллерах
export const taskListService = new TaskListService();