import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { QueryResults, VariableCategories } from "../../types";
import {
  groupByColumn,
  removePrefix,
  uniqueValues,
} from "../../utils/queryResults";
import randomColor from "randomcolor";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";

type RadarChartProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

const SpiderChart = observer(
  ({ results, width, height, variables }: RadarChartProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;

    const { header } = results;
    const ringKeyIdx = header.indexOf(variables.key[0] || variables.lexical[0]);
    const spokeKeyIdx = header.indexOf(variables.key[1] || variables.scalar[0]);
    const valueIdx = header.indexOf(variables.numeric[0]);

    const data = useMemo(() => {
      const spokeGroups = groupByColumn(results.data, spokeKeyIdx);
      const data = Object.keys(spokeGroups).map((spoke: string) => {
        const values: any = { [header[spokeKeyIdx]]: spoke };

        for (let row of spokeGroups[spoke]) {
          values[row[ringKeyIdx]] = parseFloat(row[valueIdx]);
        }
        return values;
      });
      return data;
    }, [header, results.data, ringKeyIdx, spokeKeyIdx, valueIdx]);

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
          height={height}
          data={data}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey={header[spokeKeyIdx]} />
          <PolarRadiusAxis angle={30} />

          {uniqueValues(results.data, ringKeyIdx).map(
            (dataKey: string, index: number) => {
              const colour = randomColor({
                luminosity: settings.darkMode() ? "light" : "dark",
              });
              return (
                <Radar
                  key={`radar-${index}`}
                  name={removePrefix(dataKey)}
                  dataKey={removePrefix(dataKey)}
                  stroke={colour}
                  fill={colour}
                  fillOpacity={0.6}
                />
              );
            }
          )}
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    );
  }
);

export default SpiderChart;
