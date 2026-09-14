import { useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Input,
  Modal,
  Space,
  Tabs,
  Form,
  Popconfirm,
  Segmented,
  Spin,
  Tooltip,
  App as AntdApp,
  Empty,
  Table,
} from "antd";
import { EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { addLocalRepository, addRemoteRepository } from "../../api/sparql";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import { RepositoryInfo } from "../../types";
import { MdDelete } from "react-icons/md";

type RepositoriesProps = {
  compact?: boolean;
};

const Repositories = observer(({ compact = false }: RepositoriesProps) => {
  const repositoryStore = useStore().repositoryStore;
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("all-repositories");
  const items = [
    {
      key: `all-repositories`,
      label: "Your repositories",
      children: <AllRepositories />,
    },
    {
      key: `add-repository`,
      label: "Add repository",
      children: <AddRepository />,
    },
  ];
  const button = (
    <Button
      aria-label="Add or manage repositories"
      onClick={() => {
        setActiveTab(
          repositoryStore.repositories().length
            ? "all-repositories"
            : "add-repository"
        );
        setOpen(true);
      }}
      shape={compact ? "circle" : undefined}
      style={compact ? undefined : { width: "100%" }}
    >
      {compact ? (
        <PlusOutlined />
      ) : (
        <Space>
          <PlusOutlined />
          Add or manage repositories
        </Space>
      )}
    </Button>
  );

  return (
    <div style={compact ? undefined : { margin: 5 }}>
      {compact ? (
        <Tooltip title="Add or manage repositories">{button}</Tooltip>
      ) : (
        button
      )}
      <Modal
        title="Repositories"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        width={820}
      >
        <Tabs activeKey={activeTab} items={items} onChange={setActiveTab} />
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
        label="Repository name"
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
            label: "Upload RDF files",
            value: "local",
          },
          {
            label: "Connect to an endpoint",
            value: "remote",
          },
        ]}
        value={type}
        onChange={(v) => setType(v as string)}
      />
      {type === "remote" && (
        <Form.Item
          label="SPARQL endpoint URL"
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
            Add repository
          </Button>
        </Spin>
      </Form.Item>
    </Form>
  );
};

const AllRepositories = observer(() => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const repositories = repositoryStore.repositories();
  const filteredRepositories = normalizedSearch
    ? repositories.filter(({ name, description, endpoint }) =>
        [name, description, endpoint]
          .filter(Boolean)
          .some((value) =>
            value!.toLocaleLowerCase().includes(normalizedSearch)
          )
      )
    : repositories;

  const columns: TableColumnsType<RepositoryInfo> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 170,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description: string) =>
        description || (
          <span className="repository-empty-value">No description</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      align: "right",
      render: (_, repository) => <RepositoryActions repository={repository} />,
    },
  ];

  return (
    <Space className="repository-list" direction="vertical">
      {repositories.length > 0 && (
        <Input.Search
          allowClear
          aria-label="Search repositories"
          placeholder="Search repositories"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      {repositories.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No repositories yet. Use the Add repository tab to connect one."
        />
      ) : (
        <Table<RepositoryInfo>
          columns={columns}
          dataSource={filteredRepositories}
          rowKey="name"
          size="small"
          pagination={false}
          locale={{ emptyText: "No repositories match your search." }}
          scroll={{ x: 620 }}
        />
      )}
    </Space>
  );
});

const RepositoryActions = observer(
  ({ repository }: { repository: RepositoryInfo }) => {
    const repositoryStore = useStore().repositoryStore;
    const [viewOpen, setViewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm<RepositoryInfo>();
    const { message } = AntdApp.useApp();
    const isRemote = Boolean(repository.endpoint);

    const openEditor = () => {
      form.setFieldsValue(repository);
      setEditOpen(true);
    };

    const saveRepository = async (values: RepositoryInfo) => {
      setSaving(true);
      try {
        await repositoryStore.updateRepository(repository.name, {
          ...values,
          endpoint: isRemote ? values.endpoint : undefined,
        });
        setEditOpen(false);
        message.success("Repository updated.");
      } catch {
        message.error("Could not update the repository.");
      } finally {
        setSaving(false);
      }
    };

    return (
      <>
        <Space size={4}>
          <Button
            aria-label={`View ${repository.name}`}
            icon={<EyeOutlined />}
            size="small"
            type="text"
            onClick={() => setViewOpen(true)}
          >
            View
          </Button>
          <Button
            aria-label={`Edit ${repository.name}`}
            icon={<EditOutlined />}
            size="small"
            type="text"
            onClick={openEditor}
          >
            Edit
          </Button>
          <DeleteRepository repository={repository.name} />
        </Space>

        <Modal
          title={repository.name}
          open={viewOpen}
          footer={null}
          onCancel={() => setViewOpen(false)}
        >
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Description">
              <span className="repository-description">
                {repository.description || "No description"}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Connection">
              {repository.endpoint ? (
                <a href={repository.endpoint} target="_blank" rel="noreferrer">
                  {repository.endpoint}
                </a>
              ) : (
                "Uploaded RDF data"
              )}
            </Descriptions.Item>
          </Descriptions>
        </Modal>

        <Modal
          title={`Edit ${repository.name}`}
          open={editOpen}
          okText="Save changes"
          confirmLoading={saving}
          onOk={() => form.submit()}
          onCancel={() => setEditOpen(false)}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => void saveRepository(values)}
          >
            <Form.Item
              label="Repository name"
              name="name"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item label="Description" name="description">
              <Input.TextArea maxLength={5000} autoSize={{ minRows: 3 }} />
            </Form.Item>
            {isRemote && (
              <Form.Item
                label="SPARQL endpoint URL"
                name="endpoint"
                rules={[
                  { required: true },
                  { type: "url", message: "Enter a valid endpoint URL." },
                ]}
              >
                <Input maxLength={2048} />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </>
    );
  }
);

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
        aria-label={`Delete ${repository}`}
        danger
        name="Delete"
        type="text"
        size="small"
      >
        <MdDelete size={18} />
      </Button>
    </Popconfirm>
  );
});
export default Repositories;
