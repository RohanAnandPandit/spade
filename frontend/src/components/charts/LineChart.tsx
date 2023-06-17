import { useMemo } from "react";
import { QueryResults, VariableCategories } from "../../types";
import { groupByColumn, removePrefix } from "../../utils/queryResults";
import randomColor from "randomcolor";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryTheme,
  VictoryTooltip,
  createContainer,
} from "victory";

type LineChartProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

const LineChart = observer(
  ({ results, width, height, variables }: LineChartProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;
    const { header, data } = results;
    const keyIdx = header.indexOf(variables.key[0] || variables.lexical[0]);
    const xIdx = header.indexOf(variables.scalar[0]);
    const yIdx = header.indexOf(variables.scalar[1]);

    const linesData = useMemo(() => {
      const lines =
        keyIdx !== -1
          ? Object.values(groupByColumn(data, keyIdx))
          : { data: data };
      const linesData = Object.keys(lines).map((name) => {
        return {
          data: lines[name].map((row) => {
            const label = `${keyIdx >= 0 ? removePrefix(row[keyIdx]) : ""}
      ${header[xIdx]}: ${row[xIdx]}  
      ${header[yIdx]}: ${parseFloat(row[yIdx]).toLocaleString()}`;

            return {
              label,
              x: parseFloat(row[xIdx]),
              y: parseFloat(row[yIdx]),
            };
          }),
          color: randomColor({
            luminosity: settings.darkMode() ? "light" : "dark",
          }),
        };
      });
      return linesData;
    }, [keyIdx, data, header, xIdx, yIdx, settings.state.darkMode]);

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
            // axisLabelComponent={<VictoryLabel dy={-75} />}
            style={{
              tickLabels: { fontSize: 15, padding: 5 },
            }}
            dependentAxis
            fixLabelOverlap
            domainPadding={{ x: [10, -10], y: 5 }}
          />
          {linesData.map(({ data, color }, index) => (
            <VictoryLine
              key={`line-${index}`}
              labelComponent={<VictoryTooltip style={{ fontSize: 15 }} />}
              style={{ data: { stroke: color } }}
              data={data}
            />
          ))}
        </VictoryChart>
      </div>
    );
  }
);

export default LineChart;
