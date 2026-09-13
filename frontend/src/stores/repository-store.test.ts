import { beforeEach, expect, test, vi } from "vitest";

import {
  allRepositories,
  deleteRepository,
  updateRepository,
} from "../api/sparql";
import RootStore from "./root-store";

vi.mock("../api/sparql", () => ({
  allRepositories: vi.fn(),
  deleteRepository: vi.fn(),
  updateRepository: vi.fn(),
}));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.mocked(deleteRepository).mockResolvedValue("repo");
  vi.mocked(allRepositories).mockResolvedValue([]);
  vi.mocked(updateRepository).mockResolvedValue({
    name: "renamed",
    description: "Updated",
    endpoint: "https://example.com/sparql",
  });
});

test("renaming a repository keeps it selected in this browser tab", async () => {
  const root = new RootStore();
  root.repositoryStore.state.currentRepository = "repo";

  await root.repositoryStore.updateRepository("repo", {
    name: "renamed",
    description: "Updated",
    endpoint: "https://example.com/sparql",
  });

  expect(root.repositoryStore.currentRepository()).toBe("renamed");
});

test("deleting a repository clears the browser-tab selection and history", async () => {
  const root = new RootStore();
  root.repositoryStore.state.currentRepository = "repo";
  root.repositoryStore.state.queryHistory = [
    {
      id: "1",
      name: "Saved query",
      sparql: "SELECT * WHERE {}",
      repository: "repo",
      date: "today",
    },
  ];
  await root.repositoryStore.deleteRepository("repo");

  expect(root.repositoryStore.currentRepository()).toBeNull();
  expect(root.repositoryStore.queryHistory()).toEqual([]);
});
