import mongoose, { Schema, Document } from 'mongoose';

export interface IChild extends Document {
  fullName: string;
  iin?: string;
  birthday?: Date;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  groupId?: mongoose.Types.ObjectId;
  // Медицинские данные
  gender?: string;
  clinic?: string;
  bloodGroup?: string;
  rhesus?: string;
  disability?: string;
  dispensary?: string;
  diagnosis?: string;
  allergy?: string;
  infections?: string;
  hospitalizations?: string;
  incapacity?: string;
  checkups?: string;
  // Прочее
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChildSchema = new Schema<IChild>({
  fullName: { type: String, required: true },
  iin: String,
  birthday: Date,
  address: String,
  parentName: String,
  parentPhone: String,
  groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
  gender: String,
  clinic: String,
  bloodGroup: String,
  rhesus: String,
  disability: String,
  dispensary: String,
  diagnosis: String,
  allergy: String,
  infections: String,
  hospitalizations: String,
  incapacity: String,
  checkups: String,
  notes: String,
}, { timestamps: true });

export default mongoose.model<IChild>('Child', ChildSchema, 'children');
