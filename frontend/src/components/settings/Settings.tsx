import { Divider, Drawer, Space, Switch } from "antd";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/store";
import { Typography } from "antd";
import { MdLightMode, MdDarkMode } from "react-icons/md";

const { Text } = Typography;

type SettingsProps = {
  open: boolean;
  onClose: () => void;
};

const Settings = ({ open, onClose }: SettingsProps) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;

  return (
    <Drawer title="Settings" placement="right" onClose={onClose} open={open}>
      <Space direction="vertical" style={{ width: "100%" }}>
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
        <Space>
          <Switch
            checked={settings.showAllCharts()}
            onChange={(checked: boolean) => settings.setShowAllCharts(checked)}
          />
          <Text>Show all charts</Text>
        </Space>
      </Space>
    </Drawer>
  );
};

export default observer(Settings);
