// Модель для работы с Qwen3 API
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
  image?: any; // Express.Multer.File;
  sessionId?: string;
}

export interface Qwen3Response {
  content: string;
}