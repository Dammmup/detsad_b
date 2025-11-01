import mongoose, { Schema, Document, Model } from 'mongoose';
import { createModelFactory } from '../../config/database';

export interface IHoliday extends Document {
  name: string;        // Название праздника
  day: number;         // День месяца (1-31)
  month: number;       // Месяц (1-12)
  year?: number;       // Год (если праздник не повторяющийся)
  isRecurring: boolean; // Повторяется ли праздник каждый год
  description?: string; // Описание праздника
  createdAt: Date;
  updatedAt: Date;
}

// Фабрика модели Holiday
const createHolidayModel = createModelFactory<IHoliday>(
  'Holiday',
  new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    min: 2000,
    max: 2100
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
}),
'holidays',
'default'
);

// Экспортируем фабрику, которая будет создавать модель после подключения
export default createHolidayModel;