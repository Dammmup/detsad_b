import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  description?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  owner: mongoose.Types.ObjectId;
  category: string;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  fileName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  fileType: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true 
  },
  owner: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  tags: [String],
}, { 
  timestamps: true 
});


export default mongoose.model<IDocument>('Document', DocumentSchema, 'documents');