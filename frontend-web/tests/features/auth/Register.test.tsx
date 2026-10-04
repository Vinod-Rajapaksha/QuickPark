import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Register from "../../../src/pages/auth/Register";
import { useAuth } from "../../../src/hooks/useAuth";
import { Role } from "../../../src/features/auth/types/authTypes";

vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("Register Component", () => {
  const mockRegisterUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as Mock).mockReturnValue({
      registerUser: mockRegisterUser,
      isAuthenticated: false,
    });
  });

  it("renders register form correctly", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /Create an account/i })).toBeInTheDocument();
    expect(screen.getByText(/I am a.../i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Kavindu Rathnayaka/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Kavindu@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/07XXXXXXXX/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/123456789V/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign up/i })).toBeInTheDocument();
  });

  it("displays validation errors for empty fields", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Phone number must be valid/i)).toBeInTheDocument();
      expect(screen.getByText(/NIC is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("submits the form successfully with valid data", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Kavindu Rathnayaka/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Kavindu@example.com/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/07XXXXXXXX/i), {
      target: { value: "0712345678" },
    });
    fireEvent.change(screen.getByPlaceholderText(/123456789V/i), {
      target: { value: "991234567V" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: "password123" },
    });

    const submitButton = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
        fullName: "Test User",
        email: "test@example.com",
        phone: "0712345678",
        nic: "991234567V",
        password: "password123",
        role: Role.DRIVER,
      });
    });
  });
});
