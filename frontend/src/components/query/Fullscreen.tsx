import { observer } from "mobx-react-lite";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { AiOutlineFullscreen, AiOutlineFullscreenExit } from "react-icons/ai";
import "./Fullscreen.css";
import { FloatButton } from "antd";
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
    <>
      <FullScreen
        handle={handle}
        className={settings.darkMode() ? "fullscreen-dark" : "fullscreen-light"}
      >
        {children}
        {handle.active && (
          <FloatButton
            icon={
              <AiOutlineFullscreenExit
                title="Exit fullscreen"
                size={20}
                style={{ paddingRight: 1, paddingBottom: 2 }}
              />
            }
            style={{ top: 10, right: 75 }}
            onClick={() => {
              settings.setFullScreen(false);
              handle.exit();
            }}
          />
        )}
      </FullScreen>
      <FloatButton
        tooltip="Fullscreen"
        icon={
          <AiOutlineFullscreen
            size={20}
            style={{ paddingRight: 1, paddingBottom: 2 }}
          />
        }
        style={{ top: 10, right: 75 }}
        onClick={() => {
          settings.setFullScreen(true);
          handle.enter();
        }}
      />
    </>
  );
});

export default Fullscreen;
