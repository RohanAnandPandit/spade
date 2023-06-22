import { useEffect, useMemo, useState } from "react";
import { PropertyType, RepositoryId, Triplet, URI } from "../../types";
import NetworkGraph, {
  Edge,
  graphData as GraphData,
  Node,
  Options,
} from "react-graph-vis";
import { isNumber, isURL, removePrefix } from "../../utils/queryResults";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import "./network.css";
import { getPropertyValues } from "../../api/dataset";
import randomColor from "randomcolor";
import getUuidByString from "uuid-by-string";

type GraphVisProps = {
  links: Triplet[];
  width: number;
  height: number;
  hierarchical?: boolean;
  repository?: RepositoryId;
  interactive?: boolean;
};

const GraphVis = observer(
  ({
    links,
    width,
    height,
    hierarchical,
    repository,
    interactive = true,
  }: GraphVisProps) => {
    const rootStore = useStore();
    const username = rootStore.authStore.username!;
    const settings = rootStore.settingsStore;
    // const [, setLoading] = useState<boolean>(true);

    const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });

    const edgeOptions = useMemo(() => {
      return {
        font: {
          strokeWidth: 1,
          size: 20,
          color: settings.darkMode() ? "white" : "black",
        },
      };
    }, [settings]);

    useEffect(() => {
      setGraph(
        getNodesAndEdges({
          links,
          nodeOptions: {
            shape: "box",
            font: { size: 30 },
            color: randomColor({ luminosity: "light" }),
          },
          edgeOptions,
        })
      );
    }, [links, edgeOptions]);

    const idToNode: { [key: number]: Node } = useMemo(() => {
      const dict: { [key: number]: Node } = {};
      for (let node of graph.nodes) {
        dict[node.id as number] = node;
      }

      return dict;
    }, [graph]);

    const idToEdge: { [key: string]: Edge } = useMemo(() => {
      const dict: { [key: number]: Edge } = {};
      for (let edge of graph.edges) {
        dict[edge.id as number] = edge;
      }

      return dict;
    }, [graph]);

    const graphOptions: Options = {
      layout: hierarchical
        ? {
            hierarchical: {
              enabled: hierarchical,
              sortMethod: "directed",
              direction: "DU",
            },
          }
        : {},

      edges: {
        color: settings.darkMode() ? "white" : "black",
        font: { size: 10 },
      },
      width: `${width}px`,
      height: `${height}px`,
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -150,
          springLength: 300,
          springConstant: 0.36,
          avoidOverlap: 0.3,
        },
        barnesHut: {
          springLength: 250,
          avoidOverlap: 0.2,
          gravitationalConstant: -2000,
        },
        maxVelocity: 50,
        solver: hierarchical ? "hierarchicalRepulsion" : "forceAtlas2Based", //"barnesHut", //forceAtlas2Based
        timestep: 0.05,
        adaptiveTimestep: true,
        stabilization: true,
        hierarchicalRepulsion: {
          avoidOverlap: 1,
          nodeDistance: 180,
        },
      },
    };

    const events = {
      // select: function (event: any) {
      //   var { nodes, edges } = event;
      // },
      // beforeDrawing: () => setLoading(true),
      // afterDrawing: () => setLoading(false),
      doubleClick: function (event: any) {
        const { nodes, edges } = event;
        // Double clicking on a node adds all its data properties
        for (let nodeId of nodes) {
          const node = idToNode[nodeId];

          const uri = node.title!;
          if (!isURL(uri)) continue; // Skip if node contains a literal value

          getPropertyValues(
            repository!,
            uri,
            PropertyType.DatatypeProperty,
            username
          ).then((res: [URI, string][]) => {
            const newLinks: Triplet[] = res.map(([prop, value]) => [
              uri,
              prop,
              value,
            ]);
            setGraph(
              getNodesAndEdges({
                links: newLinks,
                initialGraph: { nodes: [node], edges: []},
                nodeOptions: {
                  color: randomColor({ luminosity: "light" }),
                  shape: "ellipse",
                  font: { size: 25 },
                },
                edgeOptions,
              })
            );
          });
        }
        // Double clicking on an edge filters down to all edges with the same title
        for (let edgeId of edges) {
          const edge = idToEdge[edgeId];
          const newEdges = graph.edges.filter(
            (e: Edge) => e.title === edge.title
          );
          const newGraph = {
            nodes: newEdges
              .map((e: Edge) => [idToNode[e.from!], idToNode[e.to!]])
              .flat(1),
            edges: newEdges,
          };
          setGraph(newGraph);
        }
      },
      hold: function (event: any) {
        // Click and hold on a node shows all object properties of current node
        const { nodes, edges } = event;
        for (let nodeId of nodes) {
          const uri = idToNode[nodeId].title!;
          if (!isURL(uri)) continue; // Skip if node contains a literal value

          getPropertyValues(
            repository!,
            uri,
            PropertyType.ObjectProperty,
            username
          ).then((res: [URI, string][]) => {
            const newLinks: Triplet[] = res.map(([prop, value]) => [
              uri,
              prop,
              value,
            ]);
            // The initialGraph is not given so all other nodes, except for the current one, get removed
            setGraph(
              getNodesAndEdges({
                links: newLinks,
                nodeOptions: {
                  shape: "box",
                  color: randomColor({ luminosity: "light" }),
                  font: { size: 30 },
                },
                edgeOptions,
              })
            );
          });
        }

        for (let edgeId of edges) {
          const edge = idToEdge[edgeId];
          const newGraph = {
            nodes: graph.nodes.filter(
              ({ id }) => id === edge.from || id === edge.to
            ),
            edges: [edge],
          };
          setGraph(newGraph);
        }
      },
    };

    return (
      <NetworkGraph
        graph={graph}
        options={graphOptions}
        events={interactive ? events : {}}
        getNetwork={(network: any) => {
          //  if you want access to vis.js network api you can set the state in a parent component using this property
        }}
      />
    );
  }
);

function getNodesAndEdges({
  links,
  initialGraph = { nodes: [], edges: [] },
  nodeOptions = {},
  edgeOptions = {},
}: {
  links: Triplet[];
  initialGraph?: GraphData;
  nodeOptions?: any;
  edgeOptions?: any;
}) {
  const valueToNode: { [key: string]: Node } = {};
  for (let node of initialGraph.nodes) {
    valueToNode[node.title!] = node;
  }
  // Ignore the id of the edges set by the graph as this causes issues for the new edges
  const edgeIds: { [key: string]: Edge } = {};
  for (let edge of initialGraph.edges) {
    edgeIds[edge.id!] = edge;
  }
  const edgeCounts: { [key: string]: number } = {};

  let availableId: number =
    Object.values(valueToNode).length === 0
      ? 0
      : Math.max(...Object.values(valueToNode).map(({ id }) => id as number)) +
        1;

  for (let [sub, pred, obj] of links) {
    let nodeA: Node;
    let nodeB: Node;
    if (!isNumber(sub) && valueToNode[sub]) {
      nodeA = valueToNode[sub];
    } else {
      nodeA = {
        id: availableId++,
        label: removePrefix(sub),
        title: sub,
        ...nodeOptions,
      };
      if (!isNumber(sub)) {
        valueToNode[sub] = nodeA;
      }
    }

    if (!isNumber(obj) && valueToNode[obj]) {
      nodeB = valueToNode[obj];
    } else {
      nodeB = {
        id: availableId++,
        label: removePrefix(obj),
        title: obj,
        ...nodeOptions,
      };
      if (!isNumber(obj)) {
        valueToNode[obj] = nodeB;
      }
    }

    const from = nodeA.id as number;
    const to = nodeB.id as number;
    const edgeId = getUuidByString(`${from}-${pred}-${to}`);
    const pairId = `${Math.min(from, to)}-${Math.max(from, to)}`;
    const edge = {
      id: getUuidByString(`${from}-${pred}-${to}`),
      from,
      to,
      label: removePrefix(pred),
      title: pred,
      ...edgeOptions,
      smooth: {
        enabled: edgeCounts[pairId] > 0,
        type: "diagonalCross",
        roundness: 0.75,
      },
    };
    edgeIds[edgeId] = edge;
    edgeCounts[pairId] = edgeCounts[pairId] ?? 0 + 1;
  }
  const graph = {
    nodes: Object.values(valueToNode),
    edges: Object.values(edgeIds),
  };

  return graph;
}

export default GraphVis;
