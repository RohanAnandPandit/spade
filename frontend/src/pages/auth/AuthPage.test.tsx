import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import AuthPage from "./AuthPage";

vi.mock("../../stores/store", () => ({
  useStore: () => ({
    authStore: { initialized: true, user: null },
  }),
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(() => vi.unstubAllEnvs());

test("prefills the local login form with the seeded test account", () => {
  render(
    <MemoryRouter>
      <AuthPage mode="login" />
    </MemoryRouter>
  );

  expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue(
    "tester@example.com"
  );
  expect(screen.getByLabelText("Password")).toHaveValue("SpadeTest123!");
});

test("leaves registration fields empty", () => {
  render(
    <MemoryRouter>
      <AuthPage mode="register" />
    </MemoryRouter>
  );

  expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
  expect(screen.getByLabelText("Password")).toHaveValue("");
});

test("leaves the login form empty outside development", () => {
  vi.stubEnv("DEV", false);
  render(
    <MemoryRouter>
      <AuthPage mode="login" />
    </MemoryRouter>
  );

  expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("");
  expect(screen.getByLabelText("Password")).toHaveValue("");
});
