import mongoose, { Schema, Document } from 'mongoose';
export interface IHealthPassport extends Document {
  childId: mongoose.Types.ObjectId;
  birthDate: Date;
  birthPlace: string;
  bloodType: string;
  rhesus: string;
  chronicDiseases: string[];
  allergies: string[];
  vaccinationHistory: Array<{
    vaccine: string;
    date: Date;
    nextDate?: Date;
    notes?: string;
  }>;
  doctorExaminations: Array<{
    doctor: string;
    date: Date;
    result: string;
    notes?: string;
  }>;
  notes?: string;
  attachments?: string[];
  status: 'active' | 'inactive' | 'archived';
  groupId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HealthPassportSchema = new Schema<IHealthPassport>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    unique: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  birthPlace: {
    type: String,
    required: true,
    trim: true
  },
  bloodType: {
    type: String,
    enum: ['A', 'B', 'AB', 'O'],
    required: true
  },
  rhesus: {
    type: String,
    enum: ['positive', 'negative'],
    required: true
  },
  chronicDiseases: [{
    type: String,
    trim: true
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  vaccinationHistory: [{
    vaccine: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    nextDate: Date,
    notes: String
  }],
  doctorExaminations: [{
    doctor: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    result: {
      type: String,
      required: true,
      trim: true
    },
    notes: String
  }],
  notes: String,
  attachments: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  }
}, {
  timestamps: true
});



export default mongoose.model<IHealthPassport>('HealthPassport', HealthPassportSchema, 'health_passports');