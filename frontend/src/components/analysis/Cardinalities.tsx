import { Card, Skeleton, Space, Statistic } from "antd";
import { QueryResults, VariableCategories } from "../../types";
import { uniqueValues } from "../../utils/queryResults";
import { useMemo, useState } from "react";

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
  const [loading, setLoading] = useState<boolean>(false);

  const values = useMemo(() => {
    const index = results.header.indexOf(column);
    setLoading(true);
    const values = uniqueValues(results.data, index).length;
    setLoading(false);
    return values;
  }, [results, column]);

  return (
    <Card bordered={false} hoverable>
      <Skeleton loading={loading}>
        <Statistic key={column} title={column} value={values} />
      </Skeleton>
    </Card>
  );
};
export default Cardinatlities;
