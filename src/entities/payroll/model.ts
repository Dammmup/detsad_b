import mongoose, { Schema, Document } from 'mongoose';
export interface IPayroll extends Document {
  staffId?: mongoose.Types.ObjectId;

  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  total: number;
  status: 'draft' | 'approved' | 'paid' | 'active' | 'overdue' | 'paid_rent' | 'generated';
  paymentDate?: Date;
  advance?: number;
  advanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  accruals: number;
  baseSalaryType: 'month' | 'shift';

  shiftRate?: number;
  penaltyDetails?: {
    type: string;
    amount: number;
    latePenalties?: number;
    absencePenalties?: number;
    userFines?: number;
  };

  fines?: Array<{
    amount: number;
    reason: string;
    type: string;
    notes?: string;
    date: Date;
    createdAt: Date;
  }>;
  shiftDetails?: Array<{
    date: Date;
    earnings: number;
    fines: number;
    net: number;
    reason?: string;
  }>;

  penalties?: number;
  latePenalties?: number;
  latePenaltyRate?: number;
  absencePenalties?: number;
  userFines?: number;
  history?: Array<{
    date: Date;
    action: string;
    comment?: string;
  }>;
  workedDays?: number;
  workedShifts?: number;
}

const PayrollSchema = new Schema<IPayroll>({
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },





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
    enum: ['draft', 'approved', 'paid', 'active', 'overdue', 'paid_rent', 'generated'],
    default: 'draft'
  },
  accruals: {
    type: Number,
    default: 0
  },
  baseSalaryType: {
    type: String,
    enum: ['month', 'shift'],
    default: 'month'
  },
  workedDays: { type: Number, default: 0 },
  workedShifts: { type: Number, default: 0 },

  advance: Number,
  advanceDate: Date,
  shiftRate: Number,
  penaltyDetails: {
    type: {
      type: String,
      amount: Number,
      latePenalties: Number,
      absencePenalties: Number,
      userFines: Number
    }
  },
  fines: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500
    },
    type: {
      type: String,
      required: true,
      default: 'other',
      enum: ['late', 'early_leave', 'absence', 'violation', 'other', 'manual']
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shiftDetails: [{
    date: { type: Date, required: true },
    earnings: { type: Number, required: true, default: 0 },
    fines: { type: Number, required: true, default: 0 },
    net: { type: Number, required: true, default: 0 },
    reason: String
  }],
  penalties: Number,
  latePenalties: Number,
  latePenaltyRate: Number,
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



PayrollSchema.pre('save', function (next) {
  const accruals = this.accruals || 0;
  const latePenalties = this.latePenalties || 0;
  const absencePenalties = this.absencePenalties || 0;
  const userFines = this.userFines || 0;


  this.total = Math.max(0, accruals - latePenalties - absencePenalties - userFines);


  this.penalties = latePenalties + absencePenalties + userFines;

  next();
});




export default mongoose.model<IPayroll>('Payroll', PayrollSchema, 'payrolls');