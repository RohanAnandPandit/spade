import React, { useState } from "react";
import { useStore } from "../../stores/store";
import { Button, Modal, Space, Tabs, TabsProps, Typography } from "antd";
import { AiOutlineFileSearch } from "react-icons/ai";
import { SPARQLTemplate } from "../../utils/sparqlTemplates";

type TemplatesProps = {
  templates: SPARQLTemplate[];
};

const Templates = ({ templates }: TemplatesProps) => {
  const rootStore = useStore();
  const queriesStore = rootStore.queriesStore;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const items: TabsProps["items"] = templates.map(({ title, query }) => {
    return {
      key: title,
      label: title,
      children: (
        <QueryTemplate
          query={query}
          onApply={() => {
            queriesStore.setCurrentQuery(query);
            setIsModalOpen(false);
          }}
        />
      ),
    };
  });
  return (
    <>
      <Button
        type="primary"
        onClick={() => setIsModalOpen(true)}
        style={{ width: "95%", margin: 5 }}
      >
        <Space>
          <AiOutlineFileSearch size={20} />
          Templates
        </Space>
      </Button>

      <Modal
        title={`SPARQL templates`}
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        maskClosable
        width={Math.floor(window.innerWidth * 0.75)}
      >
        <Tabs
          tabPosition="left"
          defaultActiveKey="1"
          items={items}
          style={{ padding: 10 }}
        />
      </Modal>
    </>
  );
};

type QueryTemplateProps = {
  query: string;
  onApply: () => void;
};

const QueryTemplate = ({ query, onApply }: QueryTemplateProps) => {
  return (
    <Space direction="vertical">
      <Typography.Text
        style={{ whiteSpace: "pre-wrap", fontFamily: "consolas" }}
      >
        {query}
      </Typography.Text>
      <Space>
        <Button onClick={() => onApply()}>Apply</Button>
      </Space>
    </Space>
  );
};

export default Templates;
