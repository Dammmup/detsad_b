import mongoose, { Schema, Document, Date } from 'mongoose';

export interface IPayroll extends Document {
  staffId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  accruals: number;
  deductions: number;
  penalties: number;
  bonuses: number;
  total: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  baseSalary: number;
  baseSalaryType: 'day' | 'month' | 'shift';
  shiftRate: number;
  workedDays: number;
  workedShifts: number;
  latePenalties: number;
  absencePenalties: number;
  userFines: number;
 penaltyDetails: {
    type: string;
    amount: number;
    latePenalties: number;
    absencePenalties: number;
    userFines: number;
 };
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema: Schema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // YYYY-MM format
  },
  accruals: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  penalties: {
    type: Number,
    default: 0,
    min: 0
  },
  bonuses: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'paid'],
    default: 'draft'
 },
  baseSalary: {
    type: Number,
    default: 0
  },
  baseSalaryType: {
    type: String,
    enum: ['day', 'month', 'shift'],
    default: 'month'
  },
  shiftRate: {
    type: Number,
    default: 0
  },
  workedDays: {
    type: Number,
    default: 0
  },
  workedShifts: {
    type: Number,
    default: 0
  },
  latePenalties: {
    type: Number,
    default: 0
  },
  absencePenalties: {
    type: Number,
    default: 0
  },
  userFines: {
    type: Number,
    default: 0
  },
  penaltyDetails: {
    type: {
      type: String,
      default: 'per_5_minutes'
    },
    amount: {
      type: Number,
      default: 0
    },
    latePenalties: {
      type: Number,
      default: 0
    },
    absencePenalties: {
      type: Number,
      default: 0
    },
    userFines: {
      type: Number,
      default: 0
    }
 }
}, { timestamps: true });

export default mongoose.model<IPayroll>('payrolls', PayrollSchema);