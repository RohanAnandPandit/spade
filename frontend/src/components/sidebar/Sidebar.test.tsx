import { App as AntdApp } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

import RootStore from "../../stores/root-store";
import { StoreContext } from "../../stores/store";
import Sidebar from "./Sidebar";

vi.mock("../../api/sparql", () => ({
  addLocalRepository: vi.fn(),
  addRemoteRepository: vi.fn(),
  allRepositories: vi.fn().mockResolvedValue([
    {
      name: "example",
      description: "Example repository",
      endpoint: "https://example.com/sparql",
    },
  ]),
  deleteRepository: vi.fn(),
}));

vi.mock("../../api/queries", () => ({
  clearQueryHistory: vi.fn(),
  getQueryHistory: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  window.localStorage.clear();
});

test("keeps sidebar actions available as icon controls when collapsed", async () => {
  const rootStore = new RootStore();
  rootStore.settingsStore.setSidebarCollapsed(true);
  const user = userEvent.setup();

  render(
    <StoreContext.Provider value={rootStore}>
      <AntdApp>
        <Sidebar />
      </AntdApp>
    </StoreContext.Provider>
  );

  expect(
    screen.getByRole("button", { name: "Select repository" })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Explore dataset" })
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "View repositories" })
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Query history" })).toBeVisible();

  await waitFor(() =>
    expect(rootStore.repositoryStore.repositories()).toHaveLength(1)
  );
  await user.click(screen.getByRole("button", { name: "Select repository" }));
  await user.click(await screen.findByRole("button", { name: "example" }));

  expect(screen.getByRole("button", { name: "Explore dataset" })).toBeEnabled();

  await user.click(screen.getByRole("button", { name: "Query history" }));
  expect(await screen.findByText("Query History")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "View repositories" }));
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
  expect(
    screen.getByRole("tab", { name: "All Repositories" })
  ).toBeInTheDocument();
});
