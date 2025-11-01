import Task from './model';
import { ITask } from './model';
import User from '../users/model'; // Using the user model

export class TaskListService {
  async getAll(filters: { assignedTo?: string, assignedBy?: string, status?: string, priority?: string, category?: string, dueDate?: string, startDate?: string, endDate?: string }, userId?: string) {
    const filter: any = {};
    
    // Если указан userId, фильтруем задачи, которые предназначены конкретно для этого пользователя
    if (userId) {
      // Задачи, которые назначены конкретному пользователю ИЛИ задачи, которые не назначены никому (видны всем)
      filter.$or = [
        { assignedToSpecificUser: userId },
        { assignedToSpecificUser: { $exists: false } },
        { assignedToSpecificUser: null }
      ];
    }
    
    if (filters.assignedTo) filter.assignedTo = filters.assignedTo;
    if (filters.assignedBy) filter.assignedBy = filters.assignedBy;
    if (filters.status) filter.status = filters.status;
    if (filters.priority) filter.priority = filters.priority;
    if (filters.category) filter.category = filters.category;
    
    if (filters.dueDate) {
      filter.dueDate = new Date(filters.dueDate);
    } else if (filters.startDate || filters.endDate) {
      filter.dueDate = {};
      if (filters.startDate) filter.dueDate.$gte = new Date(filters.startDate);
      if (filters.endDate) filter.dueDate.$lte = new Date(filters.endDate);
    }
    
    const tasks = await Task().find(filter)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('assignedToSpecificUser', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role')
      .sort({ dueDate: -1, priority: -1 });
    
    return tasks;
  }

  async getById(id: string) {
    const task = await Task().findById(id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('assignedToSpecificUser', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    return task;
 }

  async create(taskData: Partial<ITask>, userId: string) {
    // Проверяем обязательные поля
    if (!taskData.title) {
      throw new Error('Не указано название задачи');
    }
    if (!taskData.assignedTo) {
      throw new Error('Не указан исполнитель задачи');
    }
    if (!taskData.category) {
      throw new Error('Не указана категория задачи');
    }
    
    // Проверяем существование пользователей
    const assignedToUser = await User().findById(taskData.assignedTo);
    if (!assignedToUser) {
      throw new Error('Исполнитель задачи не найден');
    }
    
    // Проверяем, если указана конкретная цель назначения
    if (taskData.assignedToSpecificUser) {
      const specificUser = await User().findById(taskData.assignedToSpecificUser);
      if (!specificUser) {
        throw new Error('Указанный пользователь для назначения не найден');
      }
    }
    
    // Используем текущего пользователя как автора задачи
    const assignedByUser = await User().findById(userId);
    if (!assignedByUser) {
      throw new Error('Автор задачи не найден');
    }
    
    const task = new (Task())({
      ...taskData,
      assignedBy: userId // Автор задачи - текущий пользователь
    });
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('assignedToSpecificUser', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async update(id: string, data: Partial<ITask>) {
    const updatedTask = await Task().findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('assignedTo', 'fullName role')
     .populate('assignedBy', 'fullName role')
     .populate('completedBy', 'fullName role')
     .populate('cancelledBy', 'fullName role');
    
    if (!updatedTask) {
      throw new Error('Задача не найдена');
    }
    
    return updatedTask;
  }

  async delete(id: string) {
    const result = await Task().findByIdAndDelete(id);
    
    if (!result) {
      throw new Error('Задача не найдена');
    }
    
    return { message: 'Задача успешно удалена' };
  }

  async markAsCompleted(id: string, completedBy: string) {
    const task = await Task().findById(id);
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    // Проверяем, что пользователь может завершить задачу
    if (task.assignedTo.toString() !== completedBy && task.assignedBy.toString() !== completedBy) {
      throw new Error('Нет прав для завершения этой задачи');
    }
    
    // Обновляем статус задачи
    task.status = 'completed';
    task.completedAt = new Date();
    task.completedBy = completedBy as any;
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async markAsCancelled(id: string, cancelledBy: string) {
    const task = await Task().findById(id);
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    // Проверяем, что пользователь может отменить задачу
    if (task.assignedTo.toString() !== cancelledBy && task.assignedBy.toString() !== cancelledBy) {
      throw new Error('Нет прав для отмены этой задачи');
    }
    
    // Обновляем статус задачи
    task.status = 'cancelled';
    task.cancelledAt = new Date();
    task.cancelledBy = cancelledBy as any;
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async markAsInProgress(id: string) {
    const task = await Task().findById(id);
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    // Обновляем статус задачи
    task.status = 'in_progress';
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async updatePriority(id: string, priority: 'low' | 'medium' | 'high' | 'urgent') {
    const task = await Task().findById(id);
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    // Обновляем приоритет задачи
    task.priority = priority;
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async addAttachment(id: string, attachment: string) {
    const task = await Task().findById(id);
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    // Добавляем вложение к задаче
    if (!task.attachments) {
      task.attachments = [];
    }
    task.attachments.push(attachment);
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async removeAttachment(id: string, attachment: string) {
    const task = await Task().findById(id);
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    // Удаляем вложение из задачи
    if (task.attachments) {
      task.attachments = task.attachments.filter(a => a !== attachment);
    }
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async addNote(id: string, note: string) {
    const task = await Task().findById(id);
    
    if (!task) {
      throw new Error('Задача не найдена');
    }
    
    // Добавляем заметку к задаче
    if (!task.notes) {
      task.notes = '';
    }
    task.notes += `\n${new Date().toISOString()}: ${note}`;
    
    await task.save();
    
    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');
    
    return populatedTask;
  }

  async getOverdueTasks(userId?: string) {
    const today = new Date();
    
    // Формируем фильтр для поиска просроченных задач
    const filter: any = {
      dueDate: { $lt: today },
      status: { $ne: 'completed' },
      $and: [{ status: { $ne: 'cancelled' }}]
    };
    
    // Если указан userId, фильтруем задачи, назначенные конкретно этому пользователю
    if (userId) {
      filter.$or = [
        { assignedTo: userId },
        { assignedToSpecificUser: userId }
      ];
    }
    
    const tasks = await Task().find(filter)
    .populate('assignedTo', 'fullName role')
    .populate('assignedBy', 'fullName role')
    .sort({ dueDate: 1 });
    
    return tasks;
  }

  async getTasksByUser(userId: string) {
    const tasks = await Task().find({
      $or: [
        { assignedTo: userId },
        { assignedBy: userId },
        { assignedToSpecificUser: userId }  // Задачи, которые назначены конкретно этому пользователю
      ]
    })
    .populate('assignedTo', 'fullName role')
    .populate('assignedBy', 'fullName role')
    .populate('assignedToSpecificUser', 'fullName role')
    .sort({ dueDate: 1, priority: -1 });
    
    return tasks;
  }

  async getTaskStatistics() {
    const stats = await Task().aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const priorityStats = await Task().aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const categoryStats = await Task().aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const total = await Task().countDocuments();
    const overdue = await Task().countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
      $and: [{ status: { $ne: 'cancelled' }}]
    });
    
    return {
      total,
      overdue,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      byCategory: categoryStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }

  async toggleStatus(id: string, userId: string) {
    const task = await Task().findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }

    // Инвертируем статус
    task.status = task.status === 'completed' ? 'pending' : 'completed';

    // Если задача завершена, устанавливаем, кем и когда
    if (task.status === 'completed') {
      task.completedBy = userId as any;
      task.completedAt = new Date();
    } else {
      // Если статус снимается, очищаем поля
      task.completedBy = undefined;
      task.completedAt = undefined;
    }

    await task.save();

    const populatedTask = await Task().findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('assignedBy', 'fullName role')
      .populate('assignedToSpecificUser', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('cancelledBy', 'fullName role');

    return populatedTask;
  }
}