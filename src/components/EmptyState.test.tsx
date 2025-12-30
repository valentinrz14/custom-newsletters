import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState.component";

describe("EmptyState", () => {
  it("renders correctly", () => {
    render(<EmptyState />);
    expect(
      screen.getByText("No hubo actualizaciones esta semana")
    ).toBeInTheDocument();
  });
});
