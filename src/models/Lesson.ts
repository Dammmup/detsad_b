import mongoose, { Schema, Document } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  content: string;
  image?: string;
  linkonyoutube?: string;
  content2?: string;
  image2?: string;
  linkonyoutube2?: string;
  course: mongoose.Types.ObjectId;
  order: number; // Для сортировки уроков в курсе
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  linkonyoutube: { type: String },
  content2: { type: String },
  image2: { type: String },
  linkonyoutube2: { type: String },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ILesson>('Lesson', LessonSchema, 'lessons');
