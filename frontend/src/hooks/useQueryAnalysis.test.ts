import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { getQueryAnalysis } from "../api/queries";
import { QueryAnalysis } from "../types";
import { useQueryAnalysis } from "./useQueryAnalysis";

vi.mock("../api/queries", () => ({ getQueryAnalysis: vi.fn() }));

const mockedAnalysis = vi.mocked(getQueryAnalysis);
const result = (pattern: string): QueryAnalysis => ({
  pattern,
  visualisations: [],
  variables: {
    key: [],
    scalar: [],
    geographical: [],
    temporal: [],
    lexical: [],
    date: [],
    numeric: [],
    object: [],
  },
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("useQueryAnalysis", () => {
  test("aborts and ignores stale analysis responses", async () => {
    vi.useFakeTimers();
    const first = deferred<QueryAnalysis>();
    const second = deferred<QueryAnalysis>();
    mockedAnalysis
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result: hook, rerender } = renderHook(
      ({ query }) => useQueryAnalysis(query, "repo", 10),
      { initialProps: { query: "first" } }
    );

    act(() => vi.advanceTimersByTime(10));
    const firstSignal = mockedAnalysis.mock.calls[0][2]!;
    rerender({ query: "second" });
    expect(firstSignal.aborted).toBe(true);

    await act(async () => first.resolve(result("stale")));
    expect(hook.current.analysis).toBeNull();

    act(() => vi.advanceTimersByTime(10));
    await act(async () => second.resolve(result("current")));
    expect(hook.current.analysis?.pattern).toBe("current");
  });
});
