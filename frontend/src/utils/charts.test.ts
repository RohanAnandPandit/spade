import { ChartType, QueryResults, RelationType, VariableCategories } from "../types";
import { getRecommendedCharts } from "./charts";

test("recommended charts", () => {
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
  const charts = getRecommendedCharts(variables, allRelations, results);
  expect(charts.includes(ChartType.BAR)).toBeTruthy();
  expect(charts.includes(ChartType.WORD_CLOUD)).toBeTruthy();
  expect(charts.includes(ChartType.SCATTER)).toBeFalsy();
});
