import { observer } from "mobx-react-lite";
import { QueryResults, VariableCategories } from "../../types";
import { useMemo } from "react";
// import { useStore } from "../../stores/store";
import ReactApexChart from "react-apexcharts";
import { Alert, Space } from "antd";

type HeatMapProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

export const HeatMap = observer(
  ({ results, width, height, variables }: HeatMapProps) => {
    // const rootStore = useStore();
    // const settings = rootStore.settingsStore;

    const series: any = useMemo(() => {
      const key1Idx = results.header.indexOf(variables.key[0]);
      const key2Idx = results.header.indexOf(variables.key[1]);
      const scalarIdx = results.header.indexOf(variables.scalar[0]);
      const sizes = {};
      const key1Values = new Set<string>();
      const key2Values = new Set<string>();

      for (let row of results.data) {
        const key1 = row[key1Idx];
        const key2 = row[key2Idx];
        key1Values.add(key1);
        key2Values.add(key2);
        sizes[key1] = sizes[key1] ?? {};
        sizes[key1][key2] = row[scalarIdx];
        sizes[key2] = sizes[key2] ?? {};
        sizes[key2][key1] = row[scalarIdx];
      }
      const xLabels: string[] = Array.from(key1Values);
      const yLabels: string[] = Array.from(key2Values);

      const series = xLabels.map((xCategory) => {
        return {
          name: xCategory,
          data: yLabels.map((yCategory) => ({
            x: yCategory,
            y: sizes[xCategory][yCategory] ?? 0,
          })),
        };
      });
      return series;
    }, [results.data, results.header, variables.key, variables.scalar]);

    const options: any = {
      dataLabels: {
        enabled: false,
      },
      colors: ["#008FFB"],
      title: {
        text: variables.scalar[0],
      },
    };

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <ReactApexChart
          options={options}
          series={series}
          type="heatmap"
        />
        <Alert message="Hover over cells to see the value. Click on menu icon at the top right to download the chart." />
      </Space>
    );
  }
);

export default HeatMap;
