import { UIState, UIStateRequest } from './model';
import mongoose, { Schema } from 'mongoose';
import { createModelFactory } from '../../config/database';

// Определяем схему для UIState
const uiStateSchema = new Schema({
  userId: { type: String, index: true },
  sessionId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  url: { type: String, required: true },
  route: { type: String, required: true },
  visibleText: { type: String },
  componentsState: { type: Schema.Types.Mixed },
  uiErrors: [String], // Переименовываем поле
 localStorageData: { type: Schema.Types.Mixed },
  sessionStorageData: { type: Schema.Types.Mixed },
  domSnapshot: { type: Schema.Types.Mixed }
}, {
  suppressReservedKeysWarning: true,
  timestamps: true
});

// Создаем фабрику модели для отложенного создания после подключения к базе данных
const createUIStateModel = createModelFactory<any>(
  'UIState',
  uiStateSchema,
  'uiStates',
  'default'
);

// Отложенное создание модели
let UIStateModel: any = null;

const getUIStateModel = () => {
  if (!UIStateModel) {
    UIStateModel = createUIStateModel();
  }
  return UIStateModel;
};

export class UIStateService {
  // Сохранить состояние UI
  static async saveUIState(uiStateData: UIStateRequest): Promise<UIState> {
    try {
      const uiState = new (getUIStateModel())({
        ...uiStateData,
        uiErrors: uiStateData.uiErrors, // Поле уже называется uiErrors
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

  // Получить последнее состояние UI для сессии
 static async getLastUIState(sessionId: string): Promise<UIState | null> {
    try {
      const uiState = await getUIStateModel()
        .findOne({ sessionId })
        .sort({ timestamp: -1 })
        .lean(); // Используем lean() для получения простого объекта
      
      if (!uiState) return null;
      
      // Преобразуем поля, которые могут быть null в mongoose, в соответствующие типы
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

  // Получить состояние UI по ID
 static async getUIStateById(id: string): Promise<UIState | null> {
    try {
      const uiState = await getUIStateModel()
        .findById(id)
        .lean(); // Используем lean() для получения простого объекта
      
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

  // Удалить устаревшие состояния UI (старше 1 часа) - не нужно, т.к. используется TTL индекс
  static async cleanupOldStates(): Promise<number> {
    try {
      // TTL индекс автоматически удаляет устаревшие записи, так что вручную удалять не нужно
      // Но оставим метод для совместимости
      return 0;
    } catch (error) {
      console.error('Ошибка при очистке устаревших состояний UI:', error);
      throw error;
    }
  }
}

// Экспортируем функцию для использования в реестре моделей
export { getUIStateModel };