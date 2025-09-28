import { Schema, model, Document } from 'mongoose';

export interface IFoodStaffHealth extends Document {
  date: Date;
  staffName: string;
  inspection: string;
  symptoms?: string;
  skin?: string;
  signature?: string;
}

const FoodStaffHealthSchema = new Schema<IFoodStaffHealth>({
  date: { type: Date, required: true },
  staffName: { type: String, required: true },
  inspection: { type: String, required: true },
  symptoms: { type: String },
  skin: { type: String },
  signature: { type: String },
});

export default model<IFoodStaffHealth>('FoodStaffHealth', FoodStaffHealthSchema);