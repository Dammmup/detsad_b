import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
 assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedToSpecificUser?: mongoose.Types.ObjectId; // Назначение задачи конкретному сотруднику
 dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  attachments?: string[];
  notes?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  cancelledBy?: mongoose.Types.ObjectId;
  createdAt: Date;
 updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { 
    type: String, 
    required: [true, 'Название задачи обязательно'],
    trim: true,
    maxlength: [200, 'Название задачи не может превышать 200 символов']
  },
  description: {
    type: String,
    maxlength: [1000, 'Описание не может превышать 1000 символов']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Укажите исполнителя задачи'],
    index: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Укажите автора задачи'],
    index: true
  },
  assignedToSpecificUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true  // Добавляем индекс для оптимизации поиска
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
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  category: {
    type: String,
    required: [true, 'Категория задачи обязательна'],
    trim: true,
    maxlength: [50, 'Категория не может превышать 50 символов'],
    index: true
  },
  attachments: [String],
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  completedAt: Date,
  cancelledAt: Date,
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});



// Виртуальные поля
TaskSchema.virtual('isOverdue').get(function(this: ITask) {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') return false;
  return this.dueDate < new Date();
});

TaskSchema.virtual('daysUntilDue').get(function(this: ITask) {
  if (!this.dueDate) return null;
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 24));
});

// Методы для работы с задачами
TaskSchema.methods.markAsCompleted = function(completedBy: mongoose.Types.ObjectId) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completedBy = completedBy;
  return this.save();
};

TaskSchema.methods.markAsCancelled = function(cancelledBy: mongoose.Types.ObjectId) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  return this.save();
};

TaskSchema.methods.markAsInProgress = function() {
  this.status = 'in_progress';
  return this.save();
};

TaskSchema.methods.updatePriority = function(priority: 'low' | 'medium' | 'high' | 'urgent') {
  this.priority = priority;
  return this.save();
};

TaskSchema.methods.addAttachment = function(attachment: string) {
  if (!this.attachments) {
    this.attachments = [];
  }
  this.attachments.push(attachment);
  return this.save();
};

TaskSchema.methods.removeAttachment = function(attachment: string) {
  if (this.attachments) {
    this.attachments = this.attachments.filter((a: string) => a !== attachment);
    return this.save();
  }
};

TaskSchema.methods.addNote = function(note: string) {
  if (!this.notes) {
    this.notes = '';
  }
  this.notes += `\n${new Date().toISOString()}: ${note}`;
  return this.save();
};

export default mongoose.model<ITask>('Task', TaskSchema, 'tasks');