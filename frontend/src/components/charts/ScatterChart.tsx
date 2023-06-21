import { QueryResults, Row, VariableCategories } from "../../types";
import { groupByColumn, removePrefix } from "../../utils/queryResults";
import { observer } from "mobx-react-lite";
import ReactApexChart from "react-apexcharts";
import { useMemo } from "react";

type ScatterChartProps = {
  results: QueryResults;
  width?: number;
  height: number;
  variables: VariableCategories;
};

const ScatterChart = observer(
  ({ results, width, height, variables }: ScatterChartProps) => {
    const { header, data } = results;
    const keyIdx = header.indexOf(variables.key[0]);
    const xIdx = header.indexOf(variables.scalar[0]);
    const yIdx = header.indexOf(variables.scalar[1]);

    const series = useMemo(() => {
      if (keyIdx === -1) {
        return [
          {
            data: data.map((row: Row) => {
              const x = parseFloat(row[xIdx]);
              const y = parseFloat(row[yIdx]);

              return [x, y];
            }),
          },
        ];
      }
      const groups = groupByColumn(data, keyIdx);

      return Object.keys(groups).map((name: string) => {
        const rows = groups[name];
        return {
          name: removePrefix(name),
          data: rows.map((row: Row) => {
            const x = parseFloat(row[xIdx]);
            const y = parseFloat(row[yIdx]);

            return [x, y];
          }),
        };
      });
    }, [keyIdx, data, xIdx, yIdx]);

    const options: any = {
      chart: {
        height,
        type: "scatter",
        zoom: {
          enabled: true,
          type: "xy",
        },
      },
      xaxis: {
        title: { text: header[xIdx] },

        tickAmount: 10,
        labels: {
          formatter: function (val: any) {
            return parseFloat(val).toFixed(1);
          },
        },
      },
      yaxis: {
        title: { text: header[yIdx] },
        tickAmount: 7,
      },
    };

    return (
      <div>
        <ReactApexChart options={options} series={series} type="scatter" />
      </div>
    );
  }
);

export default ScatterChart;
