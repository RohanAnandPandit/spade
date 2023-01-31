import React from "react";
import { Menu } from "antd";
import { routes } from "./routes";

const buttons = routes.map(({ name, path }) => ({
  key: name,
  label: <a href={path}>{name}</a>,
}));

const Navbar = () => {
  return (
      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={["2"]}
        items={buttons}
      />
  );
};

export default Navbar;
