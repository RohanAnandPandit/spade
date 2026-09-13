import { useEffect, useState } from "react";
import { getPropertyValues } from "../../api/dataset";
import { Descriptions, message, Skeleton } from "antd";
import { displayText, removePrefix } from "../../utils/queryResults";
import { PropertyType, RepositoryId, URI } from "../../types";

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
  const [data, setData] = useState<[URI, string][]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPropertyValues(repository, uri, propType)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) {
          setData([]);
          message.error("Could not load property values.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, uri, propType]);

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
