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

  // New fields from Form 052-2/у
  gender?: string;
  address?: string;
  clinic?: string;
  disability?: string;
  dispensary?: string;
  diagnosis?: string;
  infections?: string;
  hospitalizations?: string;
  incapacity?: string;
  checkups?: string;

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
    maxlength: [200, 'Место рождения не может превышать 200 символов']
  },
  bloodType: {
    type: String,
    enum: ['A', 'B', 'AB', 'O', ''],
    default: '',
    index: true
  },
  rhesusFactor: {
    type: String,
    enum: ['positive', 'negative', ''],
    default: '',
    index: true
  },
  chronicDiseases: [{
    type: String,
    trim: true,
    maxlength: [200, 'Хроническое заболевание не может превышать 200 символов']
  }],
  allergies: [{
    type: String,
    trim: true,
    maxlength: [200, 'Аллергия не может превышать 200 символов']
  }],
  vaccinationHistory: [{
    vaccine: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Название вакцины не может превышать 200 символов'],
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
      maxlength: [500, 'Заметки вакцинации не могут превышать 500 символов']
    }
  }],
  doctorExaminations: [{
    doctor: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Имя врача не может превышать 200 символов'],
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
      maxlength: [500, 'Результат осмотра не может превышать 500 символов']
    },
    notes: {
      type: String,
      maxlength: [500, 'Заметки осмотра не могут превышать 500 символов']
    }
  }],
  notes: {
    type: String,
    maxlength: [2000, 'Заметки не могут превышать 2000 символов']
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
    maxlength: [1000, 'Рекомендации не могут превышать 1000 символов']
  },

  // New fields from Form 052-2/у
  gender: String,
  address: String,
  clinic: String,
  disability: String,
  dispensary: String,
  diagnosis: String,
  infections: String,
  hospitalizations: String,
  incapacity: String,
  checkups: String,
}, {
  timestamps: true
});



export default mongoose.model<IChildHealthPassport>('ChildHealthPassport', ChildHealthPassportSchema, 'child_health_passports');