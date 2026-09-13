import { api } from "./client";

export async function login(username: string): Promise<string> {
  await api.post("/login", undefined, { params: { username } });
  return username;
}
