import { QueryResults, VariableCategories } from "../../types";
import TreeMap from "./TreeMap";

type CirclePackingProps = {
  results: QueryResults;
  width: number;
  height: number;
  variables: VariableCategories;
};

export const CirclePacking = (props: CirclePackingProps) => {
  return <TreeMap {...props} mode="circlePack" />;
};
