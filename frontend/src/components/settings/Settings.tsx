import {
  Alert,
  Divider,
  Drawer,
  FloatButton,
  Space,
  Switch,
  Tooltip,
} from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { IoMdSettings } from "react-icons/io";
import { useStore } from "../../stores/store";
import { Typography } from "antd";
import { MdLightMode, MdDarkMode } from "react-icons/md";

const { Text } = Typography;

const Settings = () => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;

  const [open, setOpen] = useState(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Tooltip placement="bottom" title="Settings">
        <FloatButton
          icon={<IoMdSettings size={25} style={{ paddingRight: 7 }} />}
          onClick={showDrawer}
          style={{ top: 10 }}

        />
      </Tooltip>
      <Drawer title="Settings" placement="right" onClose={onClose} open={open}>
        <Space direction="vertical">
          <Space>
            <Switch
              checked={settings.darkMode()}
              onChange={(checked: boolean) => settings.setDarkMode(checked)}
              checkedChildren={<MdDarkMode style={{ marginBottom: 2 }} />}
              unCheckedChildren={<MdLightMode style={{ marginBottom: 2 }} />}
            />
            <Text>Dark Mode</Text>
          </Space>
          <Divider />
          <Divider />
          <Space>
            <Switch
              checked={settings.showAllCharts()}
              onChange={(checked: boolean) =>
                settings.setShowAllCharts(checked)
              }
            />
            <Text>Show all charts</Text>
          </Space>
          <Alert
            message="The tool currently supports the N-Triples syntax."
            banner
          />
        </Space>
      </Drawer>
    </>
  );
};

export default observer(Settings);
