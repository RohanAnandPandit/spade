import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Spin,
  Typography,
} from "antd";
import { observer } from "mobx-react-lite";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiErrorMessage } from "../../api/client";
import { useStore } from "../../stores/store";

type Fields = { email: string; password: string };

const AuthPage = observer(({ mode }: { mode: "login" | "register" }) => {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!authStore.initialized)
    return <Spin fullscreen tip="Restoring your session" />;
  if (authStore.user) return <Navigate to="/workspace" replace />;

  const submit = async ({ email, password }: Fields) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "register") await authStore.signUp(email, password);
      else await authStore.signIn(email, password);
      const destination =
        (location.state as { from?: string } | null)?.from ?? "/workspace";
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(apiErrorMessage(caught, "Authentication failed."));
    } finally {
      setLoading(false);
    }
  };

  const registering = mode === "register";
  return (
    <Space
      align="center"
      direction="vertical"
      style={{ width: "100%", padding: 32 }}
    >
      <Card
        title={registering ? "Create your SPADE account" : "Sign in to SPADE"}
        style={{ width: "min(420px, 100%)" }}
      >
        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          layout="vertical"
          onFinish={(values: Fields) => void submit(values)}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true },
              ...(registering
                ? [{ min: 12, message: "Use at least 12 characters." }]
                : []),
            ]}
          >
            <Input.Password
              autoComplete={registering ? "new-password" : "current-password"}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {registering ? "Create account" : "Sign in"}
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          {registering ? "Already have an account? " : "New to SPADE? "}
          <Link to={registering ? "/login" : "/register"}>
            {registering ? "Sign in" : "Create an account"}
          </Link>
        </Typography.Paragraph>
      </Card>
    </Space>
  );
});

export default AuthPage;
