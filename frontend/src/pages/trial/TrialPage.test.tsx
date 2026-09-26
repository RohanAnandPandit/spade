import { App as AntdApp } from "antd";
import { render, screen, within } from "@testing-library/react";
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
  expect(screen.getByRole("button", { name: "Edit query name" })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Save query name" })
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Copy query" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Query templates" })).toBeVisible();
  expect(screen.getByRole("button", { name: "New query" })).toHaveTextContent(
    ""
  );
  expect(
    screen.getByRole("button", { name: "Edit query name" })
  ).toHaveTextContent("");
  expect(
    screen.getByRole("button", { name: "Save query name" })
  ).toHaveTextContent("");
  const workspaceTabs = screen
    .getAllByRole("tablist")
    .find((tablist) => tablist.getAttribute("aria-orientation") === "vertical");
  expect(workspaceTabs).toBeInTheDocument();
  expect(
    within(workspaceTabs!).getByRole("tab", { name: "Query" })
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Collapse analysis" }));
  expect(screen.getByRole("button", { name: "Expand analysis" })).toBeVisible();
  expect(
    document.querySelector(".query-editor-grid-collapsed")
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Expand analysis" }));
  expect(
    within(screen.getByRole("tablist", { name: "Open queries" })).getByRole(
      "tab",
      { name: "World countries" }
    )
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Create an account" })
  ).toHaveAttribute("href", "/register");
  await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  expect(screen.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Open queries" }));
  expect(
    within(screen.getByRole("tablist", { name: "Open queries" })).getByRole(
      "tab",
      { name: "World countries" }
    )
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
  expect(
    screen.getByRole("button", { name: "Collapse sidebar" })
  ).toBeVisible();

  await user.click(screen.getByRole("button", { name: "New query" }));
  const queryList = within(
    screen.getByRole("tablist", { name: "Open queries" })
  );
  expect(queryList.getByRole("tab", { name: "Query 2" })).toBeVisible();
  expect(Object.keys(rootStore.queriesStore.openQueries())).toEqual(["1"]);
  await user.click(queryList.getByRole("tab", { name: "World countries" }));

  await user.click(screen.getByRole("button", { name: "Run query" }));

  expect(runDemoSparqlQuery).toHaveBeenCalledOnce();
  expect(await screen.findByText("France")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: /Close Query/ })
  ).not.toBeInTheDocument();

  const queryName = screen.getByRole("textbox", { name: "Query name" });
  await user.clear(queryName);
  await user.type(queryName, "Population report");
  await user.click(screen.getByRole("button", { name: "New query" }));
  expect(
    screen.getByText(/Save changes to “Population report”/)
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Save query and continue" })
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Continue without saving" })
  );
  expect(queryList.getByRole("tab", { name: "Query 3" })).toBeVisible();
  expect(queryList.getByRole("tab", { name: "World countries" })).toBeVisible();
});
