import { isGeographic } from "../api/queries";
import {
  ChartType,
  QueryResults,
  RelationType,
  VariableCategories,
} from "../types";

type RelationMap = { [key: string]: { [key: string]: RelationType } };
type LinkMap = { [key: string]: Set<string> };

export async function getRecommendedCharts(
  variables: VariableCategories,
  allRelations: RelationMap,
  results: QueryResults
) {
  const { header } = results;
  if (variables.geographical.length === 0) {
    variables.geographical = await geographicVariables(results, variables);
  }
  const { scalar, key, temporal, geographical, lexical, date, numeric } =
    variables;

  const charts = new Set<ChartType>();

  if (date.length === 1 && numeric.length >= 1) {
    charts.add(ChartType.CALENDAR);
  }

  if (numeric.length >= 2) {
    charts.add(ChartType.SCATTER);

    if (numeric.length >= 3) {
      charts.add(ChartType.BUBBLE);
    }
  }

  if (key.length === 1 && numeric.length >= 1) {
    charts.add(ChartType.BAR);
    charts.add(ChartType.PIE);
  }

  if (geographical.length >= 1 && numeric.length >= 1) {
    charts.add(ChartType.CHOROPLETH_MAP);
  }

  if ((key.length === 1 || lexical.length === 1) && numeric.length === 1) {
    charts.add(ChartType.WORD_CLOUD);
  }

  if (key.length >= 2) {
    const isHierarchical = columnsAreHierarchical(allRelations, variables.key);
    if (isHierarchical) {
      charts.add(ChartType.HIERARCHY_TREE);
    } else {
      charts.add(ChartType.NETWORK);
    }
    if (scalar.length >= 1) {
      if (isHierarchical) {
        charts.add(ChartType.TREE_MAP);
        charts.add(ChartType.SUNBURST);
        charts.add(ChartType.CIRCLE_PACKING);
      } else {
        charts.add(ChartType.HEAT_MAP);
        charts.add(ChartType.CHORD_DIAGRAM);
        charts.add(ChartType.SANKEY);
      }
    }
  }
  if (key.length === 2 && header.length >= 3) {
    charts.add(ChartType.STACKED_BAR);
    charts.add(ChartType.GROUPED_BAR);
    charts.add(ChartType.SPIDER);
    if (numeric.includes(key[1])) {
      charts.add(ChartType.LINE);
    }
  } else if (key.length === 1 && results.header.length >= 3) {
    const secondKeyColumn = results.header[results.header.indexOf(key[0]) + 1];
    const areDependent = isCompositeKey([key[0], secondKeyColumn], results);
    if (areDependent) {
      if (lexical.includes(secondKeyColumn)) {
        charts.add(ChartType.STACKED_BAR);
        charts.add(ChartType.GROUPED_BAR);
        charts.add(ChartType.SPIDER);
      }
      if (temporal.includes(secondKeyColumn)) {
        charts.add(ChartType.STACKED_BAR);
        charts.add(ChartType.GROUPED_BAR);
        charts.add(ChartType.SPIDER);
        charts.add(ChartType.LINE);
      }
      if (numeric.includes(secondKeyColumn)) {
        charts.add(ChartType.LINE);
      }
    }
  }

  return Array.from(charts);
}

export function isCompositeKey(
  columns: string[],
  results: QueryResults
): boolean {
  const values = new Set<string>();
  const columnIdxs = columns.map((c) => results.header.indexOf(c));
  for (let row of results.data) {
    const s = columnIdxs.map((i) => row[i]).join(",");
    if (values.has(s)) {
      console.log(s);
      return false;
    }
    values.add(s);
  }

  return true;
}

export function getLinks(results: QueryResults, colA: string, colB: string) {
  const outgoingLinks = {};
  const incomingLinks = {};
  const { header, data } = results;

  const colAIndex = header.indexOf(colA);
  const colBIndex = header.indexOf(colB);

  for (let row of data) {
    const source = row[colAIndex];
    const target = row[colBIndex];

    outgoingLinks[source] = outgoingLinks[source] ?? new Set();
    outgoingLinks[source].add(target);

    incomingLinks[target] = incomingLinks[target] ?? new Set();
    incomingLinks[target].add(source);
  }

  return { incomingLinks, outgoingLinks };
}
export function getColumnRelationship(
  outgoingLinks: LinkMap,
  incomingLinks: LinkMap
) {
  let oneToOne = true;
  let oneToMany = true;
  let manyToOne = true;
  let manyToMany = true;

  for (let parent of Object.keys(outgoingLinks)) {
    const children = outgoingLinks[parent];
    if (children.size > 1) {
      oneToOne = false;
      manyToOne = false;
    }

    if (((oneToOne !== oneToMany) !== manyToOne) !== manyToMany) {
      break;
    }
  }

  for (let child of Object.keys(incomingLinks)) {
    const parents = incomingLinks[child];

    if (parents.size > 1) {
      oneToOne = false;
      oneToMany = false;
    }

    if (((oneToOne !== oneToMany) !== manyToOne) !== manyToMany) {
      break;
    }
  }

  let relationType = RelationType.MANY_TO_MANY;

  if (oneToOne) {
    relationType = RelationType.ONE_TO_ONE;
  } else if (oneToMany) {
    relationType = RelationType.ONE_TO_MANY;
  } else if (manyToOne) {
    relationType = RelationType.MANY_TO_ONE;
  }
  return relationType;
}

function getAdjacentRelations(allRelations: RelationMap, columns: string[]) {
  const relations: RelationType[] = [];

  for (let i = 0; i < columns.length - 1; i++) {
    const colA = columns[i];
    const colB = columns[i + 1];
    const relationType = allRelations[colA][colB];
    relations.push(relationType);
  }

  return relations;
}

function columnsAreHierarchical(
  allRelations: RelationMap,
  columns: string[]
): boolean {
  const relations: RelationType[] = getAdjacentRelations(allRelations, columns);
  return relationsAreHierarchical(relations);
}

function relationsAreHierarchical(relations: RelationType[]) {
  for (let r of relations) {
    if (r !== RelationType.ONE_TO_MANY && r !== RelationType.ONE_TO_ONE) {
      return false;
    }
  }
  return true;
}

export function getAllRelations(results: QueryResults, columns: string[]) {
  const allRelations: RelationMap = {};
  const allOutgoingLinks = {};
  const allIncomingLinks = {};

  for (let i = 0; i < columns.length - 1; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const colA = columns[i];
      const colB = columns[j];
      allRelations[colA] = allRelations[colA] ?? {};
      allOutgoingLinks[colA] = allOutgoingLinks[colA] ?? {};
      allIncomingLinks[colB] = allIncomingLinks[colB] ?? {};

      const { outgoingLinks, incomingLinks } = getLinks(results, colA, colB);
      allOutgoingLinks[colA][colB] = outgoingLinks;
      allIncomingLinks[colB][colA] = incomingLinks;

      const relationType = getColumnRelationship(outgoingLinks, incomingLinks);
      allRelations[colA][colB] = relationType;
    }
  }

  return { allRelations, allOutgoingLinks, allIncomingLinks };
}

async function geographicVariables(
  results: QueryResults,
  variables: VariableCategories
) {
  const { header, data } = results;
  if (data.length === 0) return [];
  const geo: string[] = [];

  await Promise.all(
    variables.lexical.map(async (column) => {
      const index = header.indexOf(column);
      const valid = await isGeographic(data[0][index]);

      if (valid) {
        geo.push(column);
      }
      return valid;
    })
  );

  return geo;
}
