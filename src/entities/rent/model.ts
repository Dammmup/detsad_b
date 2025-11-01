import mongoose, { Schema, Document } from 'mongoose';
import { createModelFactory } from '../../config/database';
import { IUser } from '../users/model';

export interface IRent extends Document {
  tenantId: mongoose.Types.ObjectId; // Ссылка на пользователя-арендатора
  period: string; // период аренды в формате YYYY-MM
  amount: number; // Сумма аренды
  total: number; // Общая сумма к оплате
  status: 'active' | 'overdue' | 'paid' | 'draft'; // Статус аренды
  latePenalties?: number; // Штрафы за просрочку
  absencePenalties?: number; // Штрафы за неявки
  penalties?: number; // Общие штрафы
  latePenaltyRate?: number; // Ставка штрафа за просрочку
  accruals?: number; // Начисления
  paidAmount?: number; // Оплаченная сумма
  paymentDate?: Date; // Дата оплаты
  createdAt: Date;
  updatedAt: Date;
}

const RentSchema = new Schema<IRent>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    type: String,
    required: true
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
  paidAmount: Number,
  paymentDate: Date,
}, {
  timestamps: true
});

// Создаем фабрику модели для отложенного создания модели после подключения к базе данных
const createRentModel = createModelFactory<IRent>(
  'Rent',
  RentSchema,
  'rents',
  'default'
);

// Экспортируем фабрику, которая будет создавать модель после подключения
export default createRentModel;