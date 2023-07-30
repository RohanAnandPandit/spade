import { makeAutoObservable } from "mobx";
import { makePersistable } from "mobx-persist-store";
import RootStore from "./root-store";

type SettingsState = {
  darkMode: boolean;
  sidebarWidth: number;
  fullScreen: boolean;
  sidebarCollapsed: boolean;
  showAllCharts: boolean;
};

class SettingsStore {
  rootStore: RootStore;
  state: SettingsState = {
    darkMode: false,
    sidebarWidth: 200,
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
    return this.state.darkMode;
  }

  sidebarWidth = (): number => {
    return this.state.sidebarWidth;
  }

  fullScreen = (): boolean => {
    return this.state.fullScreen;
  }

  sidebarCollapsed = (): boolean => {
    return this.state.sidebarCollapsed;
  }

  showAllCharts = (): boolean => {
    return this.state.showAllCharts;
  }

  screenWidth = (): number => {
    return window.screen.availWidth;
    // return Math.max(
    //   document.documentElement.clientWidth || Number.MAX_SAFE_INTEGER,
    //   window.innerWidth || Number.MAX_SAFE_INTEGER
    // );
  }

  screenHeight = (): number => {
    return Math.min(
      document.documentElement.clientHeight ?? Number.MAX_SAFE_INTEGER,
      window.innerHeight ?? Number.MAX_SAFE_INTEGER
    );
  }

  setDarkMode(value: boolean) {
    this.state.darkMode = value;
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
