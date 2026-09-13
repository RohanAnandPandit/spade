import { useEffect } from "react";
import { Divider, Typography } from "antd";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import QueryHistory from "./QueryHistory";
import ExploreDataset from "./ExploreDataset";
import Repositories from "./Repositories";
import RepositorySelector from "./RepositorySelector";
import "./Sidebar.css";

const Sidebar = observer(() => {
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
      <RepositorySelector compact={collapsed} />
      <Repositories compact={collapsed} />
      {repository && (
        <>
          {!collapsed && (
            <>
              <Divider />
              <Typography.Text
                className="sidebar-section-label"
                type="secondary"
              >
                {repository}
              </Typography.Text>
            </>
          )}
          <ExploreDataset compact={collapsed} repository={repository} />
          <QueryHistory compact={collapsed} />
        </>
      )}
    </div>
  );
});

export default Sidebar;
