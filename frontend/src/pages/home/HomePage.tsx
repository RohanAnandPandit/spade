import { Button, Layout, theme, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import QueryBrowser, { QueryList, useQueryBrowser } from "./QueryBrowser";
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
  const queryBrowser = useQueryBrowser(demo);

  const {
    token: { colorBgContainer, colorBorderSecondary, colorTextSecondary },
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
        {demo ? (
          <TrialSidebar
            compact={collapsed}
            queryList={<QueryList model={queryBrowser} compact={collapsed} />}
          />
        ) : (
          <Sidebar
            queryList={<QueryList model={queryBrowser} compact={collapsed} />}
          />
        )}
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
            <div
              className="trial-workspace-banner"
              style={{ borderColor: colorBorderSecondary }}
            >
              <InfoCircleOutlined
                aria-hidden
                style={{ color: colorTextSecondary }}
              />
              <div className="trial-workspace-banner-copy">
                <strong>Sample workspace</strong>
                <span>
                  Mondial is read-only. Results are limited to 250 rows.
                </span>
              </div>
              <Link to="/register" className="trial-workspace-banner-action">
                Create an account to save work
              </Link>
            </div>
          )}
          <QueryBrowser model={queryBrowser} />
        </Content>
      </Layout>
    </Layout>
  );
});

export default HomePage;
