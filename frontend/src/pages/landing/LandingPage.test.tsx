import { App as AntdApp } from "antd";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test } from "vitest";

import RootStore from "../../stores/root-store";
import { StoreContext } from "../../stores/store";
import LandingPage from "./LandingPage";

const renderLandingPage = (signedIn: boolean) => {
  const rootStore = new RootStore();

  if (signedIn) {
    rootStore.authStore.user = {
      id: "user-1",
      email: "person@example.com",
    };
  }

  render(
    <MemoryRouter>
      <StoreContext.Provider value={rootStore}>
        <AntdApp>
          <LandingPage />
        </AntdApp>
      </StoreContext.Provider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test("shows visitors the sample dataset and account actions", () => {
  renderLandingPage(false);

  expect(
    screen.getByRole("heading", {
      name: "Explore RDF schemas, inspect linked data, and visualise connections.",
    })
  ).toBeVisible();
  expect(
    screen.getByText(/SPADE stands for SPARQL Analysis and Data Explorer/)
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: /Try sample dataset/ })
  ).toHaveAttribute("href", "/try");
  expect(
    screen.getByRole("link", { name: "Or create an account" })
  ).toHaveAttribute("href", "/register");
  expect(
    screen.getByText(`© ${new Date().getFullYear()} Rohan Pandit`)
  ).toBeVisible();
  expect(
    screen.queryByRole("link", { name: "About SPADE" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "View on GitHub" })
  ).not.toBeInTheDocument();
});

test("keeps the visitor sample action visible when signed in", () => {
  renderLandingPage(true);

  expect(
    screen.getByRole("link", { name: /Try sample dataset/ })
  ).toHaveAttribute("href", "/try");
  expect(screen.getByRole("link", { name: "Open workspace" })).toHaveAttribute(
    "href",
    "/workspace"
  );
  expect(screen.getByRole("button", { name: "Open workspace" })).toHaveClass(
    "ant-btn-primary"
  );
});
