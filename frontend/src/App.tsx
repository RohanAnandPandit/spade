import React, { useEffect } from "react";
import { ConfigProvider, Layout, theme, App as AntdApp } from "antd";
import Navbar from "./components/navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "./stores/store";
import HomePage from "./pages/home/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/landing/LandingPage";
import "./App.css";

const { Header } = Layout;
const { darkAlgorithm, defaultAlgorithm } = theme;

const App = () => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;

  useEffect(() => {
    void rootStore.authStore.initialize();
  }, [rootStore]);

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
          <Layout className="app-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/workspace" element={<HomePage />} />
              </Route>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
            </Routes>
          </Layout>
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
};

export default observer(App);
