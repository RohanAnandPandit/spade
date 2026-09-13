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
    {
      name: "world-data",
      description: "World geography",
      endpoint: "https://example.com/world",
    },
  ]),
  deleteRepository: vi.fn(),
  updateRepository: vi.fn(),
}));

vi.mock("../../api/queries", () => ({
  clearQueryHistory: vi.fn(),
  getQueryHistory: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test("hides repository-dependent sidebar actions until one is selected", async () => {
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
    screen.getByRole("button", { name: "Add or manage repositories" })
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Choose repository" })
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Explore selected repository" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Saved queries" })
  ).not.toBeInTheDocument();

  await waitFor(() =>
    expect(rootStore.repositoryStore.repositories()).toHaveLength(2)
  );
  expect(
    screen.queryByRole("button", { name: "Set default repository" })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Choose repository" }));
  await user.click(await screen.findByRole("menuitem", { name: "example" }));

  expect(rootStore.repositoryStore.currentRepository()).toBe("example");

  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Explore selected repository" })
    ).toBeEnabled()
  );

  await user.click(screen.getByRole("button", { name: "Saved queries" }));
  expect(
    await screen.findByRole("dialog", { name: "Saved queries" })
  ).toBeInTheDocument();
});

test("shows repositories in a compact searchable table", async () => {
  const rootStore = new RootStore();
  const user = userEvent.setup();

  render(
    <StoreContext.Provider value={rootStore}>
      <AntdApp>
        <Sidebar />
      </AntdApp>
    </StoreContext.Provider>
  );

  await waitFor(() =>
    expect(rootStore.repositoryStore.repositories()).toHaveLength(2)
  );

  await user.click(
    screen.getByRole("button", { name: "Add or manage repositories" })
  );
  expect(await screen.findByText("Repositories")).toBeInTheDocument();
  expect(
    screen.getByRole("tab", { name: "Your repositories" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("searchbox", { name: "Search repositories" })
  ).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "example" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "world-data" })).toBeInTheDocument();
  expect(
    screen.queryByRole("columnheader", { name: "Connection" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "View example" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Edit example" })
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "View example" }));
  expect(
    await screen.findByText("https://example.com/sparql")
  ).toBeInTheDocument();

  await user.type(
    screen.getByRole("searchbox", { name: "Search repositories" }),
    "world"
  );
  expect(
    screen.queryByRole("cell", { name: "example" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "world-data" })).toBeInTheDocument();
});
