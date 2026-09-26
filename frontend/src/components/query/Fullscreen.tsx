import { observer } from "mobx-react-lite";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import "./Fullscreen.css";
import { Button, theme, Tooltip } from "antd";
import { useStore } from "../../stores/store";
import { ReactNode, useEffect } from "react";

const Fullscreen = observer(
  ({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) => {
    const rootStore = useStore();
    const settings = rootStore.settingsStore;
    const handle = useFullScreenHandle();
    const { token } = theme.useToken();

    useEffect(() => {
      const exitHandler = () => {
        if (!document.fullscreenElement) {
          settings.setFullScreen(false);
        }
      };
      document.addEventListener("webkitfullscreenchange", exitHandler, false);
      document.addEventListener("mozfullscreenchange", exitHandler, false);
      document.addEventListener("fullscreenchange", exitHandler, false);
      document.addEventListener("MSFullscreenChange", exitHandler, false);
      return () => {
        document.removeEventListener(
          "webkitfullscreenchange",
          exitHandler,
          false
        );
        document.removeEventListener("mozfullscreenchange", exitHandler, false);
        document.removeEventListener("fullscreenchange", exitHandler, false);
        document.removeEventListener("MSFullscreenChange", exitHandler, false);
      };
    }, [settings]);

    return (
      <div
        className="spade-fullscreen-surface"
        style={{ background: token.colorBgContainer }}
      >
        <FullScreen handle={handle} className="spade-fullscreen">
          <div className="fullscreen-control-row">
            {toolbar && <div className="fullscreen-toolbar">{toolbar}</div>}
            <Tooltip
              title={handle.active ? "Return to workspace" : "Expand this view"}
            >
              <Button
                type="text"
                aria-label={handle.active ? "Exit fullscreen" : "Fullscreen"}
                icon={
                  handle.active ? (
                    <AiOutlineFullscreenExit aria-hidden size={18} />
                  ) : (
                    <AiOutlineFullscreen aria-hidden size={18} />
                  )
                }
                size="small"
                onClick={() => {
                  settings.setFullScreen(!handle.active);
                  if (handle.active) void handle.exit();
                  else void handle.enter();
                }}
              />
            </Tooltip>
          </div>
          {children}
        </FullScreen>
      </div>
    );
  }
);

export default Fullscreen;
