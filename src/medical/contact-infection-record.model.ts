import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface IContactInfectionRecord extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  contactWith: string; // С кем был контакт
  infectionSource: string; // Источник инфекции
  quarantineStartDate: Date; // Дата начала карантина
  quarantineEndDate: Date; // Дата окончания карантина
  doctorId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactInfectionRecordSchema: Schema = new Schema({
  childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  contactWith: { 
    type: String,
    required: true,
    maxlength: 100
  },
  infectionSource: { 
    type: String,
    required: true,
    maxlength: 100
  },
  quarantineStartDate: { 
    type: Date,
    required: true
  },
  quarantineEndDate: { 
    type: Date,
    required: true
  },
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

export default mongoose.model<IContactInfectionRecord>('contactInfectionRecords', ContactInfectionRecordSchema);