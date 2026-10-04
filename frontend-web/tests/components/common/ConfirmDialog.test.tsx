import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ConfirmDialog from "../../../src/components/common/ConfirmDialog/ConfirmDialog";
import { render } from "../../utils/test-utils";

describe("ConfirmDialog Component", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog correctly", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Are you sure?"
        description="This action cannot be undone."
      />,
    );

    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Are you sure?"
        description="This action cannot be undone."
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});
