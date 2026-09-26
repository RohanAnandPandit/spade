import { makeAutoObservable } from "mobx";
import RootStore from "./root-store";

export type ThemeMode = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "spade-theme";

const savedThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
};

const systemPrefersDark = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;

type SettingsState = {
  themeMode: ThemeMode;
  systemDarkMode: boolean;
  sidebarWidth: number;
  fullScreen: boolean;
  sidebarCollapsed: boolean;
  showAllCharts: boolean;
};

class SettingsStore {
  rootStore: RootStore;
  state: SettingsState = {
    themeMode: savedThemeMode(),
    systemDarkMode: systemPrefersDark(),
    sidebarWidth: 240,
    fullScreen: false,
    sidebarCollapsed: false,
    showAllCharts: false,
  };

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    // makePersistable(this, {
    //   name: "Settings",
    //   properties: [
    //     {
    //       key: "state",
    //       serialize: (value) => JSON.stringify(value),
    //       deserialize: (value) => JSON.parse(value),
    //     },
    //   ],
    //   storage: window.localStorage,
    // });
  }

  darkMode = (): boolean => {
    return (
      this.state.themeMode === "dark" ||
      (this.state.themeMode === "system" && this.state.systemDarkMode)
    );
  };

  themeMode = (): ThemeMode => {
    return this.state.themeMode;
  };

  sidebarWidth = (): number => {
    return this.state.sidebarWidth;
  };

  fullScreen = (): boolean => {
    return this.state.fullScreen;
  };

  sidebarCollapsed = (): boolean => {
    return this.state.sidebarCollapsed;
  };

  showAllCharts = (): boolean => {
    return this.state.showAllCharts;
  };

  screenWidth = (): number => {
    return Math.max(document.documentElement.clientWidth, window.innerWidth);
  };

  screenHeight = (): number => {
    return Math.min(
      document.documentElement.clientHeight ?? Number.MAX_SAFE_INTEGER,
      window.innerHeight ?? Number.MAX_SAFE_INTEGER
    );
  };

  setThemeMode(value: ThemeMode) {
    this.state.themeMode = value;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }

  setSystemDarkMode(value: boolean) {
    this.state.systemDarkMode = value;
  }

  setFullScreen(value: boolean) {
    this.state.fullScreen = value;
  }

  setSidebarCollapsed(value: boolean) {
    this.state.sidebarCollapsed = value;
  }

  setShowAllCharts(value: boolean) {
    this.state.showAllCharts = value;
  }
}

export default SettingsStore;
