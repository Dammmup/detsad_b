import mongoose, { Schema, Document } from 'mongoose';
import { IChild } from '../children/model';
import { IUser } from '../users/model';

export interface IChildPayment extends Document {
  childId?: mongoose.Types.ObjectId; // Ссылка на ребенка, если оплата от ребенка
  userId?: mongoose.Types.ObjectId; // Ссылка на пользователя, если оплата от другого пользователя
  period: {
    start: Date;
    end: Date;
  }; // период оплаты в виде объекта с датами начала и конца
  amount: number; // Сумма оплаты
  total: number; // Общая сумма к оплате
  status: 'active' | 'overdue' | 'paid' | 'draft'; // Статус оплаты
 latePenalties?: number; // Штрафы за просрочку
  absencePenalties?: number; // Штрафы за неявки
  penalties?: number; // Общие штрафы
 latePenaltyRate?: number; // Ставка штрафа за просрочку
 accruals?: number; // Надбавки
  deductions?: number; // Вычеты
  comments?: string; // Комментарии
  paidAmount?: number; // Оплаченная сумма
  paymentDate?: Date; // Дата оплаты
  createdAt: Date;
  updatedAt: Date;
}

const ChildPaymentSchema = new Schema<IChildPayment>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  amount: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'overdue', 'paid', 'draft'],
    default: 'active'
  },
  latePenalties: Number,
  absencePenalties: Number,
  penalties: Number,
  latePenaltyRate: Number,
  accruals: Number,
  deductions: Number,
  comments: String,
  paidAmount: Number,
  paymentDate: Date,
}, {
  timestamps: true
});

// Валидация: либо childId, либо userId должен быть указан
ChildPaymentSchema.pre('validate', function(next) {
  if (!this.childId && !this.userId) {
    this.invalidate('childId', 'Either childId or userId must be specified');
  }
  next();
});

export default mongoose.model<IChildPayment>('ChildPayment', ChildPaymentSchema, 'childPayments');