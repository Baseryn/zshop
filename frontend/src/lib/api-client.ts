import { ResponseWrapper, ApiErrorResponse } from "@/types/api";
import { useDevToolsStore } from "@/stores/devtoolsStore";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function getImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  const backendBase = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://127.0.0.1:8000";
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export class ApiError extends Error {
  status: number;
  meta?: Record<string, any>;

  constructor(status: number, message: string, meta?: Record<string, any>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.meta = meta;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("zshop_access_token");
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const startTime = performance.now();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const durationMs = Math.round(performance.now() - startTime);
    const requestId = response.headers.get("x-request-id") || undefined;

    useDevToolsStore.getState().addMetric({
      id: crypto.randomUUID(),
      url: endpoint,
      method: options.method || "GET",
      status: response.status,
      durationMs,
      timestamp: new Date().toLocaleTimeString(),
      requestId,
    });

    const json = await response.json();

    if (!response.ok) {
      const errorJson = json as ApiErrorResponse;
      throw new ApiError(
        response.status,
        errorJson.message || "An unexpected server error occurred",
        errorJson.meta
      );
    }

    if (json && typeof json === "object" && "success" in json && "data" in json) {
      return (json as ResponseWrapper<T>).data;
    }

    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, (error as Error).message || "Network Error");
  }
}