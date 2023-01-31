import React from "react";
// import type { MenuProps } from "antd";
import { Layout, theme } from "antd";
// import { Breadcrumb } from "antd";
import Navbar from "./components/navbar/Navbar";
import { routes } from "./components/navbar/routes";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Sidebar from "./components/sidebar/Sidebar";
const { Header, Content, Sider } = Layout;

// const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
//   key,
//   label: `nav ${key}`,
// }));



const router = createBrowserRouter(routes);

const App = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ height: "100vh" }}>
      <Header className="header">
        <Navbar />
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Sidebar />
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          {/* <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>List</Breadcrumb.Item>
            <Breadcrumb.Item>App</Breadcrumb.Item>
          </Breadcrumb> */}
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
            }}
          >
            <RouterProvider router={router} />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
