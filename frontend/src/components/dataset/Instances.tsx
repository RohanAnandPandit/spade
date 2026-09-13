import { useEffect, useState } from "react";
import { PropertyType, RepositoryId, URI } from "../../types";
import { getInstances, getAllTypes } from "../../api/dataset";
import {
  Collapse,
  Divider,
  Select,
  Space,
  Spin,
  Tooltip,
  Typography,
  message,
} from "antd";
import { removePrefix } from "../../utils/queryResults";
import { PropertyValues } from "./DataProperties";

const Instances = ({ repository }: { repository: RepositoryId }) => {
  const [allTypes, setAllTypes] = useState<URI[]>([]);
  const [type, setType] = useState<URI | null>(null);
  const [instances, setInstances] = useState<URI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    getAllTypes(repository)
      .then((res) => {
        if (active) setAllTypes(res);
      })
      .catch(() => {
        if (active) message.error("Could not load repository classes.");
      });
    return () => {
      active = false;
    };
  }, [repository]);

  return (
    <>
      <Space.Compact direction="vertical" style={{ width: "100%" }}>
        <Typography.Text style={{ fontSize: 15 }}>Select class</Typography.Text>
        <Select
          placeholder={"Enter class name"}
          value={type}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          onChange={async (value) => {
            setLoading(true);
            setType(value);
            try {
              const res = await getInstances(repository, value);
              setInstances(res);
            } catch {
              setInstances([]);
              message.error("Could not load class instances.");
            } finally {
              setLoading(false);
            }
          }}
          options={allTypes.map((t) => {
            return {
              label: removePrefix(t),
              value: t,
            };
          })}
        />
      </Space.Compact>
      {type && (
        <Spin spinning={loading}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Divider>{instances.length} results</Divider>
            <Collapse defaultActiveKey={["1"]} onChange={() => {}}>
              {instances.map((uri: URI, index) => (
                <Collapse.Panel
                  header={<Tooltip title={uri}>{removePrefix(uri)}</Tooltip>}
                  key={`type-${index}`}
                >
                  <PropertyValues
                    repository={repository}
                    uri={uri}
                    propType={PropertyType.DatatypeProperty}
                  />
                </Collapse.Panel>
              ))}
            </Collapse>
          </Space>
        </Spin>
      )}
    </>
  );
};

export default Instances;
