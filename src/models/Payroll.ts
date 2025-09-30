import mongoose, { Schema, Document } from 'mongoose';


/**
 * Модель Payroll (зарплата сотрудника за месяц)
 *
 * - staffId: сотрудник
 * - month: месяц (YYYY-MM)
 * - accruals: начисления (оклад, надбавки)
 * - deductions: вычеты (налоги, удержания)
 * - bonuses: премии
 * - total: итог к выплате (accruals + bonuses - deductions - штрафы)
 * - status: статус (draft, approved, paid)
 * - history: история изменений
 * - createdAt, updatedAt: служебные поля
 *
 * Детализация штрафов берётся из коллекции Fine по staffId и периоду.
 */
export interface IPayroll extends Document {
  staffId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  accruals: number;
  deductions: number;
  bonuses: number;
  penalties: number;
  total: number;
  status: 'draft' | 'approved' | 'paid';
  history: Array<{
    date: Date;
    action: string;
    amount?: number;
    comment?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  
  // Дополнительные поля для детализации расчета
  baseSalary?: number;        // базовая зарплата
  baseSalaryType?: 'day' | 'month' | 'shift'; // тип базовой зарплаты
  shiftRate?: number;         // ставка за смену
  penaltyDetails?: {          // детали штрафов
    type: 'fixed' | 'percent' | 'per_minute' | 'per_5_minutes' | 'per_10_minutes';
    amount: number;
    latePenalties?: number;    // штрафы за опоздания
    absencePenalties?: number; // штрафы за неявки
    userFines?: number;        // штрафы из профиля сотрудника
  };
}

const PayrollSchema = new Schema<IPayroll>({
  staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  accruals: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  penalties: { type: Number, default: 0 },
  bonuses: { type: Number, default: 0 },
  // Детализация штрафов берётся из коллекции Fine по staffId и периоду
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
  history: [
    {
      date: { type: Date, default: Date.now },
      action: String,
      amount: Number,
      comment: String
    }
  ],
  // Дополнительные поля для детализации расчета
  baseSalary: { type: Number, default: 0 },
  baseSalaryType: { type: String, enum: ['day', 'month', 'shift'] },
  shiftRate: { type: Number, default: 0 },
  penaltyDetails: {
    type: {
      type: String,
      enum: ['fixed', 'percent', 'per_minute', 'per_5_minutes', 'per_10_minutes']
    },
    amount: Number,
    latePenalties: Number,
    absencePenalties: Number,
    userFines: Number
  }
}, { timestamps: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
