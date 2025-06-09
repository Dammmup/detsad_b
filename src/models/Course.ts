import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
  language: string;
  image: string;
  level: string;
  duration: number;
  content: string;
  price: number;
  createdBy: mongoose.Types.ObjectId;
}

const CourseSchema: Schema = new Schema({
  name: { type: String, required: true },
  language: { type: String, required: true },
  image: { type: String, required: true },
  level: { type: String, required: true },
  duration: { type: Number, required: true },
  content: { type: String, required: true },
  price: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

export default mongoose.model<ICourse>('Course', CourseSchema);
