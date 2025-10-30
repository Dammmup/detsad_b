import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  staffId?: mongoose.Types.ObjectId; // Может быть undefined для аренды
  // tenant?: boolean; // Для арендаторов - поле перемещено в сущность staff
  period: string; // например, '2025-01'
  baseSalary: number;
  bonuses: number;
 deductions: number;
 total: number;
  status: 'draft' | 'approved' | 'paid' | 'active' | 'overdue' | 'paid_rent'; // Добавляем статусы для аренды
  paymentDate?: Date;
  advance?: number; // Аванс
  advanceDate?: Date; // Дата аванса
  createdAt: Date;
 updatedAt: Date;
 accruals: number;
 baseSalaryType: string;
  // Дополнительные поля
  shiftRate?: number;
  penaltyDetails?: {
    type: string;
    amount: number;
    latePenalties?: number;
    absencePenalties?: number;
    userFines?: number;
 };
  // Поля для штрафов, добавленные для совместимости с payrollAutomationService
 penalties?: number;
 latePenalties?: number;
  absencePenalties?: number;
  userFines?: number;
  history?: Array<{
    date: Date;
    action: string;
    comment?: string;
  }>;
}

const PayrollSchema = new Schema<IPayroll>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true  // Убираем required: true, так как может быть undefined для аренды
  },
  // tenant: {
  //   type: Boolean,
  //   default: false,
  //   index: true // Добавляем поле tenant для арендаторов
  // },
  period: {
    type: String,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  bonuses: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'paid', 'active', 'overdue', 'paid_rent'], // Добавляем статусы для аренды
    default: 'draft'
  },
  accruals: {
    type: Number,
    default: 0
  },
  baseSalaryType: {
    type: String,
  },
  // Дополнительные поля
  advance: Number, // Аванс
  advanceDate: Date, // Дата аванса
  shiftRate: Number,
  penaltyDetails: {
    type: String,
    amount: Number
 },
  penalties: Number,
  latePenalties: Number,
  absencePenalties: Number,
  userFines: Number,
  history: [{
    date: Date,
    action: String,
    comment: String
 }],
  paymentDate: Date,
}, {
  timestamps: true
});

export default mongoose.model<IPayroll>('Payroll', PayrollSchema, 'payrolls');