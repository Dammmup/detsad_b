import mongoose, { Schema, Document, Date } from 'mongoose';
import Child from '../children/child.model';

export interface IHealthPassport extends Document {
  childId: mongoose.Types.ObjectId;
  medicalExaminationDate: Date;
  nextExaminationDate: Date;
  doctorName: string;
  medicalInstitution: string;
  healthStatus: string;
  vaccinationStatus: string;
  notes?: string;
  documents?: string[]; // Пути к документам
  createdAt: Date;
  updatedAt: Date;
}

const HealthPassportSchema: Schema = new Schema({
 childId: { 
    type: Schema.Types.ObjectId, 
    ref: 'children',
    required: true 
  },
 medicalExaminationDate: { 
    type: Date, 
    required: true 
  },
  nextExaminationDate: { 
    type: Date,
    required: true
  },
  doctorName: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  medicalInstitution: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  healthStatus: { 
    type: String,
    required: true,
    maxlength: 500
  },
  vaccinationStatus: { 
    type: String,
    required: true,
    maxlength: 500
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  documents: [{
    type: String
  }]
}, { timestamps: true });

export default mongoose.model<IHealthPassport>('healthPassports', HealthPassportSchema);