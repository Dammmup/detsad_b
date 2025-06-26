import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CommentSchema: Schema = new Schema<IComment>({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: true });

export default mongoose.model<IComment>('Comment', CommentSchema, 'comments');
