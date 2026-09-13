import { Card, Space, Statistic } from "antd";
import { QueryResults, VariableCategories } from "../../types";
import { uniqueValues } from "../../utils/queryResults";
import { useMemo } from "react";

type CardinatlitiesProps = {
  results: QueryResults;
  variables: VariableCategories;
};

const Cardinatlities = ({ results, variables }: CardinatlitiesProps) => {
  return (
    <Card title="Cardinality of columns">
      <Space>
        {variables.key.map((column: string) => (
          <ColumnCardinality key={column} results={results} column={column} />
        ))}
      </Space>
    </Card>
  );
};

type ColumnCardinalityProps = {
  results: QueryResults;
  column: string;
};
const ColumnCardinality = ({ results, column }: ColumnCardinalityProps) => {
  const values = useMemo(() => {
    const index = results.header.indexOf(column);
    return uniqueValues(results.data, index).length;
  }, [results, column]);

  return (
    <Card bordered={false} hoverable>
      <Statistic key={column} title={column} value={values} />
    </Card>
  );
};
export default Cardinatlities;
