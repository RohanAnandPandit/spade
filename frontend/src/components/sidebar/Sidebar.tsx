import { useEffect } from "react";
import { Button, Divider, Dropdown, Popover, Space, Tooltip } from "antd";
import { useStore } from "../../stores/store";
import { RepositoryInfo } from "../../types";
import { observer } from "mobx-react-lite";
import { RiGitRepositoryLine } from "react-icons/ri";
import QueryHistory from "./QueryHistory";
import ExploreDataset from "./ExploreDataset";
import Repositories from "./Repositories";
import "./Sidebar.css";

const Sidebar = observer(() => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const repositoryStore = rootStore.repositoryStore;
  const collapsed = settings.sidebarCollapsed();

  return (
    <div
      className={`sidebar-content ${
        collapsed ? "sidebar-content-collapsed" : "sidebar-content-expanded"
      }`}
    >
      <SelectRepository compact={collapsed} />
      <ExploreDataset
        compact={collapsed}
        repository={repositoryStore.currentRepository()}
      />
      <Repositories compact={collapsed} />
      {!collapsed && <Divider />}
      <QueryHistory compact={collapsed} />
    </div>
  );
});

type SelectRepositoryProps = {
  compact?: boolean;
};

const SelectRepository = observer(
  ({ compact = false }: SelectRepositoryProps) => {
    const rootStore = useStore();
    const repositoryStore = rootStore.repositoryStore;

    useEffect(() => {
      void repositoryStore.updateRepositories();
    }, [repositoryStore]);

    const label = repositoryStore.currentRepository() || "Select repository";
    const button = (
      <Button
        aria-label={compact ? label : undefined}
        name="Choose repository"
        shape={compact ? "circle" : undefined}
        style={compact ? undefined : { width: "95%", margin: 5 }}
      >
        {compact ? (
          <RiGitRepositoryLine size={20} />
        ) : (
          <Space>
            <RiGitRepositoryLine size={20} />
            <b>{label}</b>
          </Space>
        )}
      </Button>
    );

    return (
      <Dropdown
        menu={{
          items: repositoryStore
            .repositories()
            .map(({ name }: RepositoryInfo, index: number) => {
              return {
                key: `${index}`,
                label: (
                  <Popover
                    placement="right"
                    title={name ? "Description" : "No description available"}
                    content={name}
                    trigger="hover"
                  >
                    <Button
                      onClick={() => repositoryStore.setCurrentRepository(name)}
                      style={{ width: "100%", height: "100%" }}
                    >
                      {name}
                    </Button>
                  </Popover>
                ),
              };
            }),
        }}
        placement="bottomLeft"
        trigger={["click"]}
      >
        {compact ? <Tooltip title={label}>{button}</Tooltip> : button}
      </Dropdown>
    );
  }
);

export default Sidebar;
