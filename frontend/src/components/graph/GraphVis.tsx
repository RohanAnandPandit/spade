import { useEffect, useMemo, useState } from "react";
import { PropertyType, RepositoryId, Triplet, URI } from "../../types";
import NetworkGraph, {
  Edge,
  graphData as GraphData,
  Node,
  Options,
} from "react-graph-vis";
import {
  displayText,
  isNumber,
  isURL,
  removePrefix,
} from "../../utils/queryResults";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import "./network.css";
import { getPropertyValues } from "../../api/dataset";
import randomColor from "randomcolor";
import getUuidByString from "uuid-by-string";
import { Button, Divider, Space, Typography } from "antd";

type GraphVisProps = {
  links: Triplet[];
  width: number;
  height: number;
  hierarchical?: boolean;
  repository?: RepositoryId;
  interactive?: boolean;
};

type GraphInfo = { key: string; title: string; data: GraphData };

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
    const [currentIdx, setCurrentIdx] = useState<number>(-1);
    const [history, setHistory] = useState<GraphInfo[]>([]);
    const {
      key,
      title,
      data: graph,
    } = useMemo(
      () =>
        history[currentIdx] ?? {
          key: "loading",
          title: "Loading",
          data: { nodes: [], edges: [] },
        },
      [history, currentIdx]
    );

    const addGraph = (graph: GraphInfo) => {
      setHistory((history) => {
        setCurrentIdx(history.length);
        return [...history, graph];
      });
    };

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
      addGraph({
        key: "Original",
        title: "Original",
        data: getNodesAndEdges({
          links,
          nodeOptions: {
            shape: "box",
            font: { size: 30 },
            color: randomColor({ luminosity: "light" }),
          },
          edgeOptions,
        }),
      });
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
      width: `100%`,
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
            addGraph({
              key: `Data properties of ${node.title!}`,
              title: `Data properties of ${node.label!}`,
              data: getNodesAndEdges({
                links: newLinks,
                initialGraph: { nodes: [node], edges: [] },
                nodeOptions: {
                  color: randomColor({ luminosity: "light" }),
                  shape: "ellipse",
                  font: { size: 25 },
                },
                edgeOptions,
              }),
            });
          });
          return;
        }
        // Double clicking on an edge filters down to all edges with the same title
        for (let edgeId of edges) {
          const edge = idToEdge[edgeId];
          const fromNode = idToNode[edge.from!];
          const newEdges = graph.edges.filter(
            (e: Edge) => e.title === edge.title && e.from === edge.from!
          );
          const newNodes: {[key: number]: Node} = {};

          for (let e of newEdges) {
            if (e.from) {
              newNodes[e.from] = idToNode[e.from];
            }
            if (e.to) {
              newNodes[e.to] = idToNode[e.to];
            }
          }
          const newGraph = {
            nodes: Object.values(newNodes),
            edges: newEdges,
          };
          addGraph({
            key: `Only ${removePrefix(edge.title!)} properties for ${
              fromNode.title
            }`,
            title: `Only ${removePrefix(edge.label!)} properties for ${
              fromNode.label
            }`,
            data: newGraph,
          });
          return;
        }
      },
      hold: function (event: any) {
        // Click and hold on a node shows all object properties of current node
        const { nodes, edges } = event;
        for (let nodeId of nodes) {
          const node = idToNode[nodeId];
          const uri = node.title!;
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
            addGraph({
              key: `Object properties of ${node.title}`,
              title: `Object properties of ${node.label}`,
              data: getNodesAndEdges({
                links: newLinks,
                nodeOptions: {
                  shape: "box",
                  color: randomColor({ luminosity: "light" }),
                  font: { size: 30 },
                },
                edgeOptions,
              }),
            });
          });
          return;
        }

        for (let edgeId of edges) {
          const edge = idToEdge[edgeId];
          const fromNode = idToNode[edge.from!];
          const toNode = idToNode[edge.to!];
          const newGraph = {
            nodes: graph.nodes.filter(
              ({ id }) => id === edge.from || id === edge.to
            ),
            edges: [edge],
          };
          addGraph({
            key: `Only relationships from ${fromNode.title} and ${toNode.title}`,
            title: `Only relationships from ${fromNode.label} and ${toNode.label}`,
            data: newGraph,
          });
          return;
        }
      },
    };

    return (
      <Space direction="vertical" style={{ width, height }}>
        {interactive && (
          <Space split={<Divider type="vertical" />}>
            <Button
              disabled={currentIdx <= 0}
              onClick={() => setCurrentIdx(currentIdx - 1)}
            >
              Prev
            </Button>
            <Typography.Text style={{ fontSize: 20 }}>{title}</Typography.Text>
            <Button
              disabled={currentIdx === history.length - 1}
              onClick={() => setCurrentIdx(currentIdx + 1)}
            >
              Next
            </Button>
          </Space>
        )}
        <NetworkGraph
          key={key}
          graph={graph}
          options={graphOptions}
          events={interactive ? events : {}}
          getNetwork={(network: any) => {
            //  if you want access to vis.js network api you can set the state in a parent component using this property
          }}
        />
      </Space>
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
  const literalNodes: Node[] = [];
  const objNodes: { [key: string]: Node } = {}; // Maps object URI to node
  for (let node of initialGraph.nodes) {
    objNodes[node.title!] = node;
  }
  // Ignore the id of the edges set by the graph as this causes issues for the new edges
  const edgeIds: { [key: string]: Edge } = {};
  for (let edge of initialGraph.edges) {
    edgeIds[edge.id!] = edge;
  }
  const edgeCounts: { [key: string]: number } = {};

  let availableId: number =
    Object.values(objNodes).length === 0
      ? 1
      : Math.max(...Object.values(objNodes).map(({ id }) => id as number)) + 1;

  for (let [sub, pred, obj] of links) {
    let nodeA: Node;
    let nodeB: Node;
    if (!isNumber(sub) && objNodes[sub]) {
      nodeA = objNodes[sub];
    } else {
      nodeA = {
        id: availableId++,
        label: displayText(sub),
        title: sub,
        ...nodeOptions,
      };
      if (isNumber(sub)) {
        literalNodes.push(nodeA);
      } else {
        objNodes[sub] = nodeA;
      }
    }

    if (objNodes[obj]) {
      nodeB = objNodes[obj];
    } else {
      nodeB = {
        id: availableId++,
        label: displayText(obj),
        title: obj,
        ...nodeOptions,
      };
      if (isNumber(obj)) {
        literalNodes.push(nodeB);
      } else {
        objNodes[obj] = nodeB;
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
    nodes: [...literalNodes, ...Object.values(objNodes)],
    edges: Object.values(edgeIds),
  };

  return graph;
}

export default GraphVis;
