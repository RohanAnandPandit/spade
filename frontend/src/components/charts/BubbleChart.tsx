import { QueryResults, Row, VariableCategories } from "../../types";
import { groupByColumn, removePrefix } from "../../utils/queryResults";
import { observer } from "mobx-react-lite";
import ReactApexChart from "react-apexcharts";
import { useMemo } from "react";

type BubbleChartProps = {
  results: QueryResults;
  width?: number;
  height: number;
  variables: VariableCategories;
};

const BubbleChart = observer(
  ({ results, width, height, variables }: BubbleChartProps) => {
    const { header, data } = results;
    const keyIdx = header.indexOf(variables.key[0]);
    const xIdx = header.indexOf(variables.scalar[0]);
    const yIdx = header.indexOf(variables.scalar[1]);
    const zIdx = header.indexOf(variables.scalar[2]);

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
            const z = parseFloat(row[zIdx]);

            return [x, y, z];
          }),
        };
      });
    }, [keyIdx, data, xIdx, yIdx, zIdx]);

    const options: any = {
      chart: {
        height,
        type: "bubble",
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        opacity: 0.8,
      },
      title: {
        // text: "Simple Bubble Chart",
      },
      xaxis: {
        title: { text: header[xIdx] },
        tickAmount: 12,
        type: "category",
      },
      yaxis: {
        title: { text: header[yIdx] },
      },
    };

    return (
      <div>
        <ReactApexChart options={options} series={series} type="bubble" />
      </div>
    );
  }
);

export default BubbleChart;
