import { Button, Divider, Space, Tag, Tooltip, Typography } from "antd";
import {
  DatabaseOutlined,
  LockOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

type TrialSidebarProps = {
  compact?: boolean;
};

const TrialSidebar = ({ compact = false }: TrialSidebarProps) =>
  compact ? (
    <div className="trial-sidebar trial-sidebar-compact">
      <Tooltip title="Free sample workspace">
        <Tag color="blue">Try</Tag>
      </Tooltip>
      <Tooltip title="Sample repository: Mondial">
        <Button
          aria-label="Mondial"
          icon={<DatabaseOutlined aria-hidden />}
          shape="circle"
          type="primary"
        />
      </Tooltip>
      <Divider />
      <Tooltip title="The sample dataset is read-only">
        <LockOutlined aria-label="Read-only sample dataset" />
      </Tooltip>
      <Link
        to="/register"
        className="trial-sidebar-cta"
        aria-label="Create an account"
      >
        <Tooltip title="Create an account">
          <Button
            aria-label="Create an account"
            icon={<UserAddOutlined aria-hidden />}
            shape="circle"
          />
        </Tooltip>
      </Link>
    </div>
  ) : (
    <div className="trial-sidebar">
      <Space size="small" wrap>
        <Tag color="blue">Free trial</Tag>
        <Typography.Text type="secondary">No account required</Typography.Text>
      </Space>

      <Typography.Text className="sidebar-section-label" type="secondary">
        Sample repository
      </Typography.Text>
      <Button
        aria-label="Mondial"
        className="trial-repository-button"
        type="primary"
        block
      >
        <DatabaseOutlined aria-hidden />
        Mondial
      </Button>
      <Typography.Paragraph type="secondary">
        Countries, cities, borders, rivers, mountains, and other geographical
        relationships.
      </Typography.Paragraph>

      <Divider />
      <Space align="start">
        <LockOutlined />
        <Typography.Text type="secondary">
          The sample dataset is read-only. You can edit queries freely.
        </Typography.Text>
      </Space>

      <Link
        to="/register"
        className="trial-sidebar-cta"
        aria-label="Create an account"
      >
        <Button icon={<UserAddOutlined aria-hidden />} block>
          Create an account
        </Button>
      </Link>
    </div>
  );

export default TrialSidebar;
