import { describe, expect, test } from "vitest";

import { VariableCategories } from "../../types";
import { toNetworkLinks } from "./NetworkChart";
import { getKeyColumnIndex } from "./PieChart";

const variables: VariableCategories = {
  key: ["source", "target"],
  scalar: ["weight"],
  numeric: ["weight"],
  object: [],
  geographical: [],
  temporal: [],
  lexical: [],
  date: [],
};

describe("chart column selection", () => {
  test("accepts a key column at index zero", () => {
    expect(
      getKeyColumnIndex(
        { header: ["source", "weight"], data: [["A", "2"]] },
        variables
      )
    ).toBe(0);
  });

  test("uses a scalar column at index zero in network links", () => {
    expect(toNetworkLinks([["5", "A", "B"]], 1, 2, 0)).toEqual([
      ["A", "5", "B"],
    ]);
  });
});
