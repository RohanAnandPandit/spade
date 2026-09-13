import { DatabaseOutlined } from "@ant-design/icons";
import { Button, Dropdown, Space, Tooltip } from "antd";
import { observer } from "mobx-react-lite";

import { useStore } from "../../stores/store";

type RepositorySelectorProps = {
  compact?: boolean;
};

const RepositorySelector = observer(
  ({ compact = false }: RepositorySelectorProps) => {
    const repositoryStore = useStore().repositoryStore;
    const repository = repositoryStore.currentRepository();
    const repositories = repositoryStore.repositories();
    const label = repository || "Choose repository";

    const button = (
      <Button
        aria-label={
          repository
            ? `Change repository for this browser tab. Currently ${repository}`
            : "Choose repository"
        }
        shape={compact ? "circle" : undefined}
        type={repository ? "default" : "primary"}
        style={compact ? undefined : { width: "100%" }}
      >
        {compact ? (
          <DatabaseOutlined />
        ) : (
          <Space className="repository-selector-label">
            <DatabaseOutlined />
            <span>{label}</span>
          </Space>
        )}
      </Button>
    );

    return (
      <div className="repository-selector">
        <Dropdown
          menu={{
            selectedKeys: repository ? [repository] : [],
            items: repositories.length
              ? repositories.map(({ name }) => ({
                  key: name,
                  label: name,
                  onClick: () => repositoryStore.setCurrentRepository(name),
                }))
              : [
                  {
                    key: "empty",
                    label: "Add a repository below first",
                    disabled: true,
                  },
                ],
          }}
          trigger={["click"]}
        >
          {compact ? <Tooltip title={label}>{button}</Tooltip> : button}
        </Dropdown>
      </div>
    );
  }
);

export default RepositorySelector;
