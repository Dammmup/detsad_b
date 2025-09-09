import mongoose, { Schema, Document } from 'mongoose';

export interface ICyclogramActivity extends Document {
  name: string;
  description?: string;
  duration: number; // в минутах
  type: 'educational' | 'physical' | 'creative' | 'rest' | 'meal' | 'hygiene' | 'outdoor';
  ageGroup: string; // например: "3-4", "4-5", "5-6"
  materials?: string[];
  goals?: string[];
  methods?: string[];
}

export interface ICyclogramTimeSlot extends Document {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  activity: ICyclogramActivity;
  dayOfWeek: number; // 1-7 (понедельник-воскресенье)
  groupId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ICyclogram extends Document {
  title: string;
  description?: string;
  ageGroup: string;
  groupId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  weekStartDate: Date;
  timeSlots: ICyclogramTimeSlot[];
  status: 'draft' | 'active' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CyclogramActivitySchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Название активности обязательно'],
    trim: true,
    maxlength: [200, 'Название активности не может превышать 200 символов']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Описание не может превышать 1000 символов']
  },
  duration: {
    type: Number,
    required: [true, 'Продолжительность обязательна'],
    min: [5, 'Минимальная продолжительность 5 минут'],
    max: [480, 'Максимальная продолжительность 8 часов']
  },
  type: {
    type: String,
    required: [true, 'Тип активности обязателен'],
    enum: ['educational', 'physical', 'creative', 'rest', 'meal', 'hygiene', 'outdoor']
  },
  ageGroup: {
    type: String,
    required: [true, 'Возрастная группа обязательна'],
    enum: ['3-4', '4-5', '5-6', '6-7']
  },
  materials: [{
    type: String,
    trim: true,
    maxlength: [100, 'Название материала не может превышать 100 символов']
  }],
  goals: [{
    type: String,
    trim: true,
    maxlength: [200, 'Цель не может превышать 200 символов']
  }],
  methods: [{
    type: String,
    trim: true,
    maxlength: [200, 'Метод не может превышать 200 символов']
  }]
});

const CyclogramTimeSlotSchema: Schema = new Schema({
  startTime: {
    type: String,
    required: [true, 'Время начала обязательно'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'Время окончания обязательно'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Неверный формат времени (HH:MM)']
  },
  activity: {
    type: CyclogramActivitySchema,
    required: [true, 'Активность обязательна']
  },
  dayOfWeek: {
    type: Number,
    required: [true, 'День недели обязателен'],
    min: [1, 'День недели должен быть от 1 до 7'],
    max: [7, 'День недели должен быть от 1 до 7']
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  }
});

const CyclogramSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: [true, 'Название циклограммы обязательно'],
    trim: true,
    maxlength: [200, 'Название циклограммы не может превышать 200 символов']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Описание не может превышать 1000 символов']
  },
  ageGroup: {
    type: String,
    required: [true, 'Возрастная группа обязательна'],
    enum: ['3-4', '4-5', '5-6', '6-7']
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Группа обязательна']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Воспитатель обязателен']
  },
  weekStartDate: {
    type: Date,
    required: [true, 'Дата начала недели обязательна']
  },
  timeSlots: [CyclogramTimeSlotSchema],
  status: {
    type: String,
    required: [true, 'Статус обязателен'],
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Создатель обязателен']
  }
}, { 
  timestamps: true 
});

// Индексы для оптимизации запросов
CyclogramSchema.index({ groupId: 1, weekStartDate: 1 });
CyclogramSchema.index({ teacherId: 1, status: 1 });
CyclogramSchema.index({ ageGroup: 1, status: 1 });

export default mongoose.model<ICyclogram>('Cyclogram', CyclogramSchema);
