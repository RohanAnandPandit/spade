import { useMemo } from "react";
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
import { removePrefix, uniqueValues } from "../../utils/queryResults";
import { Tabs, Alert, Typography, Tag } from "antd";

type BarChartProps = {
  results: QueryResults;
  variables: VariableCategories;
  width: number;
  height: number;
};

const BAR_INSTANCES_LIMIT = 100;

const BarChart = ({ results, width, height, variables }: BarChartProps) => {
  const tabHeight = 60;
  const barColumn = useMemo(
    () => variables.key[0] || variables.lexical[0],
    [variables.key, variables.lexical]
  );

  const barIndex = useMemo(
    () => results.header.indexOf(barColumn),
    [barColumn, results.header]
  );

  if (!barColumn || variables.numeric.length === 0) {
    return <Alert message="Data does not match format" banner />;
  }

  return (
    <>
      <Constraints results={results} barColumn={barColumn} />
      <Tabs
        defaultActiveKey="1"
        items={variables.numeric.map((column, id) => {
          const valueIndex = results.header.indexOf(column);

          const data = results.data.map((row) => {
            const bar: any = {
              name: removePrefix(row[barIndex]),
              [column]: parseFloat(row[valueIndex]),
            };

            return bar;
          });

          return {
            key: `column-${id}`,
            label: column,
            children: (
              <ResponsiveContainer width="100%" height={height - tabHeight}>
                <BarRechart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={results.header[valueIndex]} fill="#8884d8" />
                </BarRechart>
              </ResponsiveContainer>
            ),
          };
        })}
      />
    </>
  );
};

const Constraints = ({ results, barColumn }) => {
  const instances = useMemo(() => {
    const barIndex = results.header.indexOf(barColumn);
    return uniqueValues(results.data, barIndex);
  }, [results.header, results.data, barColumn]);

  return (
    <>
      {instances.length > BAR_INSTANCES_LIMIT && (
        <Alert
          banner
          message={
            <Typography.Text>
              Instances for <Tag>{barColumn}</Tag> exceed 100. Use LIMIT 100 in
              your query for better readability.
            </Typography.Text>
          }
        />
      )}
      {instances.length < results.data.length && (
        <Alert
          banner
          message={
            <Typography.Text>
              There are duplicate entries for <Tag>{barColumn}</Tag>. You could
              use another column for disambiguation.
            </Typography.Text>
          }
        />
      )}
    </>
  );
};
export default BarChart;
