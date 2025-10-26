import mongoose, { Schema, Document } from 'mongoose';

// Используем существующий интерфейс IUser из основной модели пользователей
// чтобы избежать дублирования кода
import { IUser } from '../../entities/users/model';

// Определяем интерфейс для сущности Fine
export interface IFine extends Document {
  amount: number;
  reason: string;
  date: Date;
  type: 'late' | 'other';
  approved: boolean;
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  active:boolean;
}

// Экспортируем только интерфейс IFine, так как модель User уже определена в users/model.ts
// Это избавит от ошибки OverwriteModelError