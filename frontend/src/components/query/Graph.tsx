import { observer } from "mobx-react-lite";
import { RepositoryId, Triplet } from "../../types";
import GraphVis from "../graph/GraphVis";
import Fullscreen from "./Fullscreen";
import { useStore } from "../../stores/store";
import { FloatButton, Modal, Tag, Tooltip } from "antd";
import { BsQuestion } from "react-icons/bs";
import { useState } from "react";
import Tree, { DataNode } from "antd/es/tree";
import { DownOutlined } from "@ant-design/icons";

type GraphProps = {
  links: Triplet[];
  repository: RepositoryId;
};

const Graph = observer(({ links, repository }: GraphProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;

  const width = Math.floor(
    (window.screen.width - (settings.fullScreen() ? 0 : settings.sidebarWidth())) *
      (settings.fullScreen() ? 0.98 : 0.85)
  );
  const height = Math.floor(
    window.screen.height * (settings.fullScreen() ? 0.95 : 0.6)
  );
  return (
    <Fullscreen>
      <GraphVis
        links={links}
        width={width}
        height={height}
        repository={repository}
      />
      <GraphHelp />
    </Fullscreen>
  );
});

const GraphHelp = () => {
  const [showModal, setShowModal] = useState<boolean>(false);

  const treeData: DataNode[] = [
    {
      title: "Nodes",
      key: "0-0",
      children: [
        {
          title: (
            <>
              <Tag>Hover</Tag>
              view full URI for or data of node
            </>
          ),
          key: "0-1",
        },
        {
          title: (
            <>
              <Tag>Click</Tag>
              highlight node and connected edges
            </>
          ),
          key: "0-2",
        },
        {
          title: (
            <>
              <Tag>Double click</Tag>
              add data properties of node to graph
            </>
          ),
          key: "0-3",
        },
        {
          title: (
            <>
              <Tag>Hold</Tag>
              only show object properties of current node
            </>
          ),
          key: "0-4",
        },
      ],
    },
    {
      title: "Edges",
      key: "1-0",
      children: [
        {
          title: (
            <>
              <Tag>Hover</Tag>view full URI of property or relation
            </>
          ),
          key: "1-1",
        },
        {
          title: (
            <>
              <Tag>Click</Tag>highlight edge and connected nodes
            </>
          ),
          key: "1-2",
        },
        {
          title: (
            <>
              <Tag>Double click</Tag> only display edges with the same name
            </>
          ),
          key: "1-3",
        },
        {
          title: (
            <>
              <Tag>Hold</Tag> remove all other edges
            </>
          ),
          key: "1-4",
        },
      ],
    },
  ];
  return (
    <>
      <FloatButton
        icon={
          <Tooltip placement="topLeft" title={"Graph Help"}>
            <BsQuestion
              size={30}
              style={{ paddingRight: 10, paddingBottom: 2 }}
            />
          </Tooltip>
        }
        style={{ bottom: 10, right: 15 }}
        onClick={() => setShowModal(true)}
      />
      <Modal
        title={`Graph interaction guide`}
        open={showModal}
        footer={null}
        onCancel={() => setShowModal(false)}
        maskClosable
      >
        <Tree
          showLine
          switcherIcon={<DownOutlined />}
          defaultExpandedKeys={["0-0"]}
          treeData={treeData}
        />
      </Modal>
    </>
  );
};
export default Graph;
