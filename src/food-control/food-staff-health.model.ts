import mongoose, { Schema, Document, Date } from 'mongoose';
import User from '../users/user.model';

export interface IFoodStaffHealth extends Document {
  staffId: mongoose.Types.ObjectId; // Ссылка на сотрудника
  examinationDate: Date; // Дата медосмотра
  nextExaminationDate: Date; // Дата следующего медосмотра
  doctorName: string; // Имя врача
  medicalInstitution: string; // Медицинское учреждение
  healthStatus: string; // Состояние здоровья
  sanitaryBookNumber?: string; // Номер санитарной книжки
  notes?: string; // Примечания
  documents?: string[]; // Пути к документам
  createdAt: Date;
  updatedAt: Date;
}

const FoodStaffHealthSchema: Schema = new Schema({
  staffId: { 
    type: Schema.Types.ObjectId, 
    ref: 'users',
    required: [true, 'ID сотрудника обязателен'],
    unique: true,
    index: true
  },
  examinationDate: { 
    type: Date, 
    required: [true, 'Дата медосмотра обязательна'],
    index: true
  },
  nextExaminationDate: { 
    type: Date, 
    required: [true, 'Дата следующего медосмотра обязательна']
  },
  doctorName: { 
    type: String, 
    required: [true, 'Имя врача обязательно'],
    trim: true,
    maxlength: [100, 'Имя врача не может превышать 100 символов']
  },
  medicalInstitution: { 
    type: String, 
    required: [true, 'Медицинское учреждение обязательно'],
    trim: true,
    maxlength: [200, 'Медицинское учреждение не может превышать 200 символов']
  },
  healthStatus: { 
    type: String,
    required: [true, 'Состояние здоровья обязательно'],
    trim: true,
    maxlength: [500, 'Состояние здоровья не может превышать 500 символов']
  },
  sanitaryBookNumber: { 
    type: String,
    trim: true,
    maxlength: [50, 'Номер санитарной книжки не может превышать 50 символов']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Примечания не могут превышать 1000 символов']
  },
  documents: [{
    type: String
  }]
}, { timestamps: true });

export default mongoose.model<IFoodStaffHealth>('foodStaffHealth', FoodStaffHealthSchema);