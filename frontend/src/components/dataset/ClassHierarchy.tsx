import { RDFGraph, Triplet, RepositoryId } from "../../types";
import { useEffect, useState } from "react";
import { getClassHierarchy } from "../../api/dataset";
import GraphVis from "../graph/GraphVis";
import { useStore } from "../../stores/store";
import { message } from "antd";

type ClassHierarchyProps = {
  repository: RepositoryId;
  width: number;
  height: number;
};

const ClassHierarchy = ({ repository, width, height }: ClassHierarchyProps) => {
  const username = useStore().authStore.username!;
  const [triplets, setTriplets] = useState<Triplet[]>([]);

  useEffect(() => {
    let active = true;
    getClassHierarchy(repository, username)
      .then((res: RDFGraph) => {
        if (active) setTriplets(res.data);
      })
      .catch(() => {
        if (active) {
          setTriplets([]);
          message.error("Could not load the class hierarchy.");
        }
      });
    return () => {
      active = false;
    };
  }, [repository, username]);

  return (
    <GraphVis
      links={triplets}
      width={width}
      height={height}
      repository={repository}
      hierarchical={true}
      interactive={false}
    />
  );
};

export default ClassHierarchy;
