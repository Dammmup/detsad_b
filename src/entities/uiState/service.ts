import { UIState, UIStateRequest } from './model';
import mongoose, { Schema } from 'mongoose';
import { createModelFactory } from '../../config/database';


const uiStateSchema = new Schema({
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


const createUIStateModel = createModelFactory<any>(
  'UIState',
  uiStateSchema,
  'uiStates',
  'default'
);


let UIStateModel: any = null;

const getUIStateModel = () => {
  if (!UIStateModel) {
    UIStateModel = createUIStateModel();
  }
  return UIStateModel;
};

export class UIStateService {

  static async saveUIState(uiStateData: UIStateRequest): Promise<UIState> {
    try {
      const uiState = new (getUIStateModel())({
        ...uiStateData,
        uiErrors: uiStateData.uiErrors,
        timestamp: new Date()
      });

      const savedState = await uiState.save();

      return {
        ...uiStateData,
        id: savedState._id.toString(),
        timestamp: savedState.timestamp
      };
    } catch (error) {
      console.error('Ошибка при сохранении состояния UI:', error);
      throw error;
    }
  }


  static async getLastUIState(sessionId: string): Promise<UIState | null> {
    try {
      const uiState = await getUIStateModel()
        .findOne({ sessionId })
        .sort({ timestamp: -1 })
        .lean();

      if (!uiState) return null;


      return {
        id: (uiState as any)._id.toString(),
        userId: (uiState as any).userId || null,
        sessionId: (uiState as any).sessionId,
        timestamp: (uiState as any).timestamp,
        url: (uiState as any).url,
        route: (uiState as any).route,
        visibleText: (uiState as any).visibleText || null,
        componentsState: (uiState as any).componentsState,
        uiErrors: (uiState as any).uiErrors || [],
        localStorageData: (uiState as any).localStorageData,
        sessionStorageData: (uiState as any).sessionStorageData,
        domSnapshot: (uiState as any).domSnapshot || null
      };
    } catch (error) {
      console.error('Ошибка при получении последнего состояния UI:', error);
      throw error;
    }
  }


  static async getUIStateById(id: string): Promise<UIState | null> {
    try {
      const uiState = await getUIStateModel()
        .findById(id)
        .lean();

      if (!uiState) return null;

      return {
        id: (uiState as any)._id.toString(),
        userId: (uiState as any).userId || null,
        sessionId: (uiState as any).sessionId,
        timestamp: (uiState as any).timestamp,
        url: (uiState as any).url,
        route: (uiState as any).route,
        visibleText: (uiState as any).visibleText || null,
        componentsState: (uiState as any).componentsState,
        uiErrors: (uiState as any).uiErrors || [],
        localStorageData: (uiState as any).localStorageData,
        sessionStorageData: (uiState as any).sessionStorageData,
        domSnapshot: (uiState as any).domSnapshot || null
      };
    } catch (error) {
      console.error('Ошибка при получении состояния UI по ID:', error);
      throw error;
    }
  }


  static async cleanupOldStates(): Promise<number> {
    try {


      return 0;
    } catch (error) {
      console.error('Ошибка при очистке устаревших состояний UI:', error);
      throw error;
    }
  }
}


export { getUIStateModel };