import mongoose, { Schema, Document } from 'mongoose';

export type PostCategory = 'question' | 'discussion' | 'news' | 'history';

export interface IPost extends Document {
  title: string;
  content: string;
  category: PostCategory;
  author: mongoose.Types.ObjectId;
  comments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['question', 'discussion', 'news', 'history'],
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
);

export default mongoose.model<IPost>('Post', PostSchema, 'posts');
