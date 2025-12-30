import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState.component";

afterEach(() => {
  cleanup();
});

describe("EmptyState", () => {
  it("renders correctly", () => {
    render(<EmptyState />);
    expect(
      screen.getByText("No hubo actualizaciones esta semana")
    ).toBeInTheDocument();
  });
});
