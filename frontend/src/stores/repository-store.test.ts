import { beforeEach, expect, test, vi } from "vitest";

import { allRepositories, deleteRepository } from "../api/sparql";
import RootStore from "./root-store";

vi.mock("../api/sparql", () => ({
  allRepositories: vi.fn(),
  deleteRepository: vi.fn(),
}));

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(deleteRepository).mockResolvedValue("repo");
  vi.mocked(allRepositories).mockResolvedValue([]);
});

test("deleting a repository clears stale selections and query history", async () => {
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
  root.queriesStore.setQueryRepository("1", "repo");

  await root.repositoryStore.deleteRepository("repo");

  expect(root.repositoryStore.currentRepository()).toBeNull();
  expect(root.repositoryStore.queryHistory()).toEqual([]);
  expect(root.queriesStore.getQuery("1").repository).toBeNull();
});
