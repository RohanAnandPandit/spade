import { QueryResults, VariableCategories } from "../../types";
import { groupByColumn, removePrefix } from "../../utils/queryResults";
import randomColor from "randomcolor";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryScatter,
  VictoryTheme,
  VictoryTooltip,
  createContainer,
} from "victory";
import { useMemo } from "react";

type ScatterChartProps = {
  results: QueryResults;
  width?: number;
  height: number;
  variables: VariableCategories;
};

const ScatterChart = observer(
  ({ results, width, height, variables }: ScatterChartProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;
    const { header, data } = results;
    const keyIdx = header.indexOf(variables.key[0]);
    const xIdx = header.indexOf(variables.scalar[0]);
    const yIdx = header.indexOf(variables.scalar[1]);
    const zIdx = header.indexOf(variables.scalar[2]);

    const seriesData = useMemo(() => {
      const series =
        keyIdx !== -1 ? Object.values(groupByColumn(data, keyIdx)) : [data];

      return series.map((rows) => {
        const color = randomColor({
          luminosity: settings.darkMode() ? "light" : "dark",
        });
        return rows.map((row) => {
          let label = `${keyIdx >= 0 ? removePrefix(row[keyIdx]) : ""}
                        ${results.header[xIdx]}: ${parseFloat(row[xIdx])}
                        ${results.header[yIdx]}: ${parseFloat(
            row[yIdx]
          ).toLocaleString()}`;
          if (zIdx !== -1) {
            label += `
            ${results.header[zIdx]}: ${parseFloat(row[zIdx]).toLocaleString()}`;
          }

          return {
            label,
            x: parseFloat(row[xIdx]),
            y: parseFloat(row[yIdx]),
            z: parseFloat(row[zIdx]),
            fill: color,
          };
        });
      });
    }, [keyIdx, data, results.header, xIdx, yIdx, zIdx, settings]);

    const VictoryZoomVoronoiContainer: any = createContainer("zoom", "voronoi");

    return (
      <div>
        <VictoryChart
          width={width}
          height={height}
          theme={VictoryTheme.material}
          padding={{ bottom: 40, left: 100, right: 50, top: 10 }}
          domainPadding={{ x: 10, y: 10 }}
          containerComponent={
            <VictoryZoomVoronoiContainer
              width={width}
              height={height}
              responsive={false}
              labels={({ datum }: any) => datum.label}
            />
          }
        >
          <VictoryAxis
            label={results.header[xIdx]}
            axisLabelComponent={<VictoryLabel dy={20} />}
            style={{
              tickLabels: { fontSize: 15, padding: 5 },
            }}
            fixLabelOverlap
            domainPadding={{ x: [10, -10], y: 5 }}
          />
          <VictoryAxis
            label={results.header[yIdx]}
            style={{
              tickLabels: { fontSize: 15, padding: 5 },
            }}
            dependentAxis
            fixLabelOverlap
            domainPadding={{ x: [10, -10], y: 5 }}
          />
          <VictoryScatter
            bubbleProperty="z"
            maxBubbleSize={20}
            minBubbleSize={5}
            labelComponent={<VictoryTooltip style={{ fontSize: 15 }} />}
            style={{ data: { fill: ({ datum }) => datum.fill } }}
            data={seriesData.flat(1)}
          />
        </VictoryChart>
      </div>
    );
  }
);

export default ScatterChart;
