import {
  ChartType,
  QueryResults,
  RelationType,
  VariableCategories,
} from "../types";
import { expect, test } from "vitest";
import {
  getAllRelations,
  getRecommendedCharts,
  inferVariableCategories,
} from "./charts";

test("recommended charts", async () => {
  const results: QueryResults = {
    header: ["name", "population"],
    data: [[], []],
  };
  const variables: VariableCategories = {
    key: ["name"],
    scalar: ["population"],
    numeric: ["population"],
    object: [],
    geographical: [],
    temporal: [],
    lexical: [],
    date: [],
  };

  const allRelations = {
    name: {
      population: RelationType.ONE_TO_ONE,
    },
  };

  const charts = await getRecommendedCharts(variables, allRelations, results);
  expect(charts.includes(ChartType.BAR)).toBeTruthy();
  expect(charts.includes(ChartType.WORD_CLOUD)).toBeTruthy();
  expect(charts.includes(ChartType.SCATTER)).toBeFalsy();
});

test("sample results can recommend charts without saved analysis", async () => {
  const results: QueryResults = {
    header: ["country", "capital", "population"],
    data: [
      ["China", "Beijing", "1400000000"],
      ["India", "New Delhi", "1380000000"],
    ],
  };
  const variables = inferVariableCategories(results);
  expect(variables.key).toEqual(["country"]);
  expect(variables.numeric).toEqual(["population"]);
  const { allRelations } = getAllRelations(results, variables.key);
  const charts = await getRecommendedCharts(
    variables,
    allRelations,
    results,
    false
  );
  expect(charts).toContain(ChartType.BAR);
  expect(charts).toContain(ChartType.PIE);
  expect(charts).not.toContain(ChartType.TREE_MAP);
});
