import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  day: number;
  month: number;
  year?: number;
  isRecurring: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema = new Schema({
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
});

export default mongoose.model<IHoliday>('Holiday', HolidaySchema, 'holidays');