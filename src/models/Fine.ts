import { Schema, model, Document } from 'mongoose';

export interface IFine extends Document {
  user: Schema.Types.ObjectId;
  amount: number;
  reason: string;
  type: 'late' | 'other';
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FineSchema = new Schema<IFine>(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0
    },
    reason: { 
      type: String, 
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['late', 'other'],
      required: true
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for faster queries on user and date
FineSchema.index({ user: 1, date: -1 });

// Update user's totalFines when a fine is saved
FineSchema.post('save', async function(doc) {
  const User = model('User');
  const totalFines = await this.model('Fine').aggregate([
    { $match: { user: doc.user } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  await User.findByIdAndUpdate(doc.user, { 
    totalFines: totalFines[0]?.total || 0 
  });
});



export default model<IFine>('Fine', FineSchema);
