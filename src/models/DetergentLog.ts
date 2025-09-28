import { Schema, model, Document } from 'mongoose';

export interface IDetergentLog extends Document {
  date: Date;
  name: string;
  incoming: number;
  consumption: number;
  remainder: number;
  control?: string;
}

const DetergentLogSchema = new Schema<IDetergentLog>({
  date: { type: Date, required: true },
  name: { type: String, required: true },
  incoming: { type: Number, required: true },
  consumption: { type: Number, required: true },
  remainder: { type: Number, required: true },
  control: { type: String },
});

export default model<IDetergentLog>('DetergentLog', DetergentLogSchema);