import { useEffect, useState } from "react";
import { Divider, Select, Skeleton, Space, Typography } from "antd";
import { RepositoryId, URI } from "../../types";
import { removePrefix } from "../../utils/queryResults";
import { getTypeProperties, getAllTypes } from "../../api/dataset";
import { MetaInfo } from "./MetaInfo";
import { useStore } from "../../stores/store";

const { Text } = Typography;

type TypesProps = {
  repository: RepositoryId;
};

const ClassProperties = ({ repository }: TypesProps) => {
  const username = useStore().authStore.username!;

  const [allTypes, setAllTypes] = useState<URI[]>([]);
  const [type, setType] = useState<URI>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getAllTypes(repository, username).then((res: URI[]) => {
      setAllTypes(res);
      setLoading(false);
    });
  }, [repository, username]);

  return (
    <Skeleton active loading={loading}>
      <Space direction="vertical">
        <Space.Compact direction="vertical">
          <Typography.Text>Select class</Typography.Text>
          <Select
            placeholder="Select type"
            value={type}
            options={allTypes.map((t) => {
              return { value: t, label: removePrefix(t) };
            })}
            onChange={(value) => setType(value)}
            style={{ width: 200 }}
          />
        </Space.Compact>
        {type && (
          <>
            <Divider />
            <Properties repository={repository} type={type} />
          </>
        )}
      </Space>
    </Skeleton>
  );
};

type PropertiesProps = {
  repository: RepositoryId;
  type: URI;
};
const Properties = ({ repository, type }: PropertiesProps) => {
  const username = useStore().authStore.username!;

  const [allProperties, setAllProperties] = useState<URI[]>([]);
  const [property, setProperty] = useState<URI>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    setProperty("");
    getTypeProperties(repository, type, username).then((res: URI[]) => {
      setAllProperties(res);
      setLoading(false);
    });
  }, [repository, type, username]);

  return (
    <Skeleton loading={loading}>
      <Space direction="vertical">
        <Space>
          <Typography.Text>Select property</Typography.Text>
          <Select
            placeholder="Select property"
            value={property}
            options={allProperties.map((prop) => {
              return { value: prop, label: removePrefix(prop) };
            })}
            onChange={(value) => setProperty(value)}
            style={{ width: 200 }}
          />
        </Space>
        {property && (
          <Skeleton active loading={loading}>
            <Space direction="vertical">
              <Text>{property}</Text>
              <MetaInfo repository={repository} uri={property} />
            </Space>
          </Skeleton>
        )}
      </Space>
    </Skeleton>
  );
};

export default ClassProperties;
