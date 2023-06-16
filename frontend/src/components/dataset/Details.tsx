import { useState } from "react";
import { Input, Space, Typography } from "antd";
import { PropertyValues } from "./DataProperties";
import { PropertyType, URI } from "../../types";
import { isURL } from "../../utils/queryResults";

const Details = ({ repository }) => {
  const [uri, setUri] = useState<URI>("");
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space.Compact direction="vertical"  style={{ width: "100%" }}>
        <Typography.Text>
          Enter a URI to view its data properties
        </Typography.Text>
        <Input
          placeholder="Object URI"
          value={uri}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setUri(value);
          }}
          style={{ width: "100%" }}
        />
      </Space.Compact>
      {isURL(uri as string) && (
        <PropertyValues
          repository={repository}
          uri={uri}
          propType={PropertyType.DatatypeProperty}
        />
      )}
    </Space>
  );
};

export default Details;
