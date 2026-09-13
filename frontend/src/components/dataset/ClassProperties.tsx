import { useEffect, useState } from "react";
import { Divider, message, Select, Skeleton, Space, Typography } from "antd";
import { RepositoryId, URI } from "../../types";
import { removePrefix } from "../../utils/queryResults";
import { getTypeProperties, getAllTypes } from "../../api/dataset";
import { MetaInfo } from "./MetaInfo";
import { useStore } from "../../stores/store";

type TypesProps = {
  repository: RepositoryId;
};

const ClassProperties = ({ repository }: TypesProps) => {
  const username = useStore().authStore.username!;

  const [allTypes, setAllTypes] = useState<URI[]>([]);
  const [type, setType] = useState<URI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getAllTypes(repository, username)
      .then((res: URI[]) => {
        if (active) setAllTypes(res);
      })
      .catch(() => {
        if (active) message.error("Could not load repository classes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, username]);

  return (
    <Skeleton active loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space.Compact direction="vertical" style={{ width: "100%" }}>
          <Typography.Text>Select class</Typography.Text>
          <Select
            placeholder="Enter type name"
            value={type}
            options={allTypes.map((t) => {
              return { value: t, label: removePrefix(t) };
            })}
            onChange={(value) => setType(value)}
          />
        </Space.Compact>
        {type && <Properties repository={repository} type={type} />}
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
  const [property, setProperty] = useState<URI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    setProperty(null);
    let active = true;
    getTypeProperties(repository, type, username)
      .then((res: URI[]) => {
        if (active) setAllProperties(res);
      })
      .catch(() => {
        if (active) {
          setAllProperties([]);
          message.error("Could not load class properties.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, type, username]);

  return (
    <Skeleton loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space.Compact direction="vertical" style={{ width: "100%" }}>
          <Typography.Text>Select property to view metadata</Typography.Text>
          <Select
            placeholder="Enter property name"
            value={property}
            options={allProperties.map((prop) => {
              return { value: prop, label: removePrefix(prop) };
            })}
            onChange={(value) => setProperty(value)}
          />
        </Space.Compact>
        {property && (
          <Skeleton active loading={loading}>
            <Divider>{property}</Divider>
            <MetaInfo repository={repository} uri={property} />
          </Skeleton>
        )}
      </Space>
    </Skeleton>
  );
};

export default ClassProperties;
