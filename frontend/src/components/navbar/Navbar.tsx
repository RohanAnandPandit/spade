import { Link, useNavigate } from "react-router-dom";
import { Avatar, Button, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { TbSpade } from "react-icons/tb";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import Settings from "../settings/Settings";
import "./Navbar.css";

const Navbar = () => {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const accountItems: MenuProps["items"] = authStore.user
    ? [
        {
          key: "email",
          label: <Typography.Text>{authStore.user.email}</Typography.Text>,
          disabled: true,
        },
        { type: "divider" },
        {
          key: "settings",
          icon: <SettingOutlined />,
          label: "Settings",
          onClick: () => setSettingsOpen(true),
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
    <>
      <nav className="navbar" aria-label="Main navigation">
        <Link className="navbar-brand" to="/" aria-label="SPADE landing page">
          <TbSpade aria-hidden size={24} />
          <span>SPADE</span>
        </Link>

        <div className="navbar-actions">
          {authStore.user ? (
            <Dropdown menu={{ items: accountItems }} trigger={["click"]}>
              <Button
                type="text"
                shape="circle"
                className="account-menu-button"
                aria-label="Open user menu"
                icon={<Avatar size={32} icon={<UserOutlined />} />}
              />
            </Dropdown>
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
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default observer(Navbar);
