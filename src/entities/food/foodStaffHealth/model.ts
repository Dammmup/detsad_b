import mongoose, { Schema, Document } from 'mongoose';
export interface IFoodStaffHealth extends Document {
  staffId: mongoose.Types.ObjectId;
  date: Date;
  medicalCommissionDate: Date;
  medicalCommissionNumber: string;
  medicalCommissionResult: string;
  medicalCommissionNotes?: string;
  medicalCommissionAttachments?: string[];
  sanitaryMinimumDate: Date;
  sanitaryMinimumResult: string;
  sanitaryMinimumNotes?: string;
  sanitaryMinimumAttachments?: string[];
  vaccinationStatus: 'up_to_date' | 'outdated' | 'not_required';
  vaccinationNotes?: string;
  vaccinationAttachments?: string[];
  healthStatus: 'healthy' | 'conditionally_healthy' | 'temporarily_unfit' | 'permanently_unfit';
  healthNotes?: string;
  healthAttachments?: string[];
  nextMedicalCommissionDate?: Date;
  nextSanitaryMinimumDate?: Date;
  nextVaccinationDate?: Date;
  doctor: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  status: 'pending' | 'completed' | 'reviewed';
  recommendations?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FoodStaffHealthSchema = new Schema<IFoodStaffHealth>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  medicalCommissionDate: {
    type: Date,
    required: true,
    index: true
  },
  medicalCommissionNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Номер медицинской комиссии не может превышать 50 символов']
  },
  medicalCommissionResult: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Результат медицинской комиссии не может превышать 200 символов']
  },
  medicalCommissionNotes: {
    type: String,
    maxlength: [500, 'Заметки медицинской комиссии не могут превышать 500 символов']
  },
  medicalCommissionAttachments: [String],
  sanitaryMinimumDate: {
    type: Date,
    required: true,
    index: true
  },
  sanitaryMinimumResult: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Результат санминимума не может превышать 200 символов']
  },
  sanitaryMinimumNotes: {
    type: String,
    maxlength: [50, 'Заметки санминимума не могут превышать 500 символов']
  },
  sanitaryMinimumAttachments: [String],
  vaccinationStatus: {
    type: String,
    enum: ['up_to_date', 'outdated', 'not_required'],
    required: true,
    index: true
  },
  vaccinationNotes: {
    type: String,
    maxlength: [500, 'Заметки вакцинации не могут превышать 500 символов']
  },
  vaccinationAttachments: [String],
  healthStatus: {
    type: String,
    enum: ['healthy', 'conditionally_healthy', 'temporarily_unfit', 'permanently_unfit'],
    required: true,
    index: true
  },
  healthNotes: {
    type: String,
    maxlength: [500, 'Заметки состояния здоровья не могут превышать 500 символов']
  },
  healthAttachments: [String],
  nextMedicalCommissionDate: {
    type: Date,
    index: true
  },
  nextSanitaryMinimumDate: {
    type: Date,
    index: true
  },
  nextVaccinationDate: {
    type: Date,
    index: true
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не могут превышать 500 символов']
  },
  attachments: [String],
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending',
    index: true
  },
  recommendations: {
    type: String,
    maxlength: [300, 'Рекомендации не могут превышать 300 символов']
  }
}, {
  timestamps: true
});


export default mongoose.model<IFoodStaffHealth>('FoodStaffHealth', FoodStaffHealthSchema, 'food_staff_health');