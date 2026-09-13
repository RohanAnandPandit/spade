import { Link } from "react-router-dom";
import { Menu, Tooltip } from "antd";
import { TbSpade } from "react-icons/tb";

const Navbar = () => {
  const items: any = [
    {
      key: "logo",
      icon: <TbSpade size={20} />,
      label: <Tooltip title="SPARQL Analyser & Data Explorer">SPADE</Tooltip>,
      children: [],
    },
    {
      key: "Home",
      label: <Link to="/">Home</Link>,
    },
    {
      key: "Contact",
      label: <Link to="/contact">Contact</Link>,
    },
  ];
  return (
    <Menu
      theme="dark"
      mode="horizontal"
      defaultSelectedKeys={["Home"]}
      items={items}
    />
  );
};

export default Navbar;
