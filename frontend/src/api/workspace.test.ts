import { beforeEach, expect, test } from "vitest";

import { getWorkspaceId } from "./workspace";

beforeEach(() => window.localStorage.clear());

test("keeps a stable anonymous workspace ID in the browser", () => {
  const workspaceId = getWorkspaceId();

  expect(workspaceId).not.toBe("");
  expect(getWorkspaceId()).toBe(workspaceId);
});
