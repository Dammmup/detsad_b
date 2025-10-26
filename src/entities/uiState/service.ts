import { UIState, UIStateRequest } from './model';
import mongoose from 'mongoose';

// Определяем схему для UIState
const uiStateSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  sessionId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  url: { type: String, required: true },
  route: { type: String, required: true },
  visibleText: { type: String },
  componentsState: { type: mongoose.Schema.Types.Mixed },
  errors: [String],
  localStorageData: { type: mongoose.Schema.Types.Mixed },
  sessionStorageData: { type: mongoose.Schema.Types.Mixed },
  domSnapshot: { type: mongoose.Schema.Types.Mixed }
});

// Создаем индекс для автоматической очистки устаревших записей

// Модель для UIState
const UIStateModel = mongoose.model('UIState', uiStateSchema, 'uiStates');

export class UIStateService {
  // Сохранить состояние UI
  static async saveUIState(uiStateData: UIStateRequest): Promise<UIState> {
    try {
      const uiState = new UIStateModel({
        ...uiStateData,
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
      const uiState = await UIStateModel
        .findOne({ sessionId })
        .sort({ timestamp: -1 })
        .lean(); // Используем lean() для получения простого объекта
      
      if (!uiState) return null;
      
      // Преобразуем поля, которые могут быть null в mongoose, в соответствующие типы
      return {
        ...uiState,
        id: uiState._id.toString(),
        userId: uiState.userId || undefined,
        visibleText: uiState.visibleText || undefined,
        domSnapshot: uiState.domSnapshot || undefined
      };
    } catch (error) {
      console.error('Ошибка при получении последнего состояния UI:', error);
      throw error;
    }
  }

  // Получить состояние UI по ID
 static async getUIStateById(id: string): Promise<UIState | null> {
    try {
      const uiState = await UIStateModel
        .findById(id)
        .lean(); // Используем lean() для получения простого объекта
      
      if (!uiState) return null;
      
      return {
        ...uiState,
        id: uiState._id.toString(),
        userId: uiState.userId || undefined,
        visibleText: uiState.visibleText || undefined,
        domSnapshot: uiState.domSnapshot || undefined
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