import mongoose, { Schema, Document } from 'mongoose';

// Определение типов блоков контента
export enum ContentBlockType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  LINK = 'link',
  SPACER = 'spacer',
  CODE = 'code',
  QUOTE = 'quote'
}

// Интерфейс для блока контента
export interface IContentBlock {
  type: ContentBlockType;
  content: string;
  order: number;
  // Дополнительные свойства для разных типов блоков
  caption?: string;
  url?: string;
  language?: string; // для блоков кода
}

// Схема для блока контента
const ContentBlockSchema = new Schema({
  type: { type: String, enum: Object.values(ContentBlockType), required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true },
  caption: { type: String },
  url: { type: String },
  language: { type: String }
});

// Основной интерфейс урока
export interface ILesson extends Document {
  title: string;
  description: string;
  contentBlocks: IContentBlock[];
  course: mongoose.Types.ObjectId;
  order: number; // Для сортировки уроков в курсе
  createdAt: Date;
  updatedAt: Date;
}

// Схема урока с динамическими блоками контента
const LessonSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  contentBlocks: [ContentBlockSchema],
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ILesson>('Lesson', LessonSchema, 'lessons');
