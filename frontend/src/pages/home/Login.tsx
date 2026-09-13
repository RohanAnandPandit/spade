import { useState } from "react";
import { App as AntdApp, Input, Modal } from "antd";
import { login } from "../../api/user";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";

const Login = observer(() => {
  const rootStore = useStore();
  const authStore = rootStore.authStore;
  const [open, setOpen] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();

  const handleLogin = async () => {
    if (!username.trim()) {
      message.warning("Enter a username.");
      return;
    }
    setLoading(true);
    try {
      const authenticatedUsername = await login(username.trim());
      authStore.setUsername(authenticatedUsername);
      setOpen(false);
    } catch {
      message.error("Could not log in. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Login"
      open={open}
      confirmLoading={loading}
      onOk={() => void handleLogin()}
    >
      <Input
        title="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.currentTarget.value)}
      />
    </Modal>
  );
});

export default Login;
