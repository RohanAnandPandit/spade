import axios from "axios";

const apiOrigin = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${apiOrigin}/api/v1`,
  timeout: 30_000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "spade_csrf",
  xsrfHeaderName: "X-CSRF-Token",
});

api.interceptors.response.use(undefined, (error) => {
  const url = String(error.config?.url ?? "");
  if (error.response?.status === 401 && !url.includes("/auth/login")) {
    window.dispatchEvent(new Event("spade:unauthorized"));
  }
  return Promise.reject(error);
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
