import { Alert, Button, Layout, theme, Tooltip } from "antd";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import QueryBrowser from "./QueryBrowser";
import Sidebar from "../../components/sidebar/Sidebar";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";
import TrialSidebar from "../trial/TrialSidebar";
import { Link } from "react-router-dom";

const { Content, Sider } = Layout;

type HomePageProps = {
  demo?: boolean;
};

const HomePage = observer(({ demo = false }: HomePageProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const collapsed = settings.sidebarCollapsed();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout className="workspace-shell">
      <Sider
        className="workspace-sidebar"
        collapsible
        collapsed={collapsed}
        onCollapse={(value: boolean) => settings.setSidebarCollapsed(value)}
        breakpoint="lg"
        collapsedWidth={64}
        width={settings.sidebarWidth()}
        trigger={null}
        style={{ background: colorBgContainer }}
      >
        {demo ? <TrialSidebar compact={collapsed} /> : <Sidebar />}
        <div className="sidebar-collapse-control">
          <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <Button
              className="sidebar-collapse-button"
              type="text"
              shape="circle"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              icon={collapsed ? <LuPanelLeftOpen /> : <LuPanelLeftClose />}
              onClick={() => settings.setSidebarCollapsed(!collapsed)}
            />
          </Tooltip>
        </div>
      </Sider>
      <Layout className="workspace-main">
        <Content
          className="workspace-content"
          style={{
            background: colorBgContainer,
          }}
        >
          {demo && (
            <Alert
              className="trial-workspace-banner"
              type="info"
              showIcon
              message="Sample workspace"
              description="Explore the Mondial world dataset with the same query tabs, results, and charts as the full workspace. The shared dataset is read-only and results are limited to 250 rows."
              action={
                <Link to="/register">
                  <Button size="small">Create an account to save work</Button>
                </Link>
              }
            />
          )}
          <QueryBrowser demo={demo} />
        </Content>
      </Layout>
    </Layout>
  );
});

export default HomePage;
