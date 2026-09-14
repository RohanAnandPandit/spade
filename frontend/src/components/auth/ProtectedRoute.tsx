import { Spin } from "antd";
import { observer } from "mobx-react-lite";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../../stores/store";

const ProtectedRoute = observer(() => {
  const { authStore } = useStore();
  const location = useLocation();
  if (!authStore.initialized)
    return <Spin fullscreen tip="Restoring your session" />;
  if (!authStore.user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
});

export default ProtectedRoute;
