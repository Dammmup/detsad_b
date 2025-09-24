import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  staffId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  accruals: number; // начисления
  deductions: number; // вычеты
  bonuses: number; // премии
  fines: Array<{ // штрафы
    date: Date;
    type: string;
    amount: number;
    comment: string;
  }>
  penalties: number; // штрафы
  userFines?: number; // штрафы из профиля пользователя
  total: number; // итог к выплате
  status: 'draft' | 'approved' | 'paid';
  history: Array<{
    date: Date;
    action: string;
    amount?: number;
    comment?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>({
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  accruals: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  bonuses: { type: Number, default: 0 },
  fines: [
    {
      date: { type: Date, default: Date.now },
      type: String, // например, 'late', 'absence', 'other'
      amount: Number,
      comment: String
    }
  ],
  penalties: { type: Number, default: 0 },
  userFines: { type: Number, default: 0 }, // штрафы из профиля пользователя
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
  history: [
    {
      date: { type: Date, default: Date.now },
      action: String,
      amount: Number,
      comment: String
    }
  ]
}, { timestamps: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
