import { QueryResults, Triplet, VariableCategories } from "../../types";
import { useMemo } from "react";
import GraphVis from "../graph/GraphVis";

type NetworkChartProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

const NetworkChart = ({
  results,
  width,
  height,
  variables,
}: NetworkChartProps) => {
  const { header, data } = results;
  const fromIndex = header.indexOf(variables.key[0] || variables.lexical[0]);
  const toIndex = header.indexOf(
    variables.key[1] ||
      variables.lexical[header[fromIndex] !== variables.lexical[0] ? 0 : 1]
  );
  const valueIndex = header.indexOf(variables.scalar[0]);

  const links: Triplet[] = useMemo(
    () =>
      data.map((row) => [
        row[fromIndex],
        valueIndex > 0 ? row[valueIndex] : "",
        row[toIndex],
      ]),
    [data, fromIndex, toIndex, valueIndex]
  );
  return (
    <GraphVis links={links} width={width} height={height} interactive={false} />
  );
};

export default NetworkChart;
