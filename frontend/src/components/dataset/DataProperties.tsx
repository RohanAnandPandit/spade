import { useEffect, useState } from "react";
import { getPropertyValues } from "../../api/dataset";
import { Descriptions, Skeleton } from "antd";
import { displayText, removePrefix } from "../../utils/queryResults";
import { PropertyType, RepositoryId, URI } from "../../types";
import { useStore } from "../../stores/store";

type PropertyValuesProps = {
  repository: RepositoryId;
  uri: URI;
  propType: PropertyType;
};

export const PropertyValues = ({
  repository,
  uri,
  propType,
}: PropertyValuesProps) => {
  const username = useStore().authStore.username!;
  
  const [data, setData] = useState<[URI, string][]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    getPropertyValues(repository, uri, propType, username).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [repository, uri, propType, username]);

  return (
    <Skeleton loading={loading}>
      <Descriptions size="small" bordered>
        {data.map(([prop, value]) => (
          <Descriptions.Item key={prop} label={removePrefix(prop)} span={3}>
            {displayText(value)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Skeleton>
  );
};
