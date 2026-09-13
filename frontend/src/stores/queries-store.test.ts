import { beforeEach, expect, test } from "vitest";

import RootStore from "./root-store";

beforeEach(() => window.localStorage.clear());

test("removing the final query creates a valid replacement tab", () => {
  const store = new RootStore().queriesStore;

  store.removeQuery("1");

  expect(Object.keys(store.openQueries())).toEqual(["2"]);
  expect(store.currentQueryId()).toBe("2");
  expect(store.currentQuery()).toMatchObject({ name: "Query 2", sparql: "" });
});
