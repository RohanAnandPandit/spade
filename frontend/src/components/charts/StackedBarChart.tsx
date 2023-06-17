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

type StackedBarChartProps = {
  results: QueryResults;
  variables: VariableCategories;
  width: number;
  height: number;
};

const StackedBarChart = observer(
  ({ results, width, height, variables }: StackedBarChartProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;

    const tabHeight = 60;
    const { header } = results;

    const stackKey = variables.key[1]
      ? variables.key[0]
      : variables.temporal[0];
    const barKey = variables.key[1] ?? variables.key[0];

    const barKeyIdx = header.indexOf(barKey);
    const stackKeyIdx = header.indexOf(stackKey);
    const valueKey = variables.numeric[0];
    const valueIdx = header.indexOf(valueKey);

    const data = useMemo(() => {
      const stacks = groupByColumn(results.data, stackKeyIdx);
      const data = Object.keys(stacks).map((stackLabel: string) => {
        const values = { [header[stackKeyIdx]]: removePrefix(stackLabel) };

        for (let row of stacks[stackLabel]) {
          values[row[barKeyIdx]] = row[valueIdx];
        }
        return values;
      });
      return data;
    }, [header, results.data, barKeyIdx, stackKeyIdx, valueIdx]);

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
          <XAxis dataKey={header[stackKeyIdx]} />
          <YAxis />
          <Tooltip />
          <Legend />
          {uniqueValues(results.data, barKeyIdx).map(
            (dataKey: string, index: number) => (
              <Bar
                key={`bar-${index}`}
                dataKey={dataKey}
                stackId="a"
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

export default StackedBarChart;
