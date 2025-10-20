// Модель для хранения состояния UI
export interface UIState {
  id?: string;
  userId?: string | null; // ID пользователя, если авторизован
  sessionId: string; // ID сессии для отслеживания активной сессии пользователя
  timestamp: Date; // Время создания состояния
  url: string; // Текущий URL
  route: string; // Текущий маршрут
  visibleText?: string | null; // Видимый текст на странице
  componentsState?: any; // Состояние компонентов
  errors: string[]; // Обнаруженные ошибки
  localStorageData?: any; // Данные из localStorage
  sessionStorageData?: any; // Данные из sessionStorage
  domSnapshot?: any; // Снимок DOM (опционально, для анализа)
}

export interface UIStateRequest {
  userId?: string;
  sessionId: string;
 url: string;
 route: string;
 visibleText?: string;
  componentsState?: any;
  errors: string[];
  localStorageData?: any;
  sessionStorageData?: any;
  domSnapshot?: string;
}