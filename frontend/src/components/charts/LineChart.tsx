import { useMemo } from "react";
import { QueryResults, Row, VariableCategories } from "../../types";
import { groupByColumn, removePrefix } from "../../utils/queryResults";
// import randomColor from "randomcolor";
// import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import ReactApexChart from "react-apexcharts";

type LineChartProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

function getData(data, xIdx: number, yIdx: number) {
  return data
    .map((row: Row) => {
      const x = parseFloat(row[xIdx]);
      const y = parseFloat(row[yIdx]);

      return [x, y];
    })
    .sort((a: number[], b: number[]) => a[0] - b[0]);
}

const LineChart = observer(
  ({ results, width, height, variables }: LineChartProps) => {
    // const rootStore = useStore();
    // const settings = rootStore.settingsStore;
    const { header, data } = results;
    const keyIdx = header.indexOf(variables.key[0]);
    const xIdx = header.indexOf(variables.scalar[0]);
    const yIdx = header.indexOf(variables.scalar[1]);

    const series = useMemo(() => {
      if (keyIdx === -1) {
        return [
          {
            data: getData(data, xIdx, yIdx),
          },
        ];
      }
      const groups = groupByColumn(data, keyIdx);

      return Object.keys(groups).map((name: string) => {
        const rows = groups[name];
        return {
          name: removePrefix(name),
          data: getData(rows, xIdx, yIdx),
        };
      });
    }, [keyIdx, data, xIdx, yIdx]);

    const options: any = {
      chart: {
        height,
        type: "line",
        zoom: {
          enabled: true,
          type: "xy",
        }
      },
      markers: {
        size: 2,
      },
      xaxis: {
        title: { text: header[xIdx] },
        type: variables.numeric.includes(header[xIdx]) ? "numeric" : "category",
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
        <ReactApexChart options={options} series={series} type="line" />
      </div>
    );
  }
);

export default LineChart;
