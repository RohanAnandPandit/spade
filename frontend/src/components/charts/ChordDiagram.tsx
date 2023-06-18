import { ResponsiveChord } from "@nivo/chord";
import { QueryResults, URI, VariableCategories } from "../../types";
import { useStore } from "../../stores/store";
import { useMemo, useState } from "react";
import randomColor from "randomcolor";
import { removePrefix } from "../../utils/queryResults";
import { Space } from "antd";

type ChordDiagramProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

const ChordDiagram = ({
  results,
  width,
  height,
  variables,
}: ChordDiagramProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const { header, data } = results;
  const col1Idx = header.indexOf(variables.key[0] ?? variables.lexical[0]);
  const col2Idx = header.indexOf(variables.key[1] ?? variables.lexical[1]);

  const valueColumn = variables.scalar[0];
  const [labels, setLabels] = useState<URI[]>([]);

  const matrix: number[][] = useMemo(() => {
    const uniqueLabels = new Set<URI>();
    const links: { [key: string]: { [key: string]: number } } = {};
    const valueIdx = results.header.indexOf(valueColumn);
    for (let row of data) {
      uniqueLabels.add(row[col1Idx]);
      uniqueLabels.add(row[col2Idx]);

      if (!links[row[col1Idx]]) {
        links[row[col1Idx]] = {};
      }

      links[row[col1Idx]][row[col2Idx]] = parseFloat(row[valueIdx]);

      if (!links[row[col2Idx]]) {
        links[row[col2Idx]] = {};
      }

      links[row[col2Idx]][row[col1Idx]] = parseFloat(row[valueIdx]);
    }
    const allLabels = Array.from(uniqueLabels);

    setLabels(allLabels);

    const m = allLabels.map((label1) =>
      allLabels.map((label2) =>
        links[label1] ? links[label1][label2] ?? 0 : 0
      )
    );
    console.log(m);
    return m;
  }, [results.header, valueColumn, data, col1Idx, col2Idx]);

  return (
    <div style={{ width, height }}>
      <ResponsiveChord
        data={matrix}
        keys={labels.map((t: URI) => removePrefix(t))}
        margin={{ top: 60, right: 60, bottom: 90, left: 60 }}
        valueFormat=".2f"
        padAngle={0.02}
        innerRadiusRatio={0.96}
        innerRadiusOffset={0.02}
        inactiveArcOpacity={0.25}
        arcBorderColor={{
          from: "color",
          modifiers: [["darker", 0.6]],
        }}
        activeRibbonOpacity={0.75}
        inactiveRibbonOpacity={0.25}
        ribbonBorderColor={{
          from: "color",
          modifiers: [["darker", 0.6]],
        }}
        labelRotation={-90}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1]],
        }}
        colors={{ scheme: "nivo" }}
        motionConfig="stiff"
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateX: 0,
            translateY: 70,
            itemWidth: 80,
            itemHeight: 14,
            itemsSpacing: 0,
            itemTextColor: "#999",
            itemDirection: "left-to-right",
            symbolSize: 12,
            symbolShape: "circle",
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

export default ChordDiagram;
