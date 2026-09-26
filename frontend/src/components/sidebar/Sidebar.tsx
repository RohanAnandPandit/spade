import { ReactNode, useEffect } from "react";
import { Typography } from "antd";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import ExploreDataset from "./ExploreDataset";
import Repositories from "./Repositories";
import RepositorySelector from "./RepositorySelector";
import "./Sidebar.css";

const Sidebar = observer(({ queryList }: { queryList?: ReactNode }) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const repositoryStore = rootStore.repositoryStore;
  const collapsed = settings.sidebarCollapsed();
  const repository = repositoryStore.currentRepository();

  useEffect(() => {
    void repositoryStore.updateRepositories();
  }, [repositoryStore]);

  return (
    <div
      className={`sidebar-content ${
        collapsed ? "sidebar-content-collapsed" : "sidebar-content-expanded"
      }`}
    >
      <div className="sidebar-repository-controls">
        {!collapsed && (
          <Typography.Text className="sidebar-section-label" type="secondary">
            Repository
          </Typography.Text>
        )}
        <RepositorySelector compact={collapsed} />
        <Repositories compact={collapsed} />
        {repository && (
          <ExploreDataset compact={collapsed} repository={repository} />
        )}
      </div>
      {queryList}
    </div>
  );
});

export default Sidebar;
