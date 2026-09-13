import { useEffect, useState } from "react";
import { Descriptions, message, Skeleton, Tag } from "antd";
import { Metadata, RepositoryId, URI } from "../../types";
import { getMetaInformation, getType } from "../../api/dataset";
import { removePrefix } from "../../utils/queryResults";

type MetaInfoProps = {
  repository: RepositoryId;
  uri: URI;
};
export const MetaInfo = ({ repository, uri }: MetaInfoProps) => {
  const [metadata, setMetadata] = useState<Metadata>({
    comment: "",
    label: "",
    range: "",
    domain: "",
  });
  const [types, setTypes] = useState<URI[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    Promise.all([getMetaInformation(repository, uri), getType(repository, uri)])
      .then(([nextMetadata, nextTypes]) => {
        if (active) {
          setMetadata(nextMetadata);
          setTypes(nextTypes);
        }
      })
      .catch(() => {
        if (active) message.error("Could not load resource metadata.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository, uri]);

  return (
    <Skeleton loading={loading}>
      <Descriptions size="small" layout="vertical" bordered>
        {types.length > 0 && (
          <Descriptions.Item key="type" label="Type">
            {types.map((t, index) => (
              <Tag key={`type-${index}`} title={t}>
                {removePrefix(t)}
              </Tag>
            ))}
          </Descriptions.Item>
        )}

        {Object.keys(metadata).map(
          (field: string) =>
            (metadata as any)[field].trim() && (
              <Descriptions.Item key={field} label={field}>
                {removePrefix((metadata as any)[field])}
              </Descriptions.Item>
            )
        )}
      </Descriptions>
    </Skeleton>
  );
};
