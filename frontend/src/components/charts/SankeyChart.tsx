import { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { QueryResults, VariableCategories } from "../../types";
import { removePrefix } from "../../utils/queryResults";
import randomColor from "randomcolor";

function getNodesAndLinks(
  results: QueryResults,
  colA: string,
  colB: string,
  valueCol: string
): any {
  const colAIndex = results.header.indexOf(colA);
  const colBIndex = results.header.indexOf(colB);
  const valueColIndex = results.header.indexOf(valueCol);
  const idToNode: { [key: string]: { id: string; nodeColor: string } } = {};
  const links: { source: string; target: string; value: number }[] = [];
  for (let row of results.data) {
    const nodeA = removePrefix(row[colAIndex]);
    const nodeB = removePrefix(row[colBIndex]);
    if (!idToNode[nodeA]) {
      idToNode[nodeA] = { id: nodeA, nodeColor: randomColor() };
    }
    if (!idToNode[nodeB]) {
      idToNode[nodeB] = { id: nodeB, nodeColor: randomColor() };
    }
    links.push({
      source: nodeA,
      target: nodeB,
      value: parseFloat(row[valueColIndex]),
    });
  }
  const data = { nodes: Object.values(idToNode), links };
  return data;
}

type SankeyChartProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

const SankeyChart = ({
  results,
  width,
  height,
  variables,
}: SankeyChartProps) => {
  const data = useMemo(() => {
    const { key, scalar } = variables;
    return getNodesAndLinks(results, key[0], key[1], scalar[0]);
  }, [variables, results]);

  return (
    <div style={{ width, height: 2 * height }}>
      <ResponsiveSankey
        data={data}
        margin={{right: 160, left: 50 }}
        align="justify"
        colors={{ scheme: "category10" }}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderColor={{
          from: "color",
          modifiers: [["darker", 0.8]],
        }}
        nodeBorderRadius={3}
        linkOpacity={0.5}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="vertical"
        labelPadding={16}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1]],
        }}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            translateX: 130,
            itemWidth: 100,
            itemHeight: 14,
            itemDirection: "right-to-left",
            itemsSpacing: 2,
            itemTextColor: "#999",
            symbolSize: 14,
            effects: [
              {
                on: "hover",
                style: {
                  itemTextColor: "#000",
                },
              },
            ],
          },
        ]}
      />
    </div>
  );
};

export default SankeyChart;
