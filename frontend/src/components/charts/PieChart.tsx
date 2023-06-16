import {
  Cell,
  Legend,
  Pie,
  PieChart as PieRechart,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { QueryResults, VariableCategories } from "../../types";
import { removePrefix } from "../../utils/queryResults";
import { useStore } from "../../stores/store";
import randomColor from "randomcolor";
import { observer } from "mobx-react-lite";
import { Alert, Tabs } from "antd";

type PieChartProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

const PieChart = observer(
  ({ results, width, height, variables }: PieChartProps) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;
    const keyIndex = results.header.indexOf(
      variables.key[0] || variables.lexical[0]
    );
    if (variables.numeric.length === 0) {
      return <Alert banner message="There are no numeric columns available" />;
    }
    if (variables.key.length === 0 && variables.lexical.length === 0) {
      return <Alert banner message="There is no key column available" />;
    }
    return (
      <Tabs
        defaultActiveKey={variables.numeric[0]}
        items={variables.numeric.map((column) => {
          const columnIndex = results.header.indexOf(column);
          const data = results.data.map((row) => {
            return {
              [results.header[keyIndex]]: removePrefix(row[keyIndex]),
              [results.header[columnIndex]]: parseInt(row[columnIndex]),
            };
          });

          const totalSum = results.data
            .map((row) => parseInt(row[columnIndex]))
            .reduce((a, b) => a + b, 0);

          const CustomTooltip = ({ active, payload, label }: any) => {
            if (active) {
              return (
                <div
                  className="custom-tooltip"
                  style={{
                    backgroundColor: settings.darkMode() ? "black" : "#ffff",
                    padding: "5px",
                    border: "columnIndexpx solid #cccc",
                  }}
                >
                  {`${payload[0].name} : ${(
                    (100 * payload[0].value) /
                    totalSum
                  ).toFixed(2)}%`}
                </div>
              );
            }
            return null;
          };
          return {
            key: column,
            label: column,
            children: (
              <ResponsiveContainer width="100%" height={height}>
                <PieRechart>
                  <Pie
                    data={data}
                    nameKey={results.header[0]}
                    dataKey={results.header[columnIndex]}
                    cx="50%"
                    cy="50%"
                    // outerRadius={50}
                    fill="#8884d8"
                    label
                  >
                    {data.map((entry, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={randomColor({
                          luminosity: settings.darkMode() ? "light" : "dark",
                        })}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                </PieRechart>
              </ResponsiveContainer>
            ),
          };
        })}
      />
    );
  }
);

export default PieChart;
