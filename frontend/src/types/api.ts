export interface ResponseWrapper<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    errors?: Record<string, string[]>;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  meta?: {
    errors?: Record<string, string[]>;
    [key: string]: any;
  };
}

export interface RequestMetric {
  id: string;
  url: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: string;
  requestId?: string;
}