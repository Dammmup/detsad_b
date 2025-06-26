import mongoose, { Schema, Document } from 'mongoose';
import { ILesson } from './Lesson';

export interface ICourse extends Document {
  name: string;
  image: string;
  level: string;
  duration: number;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId; // Новое поле для связи с уроком
  lessons?: ILesson[];
}

const CourseSchema: Schema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  level: { type: String, required: true },
  duration: { type: Number, required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true }, // Ссылка на урок
});

// Виртуальное поле для получения уроков курса
CourseSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
});

// Обеспечиваем, чтобы при конвертации документов в JSON уроки тоже были включены
CourseSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

CourseSchema.set('toObject', { virtuals: true });

export default mongoose.model<ICourse>('Course', CourseSchema, 'courses');
