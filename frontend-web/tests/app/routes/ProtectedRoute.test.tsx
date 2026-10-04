import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../../../src/app/routes/ProtectedRoute";
import { useAuth } from "../../../src/hooks/useAuth";
import { Role } from "../../../src/features/auth/types/authTypes";

vi.mock("../../../src/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner/text when isLoading is true", () => {
    (useAuth as Mock).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Loading session.../i)).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login", () => {
    (useAuth as Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects users with unauthorized roles to /unauthorized", () => {
    (useAuth as Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { role: Role.DRIVER },
    });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route
            element={<ProtectedRoute allowedRoles={[Role.PLATFORM_ADMIN]} />}
          >
            <Route path="/admin" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("renders protected content when authenticated and role matches", () => {
    (useAuth as Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { role: Role.DRIVER },
    });

    render(
      <MemoryRouter initialEntries={["/driver-dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={[Role.DRIVER]} />}>
            <Route
              path="/driver-dashboard"
              element={<div>Driver Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Driver Dashboard")).toBeInTheDocument();
  });
});
