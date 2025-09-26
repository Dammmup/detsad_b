import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskList extends Document {
  title: string;
  description?: string;
  completed: boolean;
  assignedTo?: mongoose.Types.ObjectId; // Ссылка на пользователя, которому назначена задача
  createdBy: mongoose.Types.ObjectId; // Ссылка на пользователя, создавшего задачу
  dueDate?: Date; // Срок выполнения задачи
 priority: 'low' | 'medium' | 'high'; // Приоритет задачи
 category?: string; // Категория задачи
  createdAt: Date;
  updatedAt: Date;
}

const TaskListSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  completed: {
    type: Boolean,
    default: false
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true,
    maxlength: 50
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
TaskListSchema.index({ assignedTo: 1 });
TaskListSchema.index({ createdBy: 1 });
TaskListSchema.index({ completed: 1 });
TaskListSchema.index({ dueDate: 1 });
TaskListSchema.index({ priority: 1 });

export default mongoose.model<ITaskList>('TaskList', TaskListSchema);