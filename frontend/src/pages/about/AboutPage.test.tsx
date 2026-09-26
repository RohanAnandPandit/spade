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
    screen.getByRole("heading", { level: 1, name: "About" })
  ).toBeVisible();
  expect(screen.getByText(/I'm Rohan Pandit/)).toBeVisible();
  expect(
    screen.getByText(
      /I started SPADE as my final-year project at Imperial College London/
    )
  ).toBeVisible();
  expect(screen.getByText(/Professor Peter McBrien/)).toBeVisible();
  expect(
    screen.getByText(/how we can find the most useful way to represent data/)
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Finding the right view for the data" })
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Try the sample workspace" })
  ).toHaveAttribute("href", "/try");
});
