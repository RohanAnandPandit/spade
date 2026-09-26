import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";

import AboutPage from "./AboutPage";

test("explains SPADE's origin and links to the sample workspace", () => {
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("heading", {
      name: "What is the best way to represent data?",
    })
  ).toBeVisible();
  expect(
    screen.getByText(
      /I started SPADE as my final-year project at Imperial College London/
    )
  ).toBeVisible();
  expect(screen.getByText(/Professor Peter McBrien/)).toBeVisible();
  expect(
    screen.getByText(
      /which representation makes its patterns and connections clearest/
    )
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Try the sample workspace" })
  ).toHaveAttribute("href", "/try");
});
