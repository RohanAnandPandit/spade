import { App as AntdApp } from "antd";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import RootStore from "../../stores/root-store";
import { StoreContext } from "../../stores/store";
import QueryBrowser, { QueryList, useQueryBrowser } from "./QueryBrowser";

vi.mock("../../components/query/Query", () => ({
  default: () => <div>Query editor</div>,
}));

const Workspace = () => {
  const model = useQueryBrowser(false);
  return (
    <>
      <QueryList model={model} />
      <QueryBrowser model={model} />
    </>
  );
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test("asks to save edited query before creating another", async () => {
  const user = userEvent.setup();
  const rootStore = new RootStore();

  render(
    <StoreContext.Provider value={rootStore}>
      <AntdApp>
        <Workspace />
      </AntdApp>
    </StoreContext.Provider>
  );

  await user.clear(screen.getByRole("textbox", { name: "Query name" }));
  await user.type(
    screen.getByRole("textbox", { name: "Query name" }),
    "My query"
  );
  await user.click(screen.getByRole("button", { name: "New query" }));
  expect(screen.getByText("Save changes to “My query”?")).toBeInTheDocument();
  expect(rootStore.queriesStore.currentQueryId()).toBe("1");

  await user.click(
    screen.getByRole("button", { name: "Save query and continue" })
  );
  expect(rootStore.queriesStore.getQuery("1").saved?.name).toBe("My query");
  expect(
    within(screen.getByRole("tablist", { name: "Open queries" })).getByRole(
      "tab",
      { name: "Query 2" }
    )
  ).toHaveAttribute("aria-selected", "true");

  await user.click(screen.getByRole("button", { name: "New query" }));
  const queryList = within(
    screen.getByRole("tablist", { name: "Open queries" })
  );
  expect(queryList.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "Query 3",
    "Query 2",
    "My query",
  ]);
  await user.hover(queryList.getByRole("tab", { name: "Query 2" }));
  expect(await screen.findByText(/Last edited:/)).toBeInTheDocument();
});

test("enables the name save icon only when the name changes", async () => {
  const user = userEvent.setup();
  const rootStore = new RootStore();
  render(
    <StoreContext.Provider value={rootStore}>
      <AntdApp>
        <Workspace />
      </AntdApp>
    </StoreContext.Provider>
  );

  await user.click(screen.getByRole("button", { name: "Edit query name" }));
  const name = screen.getByRole("textbox", { name: "Query name" });
  const save = screen.getByRole("button", { name: "Save query name" });
  expect(name).toHaveFocus();
  expect(save).toBeDisabled();
  await user.clear(name);
  await user.type(name, "Saved directly");
  expect(save).toBeEnabled();
  await user.click(save);
  expect(rootStore.queriesStore.getQuery("1").saved?.name).toBe(
    "Saved directly"
  );
  expect(save).toBeDisabled();
  expect(rootStore.queriesStore.isQueryDirty("1")).toBe(false);
  await user.click(screen.getByRole("button", { name: "New query" }));
  expect(screen.queryByText(/Save changes to/)).not.toBeInTheDocument();
});

test("query text changes keep the name save icon disabled and prompt on switch", async () => {
  const user = userEvent.setup();
  const rootStore = new RootStore();
  render(
    <StoreContext.Provider value={rootStore}>
      <AntdApp>
        <Workspace />
      </AntdApp>
    </StoreContext.Provider>
  );

  expect(screen.getByRole("button", { name: "Copy query" })).toHaveTextContent(
    ""
  );
  await user.click(screen.getByRole("button", { name: "Query templates" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(rootStore.queriesStore.getQuery("1").sparql).toContain("SELECT");
  expect(
    screen.getByRole("button", { name: "Save query name" })
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "New query" }));
  expect(screen.getByText("Save changes to “Query 1”?")).toBeInTheDocument();
});

test("continuing without saving restores the prior query", async () => {
  const user = userEvent.setup();
  const rootStore = new RootStore();
  render(
    <StoreContext.Provider value={rootStore}>
      <AntdApp>
        <Workspace />
      </AntdApp>
    </StoreContext.Provider>
  );

  const name = screen.getByRole("textbox", { name: "Query name" });
  await user.clear(name);
  await user.type(name, "Temporary name");
  await user.click(screen.getByRole("button", { name: "New query" }));
  await user.click(
    screen.getByRole("button", { name: "Continue without saving" })
  );

  expect(rootStore.queriesStore.getQuery("1").name).toBe("Query 1");
  expect(rootStore.queriesStore.currentQueryId()).toBe("2");
});
