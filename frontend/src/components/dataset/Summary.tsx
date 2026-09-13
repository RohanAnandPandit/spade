import { useEffect, useState } from "react";
import { Divider, message, Space, Statistic } from "antd";
import { RepositoryId, URI } from "../../types";
import { getClasses, getNoOfTriplets } from "../../api/dataset";

type SummaryProps = {
  repository: RepositoryId;
};

export const Summary = ({ repository }: SummaryProps) => {
  return (
    <Space>
      <Triplets repository={repository} />
      <Divider type="vertical" style={{ height: 50 }} />
      <Classes repository={repository} />
    </Space>
  );
};

type TripletsProps = {
  repository: RepositoryId;
};

const Triplets = ({ repository }: TripletsProps) => {
  const [triplets, setTriplets] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getNoOfTriplets(repository)
      .then((res) => {
        if (active) setTriplets(res);
      })
      .catch(() => {
        if (active) message.error("Could not load the triplet count.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository]);

  return <Statistic title="Triplets" value={triplets} loading={loading} />;
};

type ClassesProps = {
  repository: RepositoryId;
};

const Classes = ({ repository }: ClassesProps) => {
  const [classes, setClasses] = useState<URI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getClasses(repository)
      .then((res) => {
        if (active) setClasses(res);
      })
      .catch(() => {
        if (active) message.error("Could not load the class count.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository]);

  return <Statistic title="Classes" value={classes.length} loading={loading} />;
};
