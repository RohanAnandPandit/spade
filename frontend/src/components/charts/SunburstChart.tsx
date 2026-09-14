import React, { useMemo, useState } from "react";
import { LabelSeries, Sunburst } from "react-vis";
import { QueryResults, VariableCategories } from "../../types";
import randomColor from "randomcolor";
import { shadeColor } from "../../utils/queryResults";
import { Alert, Breadcrumb, Divider, Space, Spin } from "antd";

type SunburstProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

// export const SunburstChart = observer(
//   ({ results, width, height, variables }: SunburstProps) => {
const LABEL_STYLE = {
  fontSize: "15px",
  textAnchor: "middle",
};

/**
 * Recursively work backwards from highlighted node to find path of valud nodes
 * @param {Object} node - the current node being considered
 * @returns {Array} an array of strings describing the key route to the current node
 */
function getKeyPath(node: any): string[] {
  if (!node.parent) {
    return ["root"];
  }

  return [(node.data && node.data.name) || node.name].concat(
    getKeyPath(node.parent)
  );
}

/**
 * Recursively modify data depending on whether or not each cell has been selected by the hover/highlight
 * @param {Object} data - the current node being considered
 * @param {Object|Boolean} keyPath - a map of keys that are in the highlight path
 * if this is false then all nodes are marked as selected
 * @returns {Object} Updated tree structure
 */
function updateData(data: any, keyPath: Record<string, boolean> | false) {
  if (data.children) {
    data.children.forEach((child: any) => updateData(child, keyPath));
  }
  // add a fill to all the uncolored cells
  if (!data.hex) {
    data.style = {
      fill: randomColor(), //EXTENDED_DISCRETE_COLOR_RANGE[5],
    };
  }
  data.style = {
    ...data.style,
    fillOpacity: keyPath && !keyPath[data.name] ? 0.2 : 1,
  };

  return data;
}

const SunburstChart = ({
  results,
  variables,
  width,
  height,
}: SunburstProps) => {
  const [path, setPath] = useState<string[] | null>(null);
  const [clicked, setClicked] = useState<boolean>(false);

  const { data: sourceData, titleSizes } = useMemo(
    () => getHierarchicalData(results, variables.key, variables.scalar[0]),
    [results, variables.key, variables.scalar]
  );
  const highlightedPath = useMemo(
    () =>
      path
        ? path.reduce<Record<string, boolean>>((values, name) => {
            values[name] = true;
            return values;
          }, {})
        : false,
    [path]
  );
  const data = useMemo(
    () => updateData(structuredClone(sourceData), highlightedPath),
    [highlightedPath, sourceData]
  );

  const finalValue = useMemo(() => (path ? path[path.length - 1] : ""), [path]);
  return (
    <Space direction="vertical">
      <Space>
        <Alert type="info" message="Click to lock/unlock selection" />
        <Divider type="vertical" />

        {path && (
          <Breadcrumb
            style={{ fontSize: 20 }}
            separator=">"
            items={path.map((title: string) => {
              return { title };
            })}
          />
        )}
      </Space>
      <Spin spinning={!sourceData}>
        <Sunburst
          animation
          hideRootNode
          onValueMouseOver={(node) => {
            if (clicked) {
              return;
            }
            setPath(getKeyPath(node).reverse().slice(1));
          }}
          onValueMouseOut={() => {
            if (!clicked) {
              setPath(null);
            }
          }}
          onValueClick={() => setClicked((value) => !value)}
          style={{
            stroke: "#ddd",
            strokeOpacity: 0.3,
            strokeWidth: "0.5",
          }}
          colorType="literal"
          getSize={(d: any) => d.value}
          getColor={(d: any) => d.hex}
          data={data}
          height={height - 75}
          width={width}
        >
          <LabelSeries
            data={[
              {
                x: 0,
                y: 0,
                label: finalValue
                  ? `${finalValue}: ${titleSizes[finalValue].toLocaleString()}`
                  : "Hover over cell for details",
                style: LABEL_STYLE,
              },
            ]}
            style={{ fontSize: 20 }}
          />
        </Sunburst>
      </Spin>
    </Space>
  );
};
export function getHierarchicalData(
  results: QueryResults,
  keyColumns: string[],
  sizeColumn: string
): any {
  const titleSizes: Record<string, number> = {};
  const sizeIndex = results.header.indexOf(sizeColumn);
  let dataFromTitle: any = {};

  for (const row of results.data) {
    const column = keyColumns.at(-1)!;
    const titleIndex = results.header.indexOf(column);
    const title = row[titleIndex];
    const value = parseFloat(row[sizeIndex]);
    const hex = randomColor({ luminosity: "light" });
    // Leaf node contains title and size but no children
    dataFromTitle[row[titleIndex]] = {
      name: title,
      value,
      hex,
      style: {
        border: "thin solid black",
      },
    };
    titleSizes[title] = value;
  }

  for (let i = keyColumns.length - 1; i > 0; i--) {
    const parentTitle = keyColumns[i - 1];
    const parentTitleIndex = results.header.indexOf(parentTitle);

    const childTitle = keyColumns[i];
    const childTitleIndex = results.header.indexOf(childTitle);

    const newDataFromTitle: Record<string, any> = {}; // Data with previous column as key
    const parentChildren: Record<string, Set<string>> = {};
    // Get all unique children for each unique parent
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
      };
      titleSizes[parentValue] = titleSizes[parentValue] ?? 0;
      const parentData = newDataFromTitle[parentValue];
      let groupColour = "";

      for (const childValue of parentChildren[parentValue]) {
        const childData = dataFromTitle[childValue];

        if (parentData.children.length > 0) {
          groupColour = parentData.children[0].color;
          childData.color = groupColour;
        }

        parentData.children.push(childData);
        titleSizes[parentValue] += titleSizes[childData.name]; // Increment parent's value using child's value
      }
      // The parent node will be slightly darker in colour
      parentData.hex = shadeColor(
        groupColour ? groupColour : randomColor({ luminosity: "light" }),
        -20
      );
    }

    dataFromTitle = newDataFromTitle;
  }
  const children: any[] = Object.values(dataFromTitle);
  const label = keyColumns[0]; // Label for root node will be hidden anyways
  const totalValue = children
    .map((child: any) => child.value)
    .reduce((a, b) => a + b, 0);

  titleSizes[label] = totalValue;

  const data = {
    name: label,
    children,
  };

  return { data, titleSizes };
}

export default SunburstChart;
