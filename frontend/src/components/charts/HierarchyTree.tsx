import { useMemo } from "react";
import Tree from "react-d3-tree";
import { QueryResults, VariableCategories } from "../../types";
import randomColor from "randomcolor";
import { shadeColor } from "../../utils/queryResults";
import "./HierarchyTree.css";

type HierarchyTreeProps = {
  results: QueryResults;
  variables: VariableCategories;
  width: number;
  height: number;
};

const HierarchyTree = ({
  results,
  width,
  height,
  variables,
}: HierarchyTreeProps) => {
  const data = useMemo(() => {
    return getHierarchicalData(results, variables.key, variables.scalar);
  }, [results, variables.key, variables.scalar]);

  return (
    <div style={{ width, height }}>
      <Tree
        data={data}
        orientation="horizontal"
        collapsible={true}
        shouldCollapseNeighborNodes={true}
        depthFactor={500}
        initialDepth={1}
      />
    </div>
  );
};

export function getHierarchicalData(
  results: QueryResults,
  keyColumns: string[],
  scalarColumns: string[]
): any {
  let dataFromTitle: any = {};

  for (const row of results.data) {
    const column = keyColumns.at(-1)!;
    const nameIndex = results.header.indexOf(column);
    const name = row[nameIndex];
    const color = randomColor({ luminosity: "light" });
    // Leaf node contains title and size but no children
    dataFromTitle[row[nameIndex]] = {
      name,
      color,
      attributes: scalarColumns.reduce<Record<string, string>>((ac, column) => {
        const columnIndex = results.header.indexOf(column);
        return {
          ...ac,
          [column]: parseFloat(row[columnIndex]).toLocaleString(),
        };
      }, {}),
      style: {
        border: "thin solid black",
      },
    };
  }

  for (let i = keyColumns.length - 1; i > 0; i--) {
    const parentTitle = keyColumns[i - 1];
    const parentTitleIndex = results.header.indexOf(parentTitle);

    const childTitle = keyColumns[i];
    const childTitleIndex = results.header.indexOf(childTitle);

    const newDataFromTitle: Record<string, any> = {}; // Data with previous column as key
    const parentChildren: Record<string, Set<string>> = {};
    for (const row of results.data) {
      const parentValue = row[parentTitleIndex];
      const childValue = row[childTitleIndex];
      parentChildren[parentValue] = parentChildren[parentValue] ?? new Set();
      parentChildren[parentValue].add(childValue);
    }

    for (const parentValue of Object.keys(parentChildren)) {
      newDataFromTitle[parentValue] = newDataFromTitle[parentValue] ?? {
        name: parentValue,
        children: [],
        style: {
          border: "thin solid black",
        },
        size: 0,
      };
      const parentData = newDataFromTitle[parentValue];
      let groupColour = "";
      for (const childValue of parentChildren[parentValue]) {
        const childData = dataFromTitle[childValue];

        if (parentData.children.length > 0) {
          groupColour = parentData.children[0].color;
          childData.color = groupColour;
        }

        parentData.children.push(childData);
        parentData.size += childData.size; // Increment parent's size using child for circle packing
      }
      parentData.color = shadeColor(
        groupColour ? groupColour : randomColor({ luminosity: "light" }),
        -20
      );
    }

    dataFromTitle = newDataFromTitle;
  }
  const children: any[] = Object.values(dataFromTitle);
  const label = keyColumns[0];
  const totalSize = children
    .map((child: any) => child.value)
    .reduce((a, b) => a + b, 0);

  const data = {
    name: label, // Text to show hierarchy of columns
    children,
    color: shadeColor(children[0].color, -30),
    size: totalSize,
  };

  return data;
}

export default HierarchyTree;
