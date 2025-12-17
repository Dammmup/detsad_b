import mongoose, { Schema, Document } from 'mongoose';

export interface UIState {
  id?: string;
  userId?: string | null;
  sessionId: string;
  timestamp: Date;
  url: string;
  route: string;
  visibleText?: string | null;
  componentsState?: any;
  uiErrors: string[];
  localStorageData?: any;
  sessionStorageData?: any;
  domSnapshot?: any;
}

export interface UIStateRequest {
  userId?: string;
  sessionId: string;
  url: string;
  route: string;
  visibleText?: string;
  componentsState?: any;
  uiErrors: string[];
  localStorageData?: any;
  sessionStorageData?: any;
  domSnapshot?: string;
}

export interface IUIState extends Document {
  userId?: string;
  sessionId: string;
  timestamp: Date;
  url: string;
  route: string;
  visibleText?: string;
  componentsState?: any;
  uiErrors: string[];
  localStorageData?: any;
  sessionStorageData?: any;
  domSnapshot?: any;
}

const UIStateSchema = new Schema<IUIState>({
  userId: { type: String, index: true },
  sessionId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  url: { type: String, required: true },
  route: { type: String, required: true },
  visibleText: { type: String },
  componentsState: { type: Schema.Types.Mixed },
  uiErrors: [String],
  localStorageData: { type: Schema.Types.Mixed },
  sessionStorageData: { type: Schema.Types.Mixed },
  domSnapshot: { type: Schema.Types.Mixed }
}, {
  suppressReservedKeysWarning: true,
  timestamps: true
});

export default mongoose.model<IUIState>('UIState', UIStateSchema, 'uiStates');