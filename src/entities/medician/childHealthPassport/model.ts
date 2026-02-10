import mongoose, { Schema, Document } from 'mongoose';
export interface IChildHealthPassport extends Document {
  childId: mongoose.Types.ObjectId;
  birthDate: Date;
  birthPlace: string;
  bloodType: string;
  rhesusFactor: string;
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
  nextExaminationDate?: Date;
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChildHealthPassportSchema = new Schema<IChildHealthPassport>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    unique: true,
    index: true
  },
  birthDate: {
    type: Date,
    required: true,
    index: true
  },
  birthPlace: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Место рождения не может превышать 100 символов']
  },
  bloodType: {
    type: String,
    enum: ['A', 'B', 'AB', 'O'],
    required: true,
    index: true
  },
  rhesusFactor: {
    type: String,
    enum: ['positive', 'negative'],
    required: true,
    index: true
  },
  chronicDiseases: [{
    type: String,
    trim: true,
    maxlength: [100, 'Хроническое заболевание не может превышать 100 символов']
  }],
  allergies: [{
    type: String,
    trim: true,
    maxlength: [100, 'Аллергия не может превышать 100 символов']
  }],
  vaccinationHistory: [{
    vaccine: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Название вакцины не может превышать 100 символов'],
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    nextDate: {
      type: Date,
      index: true
    },
    notes: {
      type: String,
      maxlength: [200, 'Заметки вакцинации не могут превышать 200 символов']
    }
  }],
  doctorExaminations: [{
    doctor: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Имя врача не может превышать 100 символов'],
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    result: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Результат осмотра не может превышать 200 символов']
    },
    notes: {
      type: String,
      maxlength: [200, 'Заметки осмотра не могут превышать 200 символов']
    }
  }],
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  nextExaminationDate: {
    type: Date,
    index: true
  },
  recommendations: {
    type: String,
    maxlength: [300, 'Рекомендации не могут превышать 300 символов']
  }
}, {
  timestamps: true
});



export default mongoose.model<IChildHealthPassport>('ChildHealthPassport', ChildHealthPassportSchema, 'child_health_passports');