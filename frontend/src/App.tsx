import React, { useEffect } from "react";
import type { CSSProperties } from "react";
import { ConfigProvider, Layout, theme, App as AntdApp } from "antd";
import Navbar from "./components/navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "./stores/store";
import HomePage from "./pages/home/HomePage";
import AuthPage from "./pages/auth/AuthPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/landing/LandingPage";
import AboutPage from "./pages/about/AboutPage";
import TrialPage from "./pages/trial/TrialPage";
import "./App.css";

const { Header } = Layout;
const { darkAlgorithm, defaultAlgorithm } = theme;

const ThemedHeader = () => {
  const { token } = theme.useToken();
  const headerStyle = {
    background: token.colorBgContainer,
    color: token.colorText,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    "--navbar-muted": token.colorTextSecondary,
    "--navbar-hover": token.colorPrimary,
    "--navbar-hover-bg": token.colorFillTertiary,
  } as CSSProperties;

  return (
    <Header className="header" style={headerStyle}>
      <Navbar />
    </Header>
  );
};

const App = () => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;

  useEffect(() => {
    void rootStore.authStore.initialize();
  }, [rootStore]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    settings.setSystemDarkMode(media.matches);
    const onChange = (event: MediaQueryListEvent) => {
      settings.setSystemDarkMode(event.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings]);

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
          <ThemedHeader />
          <Layout className="app-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/try" element={<TrialPage />} />
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
