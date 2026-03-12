export interface Qwen3Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
}

export interface Qwen3Request {
  messages: Qwen3Message[];
  model?: string;
  currentPage?: string;
  image?: any;
  sessionId?: string;
  authContext?: {
    userId: string;
    role: string;
    groupId?: string;
  };
}

export interface Qwen3Response {
  content: string;
  action?: 'query' | 'navigate' | 'text' | 'confirm_action';
  navigateTo?: string;
  pendingAction?: PendingAction;
}

/**
 * Действие, ожидающее подтверждения пользователя.
 * Фронтенд хранит это и отправляет обратно при подтверждении.
 */
export interface PendingAction {
  id: string;
  type: 'crud_query' | 'create_dish';
  description: string;
  query?: any;
  dishData?: {
    dishName: string;
    category: string;
    ingredients: { productName: string; quantity: number; unit: string }[];
  };
  responseTemplate?: string;
}