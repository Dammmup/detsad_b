import mongoose, { Schema, Document } from 'mongoose';

export interface MenuItem extends Document {
  name: string; // Название блюда/напитка
  meal: string; // Приём пищи (завтрак, обед, полдник, ужин)
  group: string; // Группа (если блюдо специфично для группы, иначе 'all')
  vitaminDose: number; // Доза витамина С на порцию (мг)
  defaultPortion: number; // Стандартное количество порций
  unit: string; // Единица измерения (шт, мл, г и т.д.)
  isActive: boolean; // Используется ли в меню
  notes?: string; // Примечания
}

const MenuItemSchema = new Schema<MenuItem>({
  name: { type: String, required: true },
  meal: { type: String, required: true },
  group: { type: String, required: true, default: 'all' },
  vitaminDose: { type: Number, required: true },
  defaultPortion: { type: Number, required: true },
  unit: { type: String, required: true, default: 'шт' },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model<MenuItem>('MenuItem', MenuItemSchema);
