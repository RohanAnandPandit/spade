import { observer } from "mobx-react-lite";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import "./Fullscreen.css";
import { Button, Tooltip } from "antd";
import { useStore } from "../../stores/store";
import { ReactNode, useEffect } from "react";

const Fullscreen = observer(({ children }: { children: ReactNode }) => {
  const rootStore = useStore();
  const settings = rootStore.settingsStore;
  const handle = useFullScreenHandle();

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
    <FullScreen
      handle={handle}
      className={`spade-fullscreen ${
        settings.darkMode() ? "fullscreen-dark" : "fullscreen-light"
      }`}
    >
      <div className="fullscreen-control-row">
        <Tooltip
          title={handle.active ? "Return to workspace" : "Expand this view"}
        >
          <Button
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
          >
            {handle.active ? "Exit fullscreen" : "Fullscreen"}
          </Button>
        </Tooltip>
      </div>
      {children}
    </FullScreen>
  );
});

export default Fullscreen;
