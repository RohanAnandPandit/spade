import React from "react";
import { ConfigProvider, Layout, theme, App as AntdApp } from "antd";
import Navbar from "./components/navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import { observer } from "mobx-react-lite";
import Settings from "./components/settings/Settings";
import { useStore } from "./stores/store";
import HomePage from "./pages/home/HomePage";
import ContactPage from "./pages/contact/ContactPage";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Login from "./pages/home/Login";

const { Header } = Layout;
const { darkAlgorithm, defaultAlgorithm } = theme;

const App = () => {
  const rootStore = useStore();
  const authStore = rootStore.authStore;
  const settings = rootStore.settingsStore;

  if (!authStore.username) {
    return (
      <>
        <Login />
      </>
    )
  }
  
  return (
    <ConfigProvider
      theme={{
        algorithm: settings.darkMode() ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <AntdApp>
        <Layout
          style={{
            minHeight: "100vh",
            backgroundColor: settings.darkMode() ? "black" : "white",
          }}
        >
          <Header className="header">
            <Navbar />
          </Header>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Routes>
          </Layout>
          <Settings />
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
};

export default observer(App);
