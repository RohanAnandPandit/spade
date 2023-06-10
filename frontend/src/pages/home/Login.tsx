import { useState } from "react";
import { Input, Modal } from "antd";
import { login } from "../../api/user";
import { useStore } from "../../stores/store";
import { observer } from "mobx-react-lite";

const Login = observer(() => {
  const rootStore = useStore();
  const authStore = rootStore.authStore;
  const [open, setOpen] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");

  return (
    <Modal
      title="Login"
      open={open}
      onOk={() => {
        login(username);
        authStore.setUsername(username);
        setOpen(false);
      }}
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
