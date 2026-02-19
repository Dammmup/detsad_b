import Task, { ITask } from './model';
import User from '../users/model';

const TASK_POPULATE_FIELDS = [
  { path: 'assignedTo', select: 'fullName role' },
  { path: 'assignedBy', select: 'fullName role' },
  { path: 'assignedToSpecificUser', select: 'fullName role' },
  { path: 'completedBy', select: 'fullName role' },
  { path: 'cancelledBy', select: 'fullName role' }
];

function populateTask(query: any) {
  return TASK_POPULATE_FIELDS.reduce((q, field) => q.populate(field.path, field.select), query);
}

export class TaskListService {
  async getAll(filters: { assignedTo?: string, assignedBy?: string, status?: string, priority?: string, category?: string, dueDate?: string, startDate?: string, endDate?: string }, userId?: string) {
    const filter: any = {};


    if (userId) {

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

    const tasks = await populateTask(Task.find(filter))
      .sort({ dueDate: -1, priority: -1 });

    return tasks;
  }

  async getById(id: string) {
    const task = await populateTask(Task.findById(id));

    if (!task) {
      throw new Error('Задача не найдена');
    }

    return task;
  }

  async create(taskData: Partial<ITask>, userId: string) {

    if (!taskData.title) {
      throw new Error('Не указано название задачи');
    }
    if (!taskData.assignedTo) {
      throw new Error('Не указан исполнитель задачи');
    }
    if (!taskData.category) {
      throw new Error('Не указана категория задачи');
    }


    const assignedToUser = await User.findById(taskData.assignedTo);
    if (!assignedToUser) {
      throw new Error('Исполнитель задачи не найден');
    }


    if (taskData.assignedToSpecificUser) {
      const specificUser = await User.findById(taskData.assignedToSpecificUser);
      if (!specificUser) {
        throw new Error('Указанный пользователь для назначения не найден');
      }
    }


    const assignedByUser = await User.findById(userId);
    if (!assignedByUser) {
      throw new Error('Автор задачи не найден');
    }

    const task = new Task({
      ...taskData,
      assignedBy: userId
    });

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    // Отправляем push-уведомление всем сотрудникам о новой задаче
    try {
      console.log('Начинаем отправку push-уведомления о новой задаче...', {
        taskId: task._id,
        taskTitle: task.title,
        assignedTo: task.assignedTo
      });

      const PushNotificationServiceModule = await import('../../services/pushNotificationService');
      const PushNotificationService = PushNotificationServiceModule.PushNotificationService;
      const title = 'Новая задача';
      const body = `Создана новая задача: "${task.title}"`;
      const url = `/tasks`; // URL страницы задач

      console.log('Отправляем уведомление всем активным пользователям...');
      // Отправляем уведомление всем активным пользователям
      await PushNotificationService.broadcastNotification(null, title, body, url);
      console.log('Уведомления успешно отправлены');
    } catch (notificationError) {
      console.error('Ошибка при отправке push-уведомления о новой задаче:', notificationError);
      // Не прерываем создание задачи, если не удалось отправить уведомление
    }

    return populatedTask;
  }

  async update(id: string, data: Partial<ITask>) {
    const updatedTask = await populateTask(
      Task.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true, runValidators: true })
    );

    if (!updatedTask) {
      throw new Error('Задача не найдена');
    }

    return updatedTask;
  }

  async delete(id: string) {
    const result = await Task.findByIdAndDelete(id);

    if (!result) {
      throw new Error('Задача не найдена');
    }

    return { message: 'Задача успешно удалена' };
  }

  async markAsCompleted(id: string, completedBy: string) {
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    if (task.assignedTo.toString() !== completedBy && task.assignedBy.toString() !== completedBy) {
      throw new Error('Нет прав для завершения этой задачи');
    }


    task.status = 'completed';
    task.completedAt = new Date();
    task.completedBy = completedBy as any;

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }

  async markAsCancelled(id: string, cancelledBy: string) {
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    if (task.assignedTo.toString() !== cancelledBy && task.assignedBy.toString() !== cancelledBy) {
      throw new Error('Нет прав для отмены этой задачи');
    }


    task.status = 'cancelled';
    task.cancelledAt = new Date();
    task.cancelledBy = cancelledBy as any;

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }

  async markAsInProgress(id: string) {
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    task.status = 'in_progress';

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }

  async updatePriority(id: string, priority: 'low' | 'medium' | 'high' | 'urgent') {
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    task.priority = priority;

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }

  async addAttachment(id: string, attachment: string) {
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    if (!task.attachments) {
      task.attachments = [];
    }
    task.attachments.push(attachment);

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }

  async removeAttachment(id: string, attachment: string) {
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    if (task.attachments) {
      task.attachments = task.attachments.filter(a => a !== attachment);
    }

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }

  async addNote(id: string, note: string) {
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    if (!task.notes) {
      task.notes = '';
    }
    task.notes += `\n${new Date().toISOString()}: ${note}`;

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }

  async getOverdueTasks(userId?: string) {
    const today = new Date();


    const filter: any = {
      dueDate: { $lt: today },
      status: { $nin: ['completed', 'cancelled'] }
    };


    if (userId) {
      filter.$or = [
        { assignedTo: userId },
        { assignedToSpecificUser: userId }
      ];
    }

    const tasks = await populateTask(Task.find(filter))
      .sort({ dueDate: 1 });

    return tasks;
  }

  async getTasksByUser(userId: string) {
    const tasks = await populateTask(Task.find({
      $or: [
        { assignedTo: userId },
        { assignedBy: userId },
        { assignedToSpecificUser: userId }
      ]
    })).sort({ dueDate: 1, priority: -1 });

    return tasks;
  }

  async getTaskStatistics() {
    const stats = await Task.aggregate([
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

    const priorityStats = await Task.aggregate([
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

    const categoryStats = await Task.aggregate([
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

    const total = await Task.countDocuments();
    const overdue = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
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
    const task = await Task.findById(id);

    if (!task) {
      throw new Error('Задача не найдена');
    }


    task.status = task.status === 'completed' ? 'pending' : 'completed';


    if (task.status === 'completed') {
      task.completedBy = userId as any;
      task.completedAt = new Date();
    } else {

      task.completedBy = undefined;
      task.completedAt = undefined;
    }

    await task.save();

    const populatedTask = await populateTask(Task.findById(task._id));

    return populatedTask;
  }
}