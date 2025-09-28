import { Schema, model, Document } from 'mongoose';

export interface IFoodStockLog extends Document {
  date: Date;
  product: string;
  incoming: number;
  consumption: number;
  remainder: number;
  notes?: string;
}

const FoodStockLogSchema = new Schema<IFoodStockLog>({
  date: { type: Date, required: true },
  product: { type: String, required: true },
  incoming: { type: Number, required: true },
  consumption: { type: Number, required: true },
  remainder: { type: Number, required: true },
  notes: { type: String },
});

export default model<IFoodStockLog>('FoodStockLog', FoodStockLogSchema);