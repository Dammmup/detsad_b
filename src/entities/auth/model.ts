import mongoose, { Schema, Document } from 'mongoose';



import { IUser } from '../../entities/users/model';


export interface IFine extends Document {
  amount: number;
  reason: string;
  date: Date;
  type: 'late' | 'other';
  approved: boolean;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  active: boolean;
}


