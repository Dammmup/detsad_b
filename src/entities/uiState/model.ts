
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