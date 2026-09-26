import { useState } from "react";
import {
  Button,
  Modal,
  Space,
  Tabs,
  TabsProps,
  Tooltip,
  Typography,
} from "antd";
import { AiOutlineFileSearch } from "react-icons/ai";
import { SPARQLTemplate } from "../../utils/sparqlTemplates";

type TemplatesProps = {
  templates: SPARQLTemplate[];
  onApply: (query: string) => void;
};

const Templates = ({ templates, onApply }: TemplatesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const items: TabsProps["items"] = templates.map(({ title, query }) => {
    return {
      key: title,
      label: title,
      children: (
        <QueryTemplate
          query={query}
          onApply={() => {
            onApply(query);
            setIsModalOpen(false);
          }}
        />
      ),
    };
  });
  return (
    <>
      <Tooltip title="Query templates">
        <Button
          type="text"
          aria-label="Query templates"
          icon={<AiOutlineFileSearch size={20} />}
          onClick={() => setIsModalOpen(true)}
        />
      </Tooltip>

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
          defaultActiveKey={templates[0]?.title}
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
