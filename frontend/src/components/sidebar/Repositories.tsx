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
} from "antd";
import { addLocalRepository, addRemoteRepository } from "../../api/sparql";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import { SlMagnifier } from "react-icons/sl";
import { RepositoryId, RepositoryInfo } from "../../types";
import { AiFillApi } from "react-icons/ai";
import { MdDelete } from "react-icons/md";

const Repositories = observer(() => {
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
  return (
    <div style={{ margin: 5 }}>
      <Button onClick={() => setOpen(true)} style={{ width: "100%" }}>
        <Space>
          <SlMagnifier />
          View repositories
        </Space>
      </Button>
      <Modal open={open} footer={null} onCancel={() => setOpen(false)}>
        <Tabs items={items} />
      </Modal>
    </div>
  );
});

const AddRepository = () => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;
  const authStore = rootStore.authStore;

  const [type, setType] = useState<string>("remote");
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  if (success) {
    return <Alert message="The repository was added successfully!" />;
  }

  const onFinish = (values: any) => {
    const { name, endpoint, description, dataUrl, schemaUrl } = values;
    setLoading(true);
    if (endpoint) {
      addRemoteRepository(
        name,
        endpoint,
        description,
        authStore.username!
      ).then((repositoryId: RepositoryId) => {
        setSuccess(true);
        setLoading(false);
        repositoryStore.updateRepositories();
        setTimeout(() => setSuccess(false), 1000);
      });
    } else {
      addLocalRepository(
        name,
        dataUrl,
        schemaUrl,
        description,
        authStore.username!
      ).then((repositoryId: RepositoryId) => {
        setSuccess(true);
        setLoading(false);
        repositoryStore.updateRepositories();
        setTimeout(() => setSuccess(false), 1000);
      });
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

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
          <Form.Item
            label="Data URL"
            name="dataUrl"
            rules={[{ required: true, message: "Please input a valid URL!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Schema URL"
            name="schemaUrl"
            rules={[{ required: true, message: "Please input a valid URL!" }]}
          >
            <Input />
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

  return (
    <Popconfirm
      title={"Delete repository"}
      description={`Are you sure?`}
      okText="Yes"
      cancelText="No"
      onConfirm={() => repositoryStore.deleteRepository(repository)}
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
