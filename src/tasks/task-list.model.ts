import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface ITaskList extends Document {
  title: string; // Название списка задач
  description?: string; // Описание
  assignedTo?: mongoose.Types.ObjectId; // Назначен пользователю
  assignedToRole?: string; // Назначен роли
  dueDate?: Date; // Срок выполнения
  priority: 'low' | 'medium' | 'high' | 'urgent'; // Приоритет
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled'; // Статус
  tasks: {
    title: string; // Название задачи
    description?: string; // Описание задачи
    completed: boolean; // Выполнена ли задача
    completedAt?: Date; // Дата выполнения
    completedBy?: mongoose.Types.ObjectId; // Кто выполнил
    assignedTo?: mongoose.Types.ObjectId; // Назначена пользователю
    dueDate?: Date; // Срок выполнения задачи
    priority?: 'low' | 'medium' | 'high' | 'urgent'; // Приоритет задачи
    notes?: string; // Примечания
    attachments?: string[]; // Вложения
  }[]; // Задачи
  createdBy: mongoose.Types.ObjectId; // Кто создал
  updatedBy?: mongoose.Types.ObjectId; // Кто обновил
  completedAt?: Date; // Дата завершения списка
  notes?: string; // Примечания
  tags?: string[]; // Теги для поиска
  category?: string; // Категория
  createdAt: Date;
  updatedAt: Date;
}

const TaskListSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Название списка задач обязательно'],
    trim: true,
    maxlength: [200, 'Название списка задач не может превышать 200 символов'],
    index: true
  },
  description: { 
    type: String,
    maxlength: [1000, 'Описание списка задач не может превышать 1000 символов']
  },
  assignedTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  assignedToRole: { 
    type: String,
    trim: true,
    maxlength: [50, 'Роль не может превышать 50 символов'],
    index: true
  },
  dueDate: { 
    type: Date,
    index: true
  },
  priority: {
    type: String,
    required: [true, 'Приоритет списка задач обязателен'],
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    required: [true, 'Статус списка задач обязателен'],
    enum: ['todo', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'todo',
    index: true
  },
  tasks: [{
    title: { 
      type: String,
      required: [true, 'Название задачи обязательно'],
      trim: true,
      maxlength: [200, 'Название задачи не может превышать 200 символов']
    },
    description: { 
      type: String,
      maxlength: [1000, 'Описание задачи не может превышать 1000 символов']
    },
    completed: { 
      type: Boolean, 
      default: false,
      index: true
    },
    completedAt: { 
      type: Date,
      index: true
    },
    completedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      index: true
    },
    assignedTo: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      index: true
    },
    dueDate: { 
      type: Date,
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    notes: {
      type: String,
      maxlength: [500, 'Примечания не могут превышать 500 символов']
    },
    attachments: [{ 
      type: String 
    }]
  }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Создатель списка задач обязателен'],
    index: true
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  completedAt: { 
    type: Date,
    index: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Примечания не могут превышать 1000 символов']
  },
  tags: [{ 
    type: String,
    trim: true,
    maxlength: [50, 'Тег не может превышать 50 символов'],
    index: true
  }],
  category: { 
    type: String,
    trim: true,
    maxlength: [100, 'Категория не может превышать 100 символов'],
    index: true
  }
}, { timestamps: true });

// Индексы для поиска
TaskListSchema.index({ title: 'text', description: 'text' });
TaskListSchema.index({ assignedTo: 1, status: 1 });
TaskListSchema.index({ createdBy: 1, status: 1 });
TaskListSchema.index({ dueDate: 1, status: 1 });

export default mongoose.model<ITaskList>('TaskList', TaskListSchema);