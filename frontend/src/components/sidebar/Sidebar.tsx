import { useEffect } from "react";
import { Button, Divider, Dropdown, Popover, Space } from "antd";
import { useStore } from "../../stores/store";
import { RepositoryInfo } from "../../types";
import { observer } from "mobx-react-lite";
import { RiGitRepositoryLine } from "react-icons/ri";
import QueryHistory from "./QueryHistory";
import ExploreDataset from "./ExploreDataset";
import Repositories from "./Repositories";

const Sidebar = observer(() => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const repositoryStore = rootStore.repositoryStore;

  return (
    <>
      {!settings.sidebarCollapsed() && (
        <div style={{ justifyContent: "center" }}>
          <SelectRepository />
          <ExploreDataset repository={repositoryStore.currentRepository()} />
          <Repositories />
          <Divider />
          <QueryHistory />
        </div>
      )}
    </>
  );
});

const SelectRepository = observer(() => {
  const rootStore = useStore();
  const repositoryStore = rootStore.repositoryStore;

  useEffect(() => {
    void repositoryStore.updateRepositories();
  }, [repositoryStore]);

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
    >
      <Button style={{ width: "95%", margin: 5 }} name="Choose repository">
        <Space>
          <RiGitRepositoryLine size={20} />
          <b>{repositoryStore.currentRepository() || "Select repository"}</b>
        </Space>
      </Button>
    </Dropdown>
  );
});

export default Sidebar;
