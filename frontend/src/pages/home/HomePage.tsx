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
    <Layout>
      <Sider
        collapsible
        collapsed={settings.sidebarCollapsed()}
        onCollapse={(value: boolean) => settings.setSidebarCollapsed(value)}
        width={settings.sidebarWidth()}
        style={{ background: colorBgContainer }}
      >
        <Sidebar />
      </Sider>
      <Layout style={{ padding: "0 10px " }}>
        <Content
          style={{
            padding: 20,
            margin: 0,
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
