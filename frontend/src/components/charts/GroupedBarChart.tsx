import {
  Bar,
  BarChart as BarRechart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { QueryResults, VariableCategories } from "../../types";
import {
  groupByColumn,
  removePrefix,
  uniqueValues,
} from "../../utils/queryResults";
import { useMemo } from "react";
import randomColor from "randomcolor";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import { Alert } from "antd";

type GroupedBarChartProps = {
  results: QueryResults;
  variables: VariableCategories;
  width: number;
  height: number;
};

const GroupedBarChart = observer(
  ({ results, width, height, variables }: GroupedBarChartProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;

    const tabHeight = 60;
    const { header } = results;

    const groupKey = variables.key[1]
      ? variables.key[0]
      : variables.temporal[0];
    const barKey = variables.key[1] ?? variables.key[0];

    const groupKeyIdx = header.indexOf(groupKey);
    const barKeyIdx = header.indexOf(barKey);
    const valueKey = variables.numeric[0];
    const valueIdx = header.indexOf(valueKey);

    const data = useMemo(() => {
      const groups = groupByColumn(results.data, groupKeyIdx);
      const data = Object.keys(groups).map((groupLabel: string) => {
        const values = { [header[groupKeyIdx]]: removePrefix(groupLabel) };

        for (let row of groups[groupLabel]) {
          values[row[barKeyIdx]] = row[valueIdx];
        }
        return values;
      });
      return data;
    }, [header, results.data, groupKeyIdx, barKeyIdx, valueIdx]);

    if (variables.key.length === 0 && variables.lexical.length === 0) {
      return (
        <Alert
          banner
          message="Cannot display chart because there is no key variable."
        />
      );
    }
    return (
      <ResponsiveContainer width="100%" height={height - tabHeight}>
        <BarRechart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={header[groupKeyIdx]} />
          <YAxis />
          <Tooltip />
          <Legend />
          {uniqueValues(results.data, barKeyIdx).map(
            (dataKey: string, index: number) => (
              <Bar
                key={`bar-${index}`}
                dataKey={dataKey}
                fill={randomColor({
                  luminosity: settings.darkMode() ? "light" : "dark",
                })}
              />
            )
          )}
        </BarRechart>
      </ResponsiveContainer>
    );
  }
);

export default GroupedBarChart;
