import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Space,
  Tabs,
  Typography,
  Form,
  Popconfirm,
  Segmented,
  Spin,
  Tooltip,
  App as AntdApp,
} from "antd";
import { addLocalRepository, addRemoteRepository } from "../../api/sparql";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import { SlMagnifier } from "react-icons/sl";
import { RepositoryInfo } from "../../types";
import { AiFillApi } from "react-icons/ai";
import { MdDelete } from "react-icons/md";

type RepositoriesProps = {
  compact?: boolean;
};

const Repositories = observer(({ compact = false }: RepositoriesProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const items = [
    {
      key: `all-repositories`,
      label: "All Repositories",
      children: <AllRepositories />,
    },
    {
      key: `add-repository`,
      label: "Add Repository",
      children: <AddRepository />,
    },
  ];
  const button = (
    <Button
      aria-label={compact ? "View repositories" : undefined}
      onClick={() => setOpen(true)}
      shape={compact ? "circle" : undefined}
      style={compact ? undefined : { width: "100%" }}
    >
      {compact ? (
        <SlMagnifier size={18} />
      ) : (
        <Space>
          <SlMagnifier />
          View repositories
        </Space>
      )}
    </Button>
  );

  return (
    <div style={compact ? undefined : { margin: 5 }}>
      {compact ? <Tooltip title="View repositories">{button}</Tooltip> : button}
      <Modal open={open} footer={null} onCancel={() => setOpen(false)}>
        <Tabs items={items} />
      </Modal>
    </div>
  );
});

const AddRepository = () => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;

  const [type, setType] = useState<string>("remote");
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataFile, setDataFile] = useState<File>();
  const [schemaFile, setSchemaFile] = useState<File>();
  const { message } = AntdApp.useApp();

  if (success) {
    return <Alert message="The repository was added successfully!" />;
  }

  const onFinish = async (values: {
    name: string;
    endpoint?: string;
    description: string;
  }) => {
    const { name, endpoint, description } = values;
    setLoading(true);
    try {
      if (endpoint) {
        await addRemoteRepository(name, endpoint, description);
      } else {
        if (!dataFile) {
          message.warning("Choose an RDF data file.");
          return;
        }
        await addLocalRepository(name, dataFile, schemaFile, description);
      }
      await repositoryStore.updateRepositories();
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 1000);
    } catch {
      message.error("Could not add the repository.");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = () => message.warning("Check the highlighted fields.");

  return (
    <Form
      name="basic"
      layout="vertical"
      // labelCol={{ span: 8 }}
      // wrapperCol={{ span: 16 }}
      // style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Please input a unique name!" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: "Please input a unique name!" }]}
      >
        <Input.TextArea />
      </Form.Item>
      <Segmented
        options={[
          {
            label: "Import data",
            value: "local",
          },
          {
            label: "With endpoint",
            value: "remote",
          },
        ]}
        value={type}
        onChange={(v) => setType(v as string)}
      />
      {type === "remote" && (
        <Form.Item
          label="SPARQL endpoint"
          name="endpoint"
          rules={[{ required: true, message: "Please input a valid URL!" }]}
        >
          <Input />
        </Form.Item>
      )}
      {type === "local" && (
        <>
          <Form.Item label="RDF data file" required>
            <input
              type="file"
              accept=".rdf,.xml,.nt,.nt11,.n3,.ttl,.txt"
              onChange={(event) => setDataFile(event.currentTarget.files?.[0])}
            />
          </Form.Item>
          <Form.Item label="Schema file (optional)">
            <input
              type="file"
              accept=".rdf,.xml,.nt,.nt11,.n3,.ttl,.txt"
              onChange={(event) =>
                setSchemaFile(event.currentTarget.files?.[0])
              }
            />
          </Form.Item>
        </>
      )}
      <Form.Item>
        <Spin spinning={loading}>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Spin>
      </Form.Item>
    </Form>
  );
};

const AllRepositories = observer(() => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {repositoryStore
        .repositories()
        .map(
          ({ name, description, endpoint }: RepositoryInfo, index: number) => (
            <Card
              style={{ width: "100%" }}
              title={
                <Space>
                  {name}
                  <DeleteRepository repository={name} />
                </Space>
              }
              key={`repository-${index}`}
              type="inner"
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Typography.Text>{description}</Typography.Text>
                {endpoint && (
                  <Space>
                    <AiFillApi size={20} />
                    <Typography.Text>{endpoint}</Typography.Text>
                  </Space>
                )}
              </Space>
            </Card>
          )
        )}
    </Space>
  );
});

type DeleteRepositoryProps = {
  repository: string;
};
const DeleteRepository = observer(({ repository }: DeleteRepositoryProps) => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;
  const { message } = AntdApp.useApp();

  const removeRepository = async () => {
    try {
      await repositoryStore.deleteRepository(repository);
      message.success("Repository deleted.");
    } catch {
      message.error("Could not delete the repository.");
    }
  };

  return (
    <Popconfirm
      title={"Delete repository"}
      description={`Are you sure?`}
      okText="Yes"
      cancelText="No"
      onConfirm={() => void removeRepository()}
      style={{ justifyContent: "center" }}
      placement="top"
    >
      <Button
        danger
        name="Delete"
        style={{ border: "none", background: "none" }}
      >
        <MdDelete size={20} />
      </Button>
    </Popconfirm>
  );
});
export default Repositories;
