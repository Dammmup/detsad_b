import UIStateModel, { UIState, UIStateRequest } from './model';

export class UIStateService {

  static async saveUIState(uiStateData: UIStateRequest): Promise<UIState> {
    try {
      const uiState = new UIStateModel({
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
      const uiState = await UIStateModel
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
      const uiState = await UIStateModel
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