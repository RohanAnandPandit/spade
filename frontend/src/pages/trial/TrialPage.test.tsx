import { App as AntdApp } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import RootStore from "../../stores/root-store";
import { StoreContext } from "../../stores/store";
import TrialPage from "./TrialPage";

const { runDemoSparqlQuery } = vi.hoisted(() => ({
  runDemoSparqlQuery: vi.fn().mockResolvedValue({
    header: ["country"],
    data: [["France"]],
  }),
}));

vi.mock("../../api/sparql", () => ({ runDemoSparqlQuery }));
vi.mock("../../components/query/CodeEditor", () => ({
  default: ({ code }: { code: string }) => <div>{code}</div>,
}));
vi.mock("../../components/query/Results", () => ({
  default: ({ results }: { results: { data: string[][] } }) => (
    <div>{results.data.flat().join(" ")}</div>
  ),
}));

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  runDemoSparqlQuery.mockClear();
});

test("runs a live sample-dataset example without requiring an account", async () => {
  const user = userEvent.setup();
  const rootStore = new RootStore();

  render(
    <MemoryRouter>
      <StoreContext.Provider value={rootStore}>
        <AntdApp>
          <TrialPage />
        </AntdApp>
      </StoreContext.Provider>
    </MemoryRouter>
  );

  expect(screen.getByText("Sample workspace")).toBeVisible();
  expect(screen.getByRole("button", { name: "Mondial" })).toBeVisible();
  expect(screen.getByRole("tab", { name: /World countries/ })).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Create an account" })
  ).toHaveAttribute("href", "/register");

  await user.click(screen.getByRole("button", { name: "Add tab" }));
  expect(screen.getByRole("tab", { name: /Query 2/ })).toBeVisible();
  expect(Object.keys(rootStore.queriesStore.openQueries())).toEqual(["1"]);
  await user.click(screen.getByRole("tab", { name: /World countries/ }));

  await user.click(screen.getByRole("button", { name: "Run" }));

  expect(runDemoSparqlQuery).toHaveBeenCalledOnce();
  expect(await screen.findByText("France")).toBeVisible();
});
