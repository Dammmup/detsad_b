import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';
import User from '../users/user.model';

export interface IMedicalJournal extends Document {
  childId: mongoose.Types.ObjectId;
  date: Date;
  temperature: number;
  generalCondition: string;
  skinCondition: string;
  mucousMembranes: string;
  lymphNodes: string;
  throat: string;
  breathing: string;
  heartSounds: string;
  stomach: string;
  liver: string;
  stool: string;
  urination: string;
  neurologicalStatus: string;
  diagnosis: string;
  recommendations: string;
  doctorId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalJournalSchema: Schema = new Schema({
  childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  temperature: { 
    type: Number,
    required: true,
    min: 30,
    max: 45
  },
  generalCondition: { 
    type: String,
    required: true,
    maxlength: 200
  },
  skinCondition: { 
    type: String,
    required: true,
    maxlength: 200
  },
  mucousMembranes: { 
    type: String,
    required: true,
    maxlength: 200
  },
  lymphNodes: { 
    type: String,
    required: true,
    maxlength: 200
  },
  throat: { 
    type: String,
    required: true,
    maxlength: 200
  },
  breathing: { 
    type: String,
    required: true,
    maxlength: 200
  },
  heartSounds: { 
    type: String,
    required: true,
    maxlength: 200
  },
  stomach: { 
    type: String,
    required: true,
    maxlength: 200
  },
  liver: { 
    type: String,
    required: true,
    maxlength: 200
  },
  stool: { 
    type: String,
    required: true,
    maxlength: 200
  },
  urination: { 
    type: String,
    required: true,
    maxlength: 200
  },
  neurologicalStatus: { 
    type: String,
    required: true,
    maxlength: 200
  },
  diagnosis: { 
    type: String,
    required: true,
    maxlength: 500
  },
  recommendations: { 
    type: String,
    required: true,
    maxlength: 500
  },
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: true 
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, { timestamps: true });

export default mongoose.model<IMedicalJournal>('medicalJournals', MedicalJournalSchema);