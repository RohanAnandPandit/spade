import { User } from "../types";
import { api } from "./client";
import { clearWorkspaceId, getWorkspaceId } from "./workspace";

export async function register(email: string, password: string): Promise<User> {
  const response = await api.post<User>("/auth/register", {
    email,
    password,
    legacyWorkspaceId: getWorkspaceId(),
  });
  clearWorkspaceId();
  return response.data;
}

export async function login(email: string, password: string): Promise<User> {
  const response = await api.post<User>("/auth/login", { email, password });
  return response.data;
}

export async function currentUser(): Promise<User> {
  return (await api.get<User>("/auth/me")).data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
