import { Layout, theme } from "antd";
import QueryBrowser from "./QueryBrowser";
import Sidebar from "../../components/sidebar/Sidebar";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";

const { Content, Sider } = Layout;

const HomePage = observer(() => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout className="workspace-shell">
      <Sider
        className="workspace-sidebar"
        collapsible
        collapsed={settings.sidebarCollapsed()}
        onCollapse={(value: boolean) => settings.setSidebarCollapsed(value)}
        breakpoint="lg"
        collapsedWidth={64}
        width={settings.sidebarWidth()}
        style={{ background: colorBgContainer }}
      >
        <Sidebar />
      </Sider>
      <Layout className="workspace-main">
        <Content
          className="workspace-content"
          style={{
            background: colorBgContainer,
          }}
        >
          <QueryBrowser />
        </Content>
      </Layout>
    </Layout>
  );
});

export default HomePage;
