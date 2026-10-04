import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Input from "../../../src/components/common/Input/Input";

describe("Input Component", () => {
  it("renders with a label and required asterisk", () => {
    render(<Input label="Email" required />);

    // Check if label exists
    const labelElement = screen.getByText(/email/i);
    expect(labelElement).toBeInTheDocument();

    // Check if asterisk exists
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("handles user typing and triggers onChange", () => {
    const handleChange = vi.fn();
    render(
      <Input
        label="Username"
        onChange={handleChange}
        placeholder="Enter username"
      />,
    );

    const inputElement = screen.getByPlaceholderText(/enter username/i);
    fireEvent.change(inputElement, { target: { value: "testuser" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect((inputElement as HTMLInputElement).value).toBe("testuser");
  });

  it("displays validation error message (Form-Validation Error-State)", () => {
    const errorMessage = "Email is invalid";
    render(<Input label="Email" error={errorMessage} />);

    // The error message should be in the document
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("toggles password visibility when eye icon is clicked", () => {
    render(
      <Input label="Password" type="password" placeholder="Enter password" />,
    );

    // Initially should be password type
    const inputElement = screen.getByPlaceholderText(/enter password/i);
    expect(inputElement).toHaveAttribute("type", "password");

    // Click the toggle button
    const toggleBtn = screen.getByRole("button");
    fireEvent.click(toggleBtn);

    // After click, it should be text type
    expect(inputElement).toHaveAttribute("type", "text");

    // Click again to hide
    fireEvent.click(toggleBtn);
    expect(inputElement).toHaveAttribute("type", "password");
  });
});
