import {
  ChartType,
  QueryResults,
  RelationType,
  VariableCategories,
} from "../types";

type RelationMap = { [key: string]: { [key: string]: RelationType } };
type LinkMap = { [key: string]: Set<string> };

export function getRecommendedCharts(
  variables: VariableCategories,
  allRelations: RelationMap,
  results: QueryResults
) {
  const { scalar, geographical, key, temporal, lexical, date, numeric } =
    variables;

  const charts = new Set<ChartType>();

  if (date.length === 1 && scalar.length >= 1) {
    charts.add(ChartType.CALENDAR);
  }

  if (scalar.length >= 2) {
    charts.add(ChartType.SCATTER);

    if (scalar.length >= 3) {
      charts.add(ChartType.BUBBLE);
    }
  }

  if (key.length === 1 && scalar.length === 1) {
    charts.add(ChartType.BAR);
  }

  if (geographical.length === 1 && scalar.length >= 1) {
    charts.add(ChartType.CHOROPLETH_MAP);
  }

  if ((key.length === 1 || lexical.length === 1) && scalar.length === 1) {
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
  if (key.length === 2 && scalar.length >= 1) {
    charts.add(ChartType.STACKED_BAR);
    charts.add(ChartType.GROUPED_BAR);
    charts.add(ChartType.SPIDER);
    charts.add(ChartType.LINE);
  } else if (key.length === 1) {
    if (
      lexical.length > 0 &&
      key[0] !== lexical[0] &&
      isCompositeKey([key[0], lexical[0]], results)
    ) {
      charts.add(ChartType.STACKED_BAR);
      charts.add(ChartType.GROUPED_BAR);
      charts.add(ChartType.SPIDER);
    }
    if (temporal.length > 0 && isCompositeKey([key[0], temporal[0]], results)) {
      charts.add(ChartType.STACKED_BAR);
      charts.add(ChartType.GROUPED_BAR);
      charts.add(ChartType.SPIDER);
      charts.add(ChartType.LINE);
    }
    if (numeric.length > 1 && isCompositeKey([key[0], numeric[0]], results)) {
      charts.add(ChartType.LINE);
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
