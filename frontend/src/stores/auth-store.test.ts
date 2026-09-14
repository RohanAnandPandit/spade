import { beforeEach, expect, test, vi } from "vitest";

import { currentUser, login, logout, register } from "../api/auth";
import RootStore from "./root-store";

vi.mock("../api/auth", () => ({
  currentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

const user = { id: "user-id", email: "person@example.com" };

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.clearAllMocks();
  vi.mocked(currentUser).mockRejectedValue(new Error("unauthenticated"));
  vi.mocked(login).mockResolvedValue(user);
  vi.mocked(register).mockResolvedValue(user);
  vi.mocked(logout).mockResolvedValue();
});

test("restores an existing browser session", async () => {
  vi.mocked(currentUser).mockResolvedValue(user);
  const root = new RootStore();

  await root.authStore.initialize();

  expect(root.authStore.initialized).toBe(true);
  expect(root.authStore.user).toEqual(user);
});

test("logout clears account-scoped browser state", async () => {
  const root = new RootStore();
  await root.authStore.signIn("person@example.com", "a secure password");
  root.repositoryStore.state.currentRepository = "private";
  root.queriesStore.setQueryText("1", "SELECT * WHERE { ?s ?p ?o }");

  await root.authStore.signOut();

  expect(root.authStore.user).toBeNull();
  expect(root.repositoryStore.currentRepository()).toBeNull();
  expect(root.queriesStore.getQuery("1").sparql).toBe("");
});
