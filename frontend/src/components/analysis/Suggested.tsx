import { Space } from "antd";
import { QueryResults, VariableCategories } from "../../types";
import Cardinalities from "./Cardinalities";
import { ColumnRelations } from "./ColumnRelations";

type SuggestedProps = {
  results: QueryResults;
  variables: VariableCategories;
  allRelations: any;
  allOutgoingLinks: any;
  allIncomingLinks: any;
};
export const Suggested = ({
  results,
  variables,
  allRelations,
  allIncomingLinks,
  allOutgoingLinks,
}: SuggestedProps) => {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <ColumnRelations
        results={results}
        variables={variables}
        allRelations={allRelations}
        allIncomingLinks={allIncomingLinks}
        allOutgoingLinks={allOutgoingLinks}
      />
      <Cardinalities results={results} variables={variables} />
    </Space>
  );
};
