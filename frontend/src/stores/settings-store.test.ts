import { beforeEach, expect, test } from "vitest";

import RootStore from "./root-store";

beforeEach(() => window.localStorage.clear());

test("system theme follows the device while explicit choices override it", () => {
  const settings = new RootStore().settingsStore;

  expect(settings.themeMode()).toBe("system");
  settings.setSystemDarkMode(true);
  expect(settings.darkMode()).toBe(true);

  settings.setThemeMode("light");
  expect(settings.darkMode()).toBe(false);
  settings.setSystemDarkMode(false);
  settings.setThemeMode("dark");
  expect(settings.darkMode()).toBe(true);

  settings.setThemeMode("system");
  expect(settings.darkMode()).toBe(false);
});

test("remembers the selected theme across store creation", () => {
  new RootStore().settingsStore.setThemeMode("dark");

  expect(new RootStore().settingsStore.themeMode()).toBe("dark");
});
