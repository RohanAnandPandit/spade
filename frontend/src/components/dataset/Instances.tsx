import { useEffect, useState } from "react";
import { PropertyType, URI } from "../../types";
import { getInstances, getAllTypes } from "../../api/dataset";
import {
  Collapse,
  Divider,
  Select,
  Skeleton,
  Space,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import { removePrefix } from "../../utils/queryResults";
import { PropertyValues } from "./DataProperties";
import { useStore } from "../../stores/store";

const Instances = ({ repository }) => {
  const username = useStore().authStore.username!;

  const [allTypes, setAllTypes] = useState<URI[]>([]);
  const [type, setType] = useState<URI | null>(null);
  const [instances, setInstances] = useState<URI[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    getAllTypes(repository, username).then((res) => {
      setAllTypes(res);
    });
  }, [repository, username]);

  return (
    <>
      <Space.Compact direction="vertical" style={{ width: "100%" }}>
        <Typography.Text style={{ fontSize: 15 }}>Select class</Typography.Text>
        <Select
          placeholder={"Enter class name"}
          // style={{ width: 200 }}
          value={type}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          onChange={(value) => {
            setLoading(true);
            setType(value);
            getInstances(repository, value, username).then((res) => {
              setInstances(res);
              setLoading(false);
            });
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
