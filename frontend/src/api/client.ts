import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  timeout: 30_000,
});

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? error.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function isCancelledRequest(error: unknown): boolean {
  return axios.isCancel(error);
}
