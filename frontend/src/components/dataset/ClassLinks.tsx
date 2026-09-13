import { ResponsiveChord } from "@nivo/chord";
import { Alert, Divider, message } from "antd";
import { useEffect, useState } from "react";

import {
  getAllTypes,
  getIncomingLinks,
  getOutgoingLinks,
} from "../../api/dataset";
import { RepositoryId, URI } from "../../types";
import { removePrefix } from "../../utils/queryResults";

type ClassLinksProps = {
  repository: RepositoryId;
  width: number;
};

type LinkMatrix = {
  labels: URI[];
  incoming: number[][];
  outgoing: number[][];
};

const EMPTY_LINKS: LinkMatrix = { labels: [], incoming: [], outgoing: [] };

const ClassLinks = ({ repository, width }: ClassLinksProps) => {
  const [links, setLinks] = useState<LinkMatrix>(EMPTY_LINKS);

  useEffect(() => {
    let active = true;

    const loadLinks = async () => {
      try {
        const labels = await getAllTypes(repository);
        const [outgoingMaps, incomingMaps] = await Promise.all([
          Promise.all(
            labels.map((source) => getOutgoingLinks(repository, source))
          ),
          Promise.all(
            labels.map((source) => getIncomingLinks(repository, source))
          ),
        ]);
        if (!active) return;
        setLinks({
          labels,
          outgoing: outgoingMaps.map((values) =>
            labels.map((target) => Number(values[target] ?? 0))
          ),
          incoming: incomingMaps.map((values) =>
            labels.map((target) => Number(values[target] ?? 0))
          ),
        });
      } catch {
        if (active) {
          setLinks(EMPTY_LINKS);
          message.error("Could not load class relationships.");
        }
      }
    };

    void loadLinks();
    return () => {
      active = false;
    };
  }, [repository]);

  const height = Math.max(420, Math.min(window.innerHeight - 160, width));
  const labels = links.labels.map(removePrefix);

  return (
    <div style={{ width, maxWidth: "100%" }}>
      <Alert message="Hover over a class to inspect its relationships" />
      <Divider>Outgoing</Divider>
      <DatasetChord data={links.outgoing} keys={labels} height={height} />
      <Divider>Incoming</Divider>
      <DatasetChord data={links.incoming} keys={labels} height={height} />
    </div>
  );
};

const DatasetChord = ({
  data,
  keys,
  height,
}: {
  data: number[][];
  keys: string[];
  height: number;
}) => (
  <div style={{ height }}>
    {data.length > 0 ? (
      <ResponsiveChord
        data={data}
        keys={keys}
        margin={{ top: 50, right: 80, bottom: 50, left: 80 }}
        padAngle={0.02}
        innerRadiusRatio={0.96}
        inactiveArcOpacity={0.25}
        inactiveRibbonOpacity={0.2}
        labelRotation={-90}
        colors={{ scheme: "nivo" }}
      />
    ) : (
      <Alert type="info" message="No class relationships were found." />
    )}
  </div>
);

export default ClassLinks;
