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
  type: 'crud_query' | 'create_dish' | 'update_child_payment_status' | 'update_task_status' | 'update_rent_payment_status';
  description: string;
  query?: any;
  dishData?: {
    dishName: string;
    category: string;
    ingredients: { productName: string; quantity: number; unit: string }[];
  };
  paymentData?: {
    childName: string;
    childId: string;
    paymentId: string;
    monthPeriod: string;
    newStatus: 'paid' | 'active';
    paidAmount?: number;
  };
  taskData?: {
    taskId: string;
    taskTitle: string;
    newStatus: 'in_progress' | 'completed' | 'cancelled';
  };
  rentData?: {
    tenantName: string;
    rentId: string;
    period: string;
    newStatus: 'paid' | 'active';
    paidAmount?: number;
  };
  responseTemplate?: string;
}
