import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import Navbar from "./Navbar";

const { signOut, store } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  store: {
    authStore: {
      user: { id: "user-id", email: "person@example.com" },
      signOut: vi.fn(),
    },
    settingsStore: {
      darkMode: vi.fn(() => false),
      setDarkMode: vi.fn(),
      showAllCharts: vi.fn(() => false),
      setShowAllCharts: vi.fn(),
    },
  },
}));

vi.mock("../../stores/store", () => ({
  useStore: () => store,
}));

beforeEach(() => {
  signOut.mockClear();
  store.authStore.signOut = signOut;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

test("keeps account details and actions inside the user menu", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

  expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
  expect(screen.queryByText("person@example.com")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Open user menu" }));

  expect(
    await screen.findByRole("menuitem", { name: "person@example.com" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("menuitem", { name: /Settings/ })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("menuitem", { name: /Log out/ }));
  expect(signOut).toHaveBeenCalledOnce();
});
