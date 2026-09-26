import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { TbSpade } from "react-icons/tb";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import {
  BgColorsOutlined,
  CheckOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "./Navbar.css";

const Navbar = () => {
  const { authStore, settingsStore } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const accountItems: MenuProps["items"] = authStore.user
    ? [
        {
          key: "email",
          label: <Typography.Text>{authStore.user.email}</Typography.Text>,
          disabled: true,
        },
        { type: "divider" },
        {
          key: "theme",
          icon: <BgColorsOutlined />,
          label: "Theme",
          children: [
            {
              key: "theme-system",
              icon: <DesktopOutlined />,
              label: "System",
              extra: settingsStore.themeMode() === "system" && (
                <CheckOutlined />
              ),
              onClick: () => settingsStore.setThemeMode("system"),
            },
            {
              key: "theme-light",
              icon: <SunOutlined />,
              label: "Light",
              extra: settingsStore.themeMode() === "light" && <CheckOutlined />,
              onClick: () => settingsStore.setThemeMode("light"),
            },
            {
              key: "theme-dark",
              icon: <MoonOutlined />,
              label: "Dark",
              extra: settingsStore.themeMode() === "dark" && <CheckOutlined />,
              onClick: () => settingsStore.setThemeMode("dark"),
            },
          ],
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "Log out",
          danger: true,
          onClick: () => void authStore.signOut().then(() => navigate("/")),
        },
      ]
    : [];

  return (
    <nav className="navbar" aria-label="Main navigation">
      <Link className="navbar-brand" to="/" aria-label="SPADE landing page">
        <TbSpade aria-hidden size={24} />
        <span>SPADE</span>
      </Link>

      <div className="navbar-actions">
        {authStore.user ? (
          <>
            {location.pathname === "/" && (
              <Link className="navbar-workspace-link" to="/workspace">
                <DatabaseOutlined aria-hidden />
                Workspace
              </Link>
            )}
            <Dropdown
              menu={{ items: accountItems, triggerSubMenuAction: "click" }}
              trigger={["click"]}
            >
              <Button
                type="text"
                shape="circle"
                className="account-menu-button"
                aria-label="Open user menu"
                icon={<Avatar size={32} icon={<UserOutlined />} />}
              />
            </Dropdown>
          </>
        ) : (
          <Space size="middle">
            <Link className="navbar-sign-in" to="/login">
              Sign in
            </Link>
            <Button type="primary" onClick={() => navigate("/register")}>
              Create account
            </Button>
          </Space>
        )}
      </div>
    </nav>
  );
};

export default observer(Navbar);
