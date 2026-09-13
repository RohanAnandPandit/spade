import { describe, expect, test } from "vitest";

import { convertToJSON } from "./queryResults";

describe("convertToJSON", () => {
  test("maps replacement names by selected-column position", () => {
    const result = convertToJSON(
      { header: ["ignored", "name", "value"], data: [["x", "A", "10"]] },
      [2, 1],
      ["amount", "label"]
    );

    expect(result).toEqual([{ amount: "10", label: "A" }]);
  });
});
