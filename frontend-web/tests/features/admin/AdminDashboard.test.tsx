import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminDashboardPage from "../../../src/pages/admin/AdminDashboardPage";

vi.mock("../../../src/features/users/hooks/useUsers", () => ({
  useUsers: vi.fn(() => ({
    data: { total: 10, data: [], page: 1, limit: 10 },
  })),
}));

vi.mock("../../../src/features/providers/hooks/useProviders", () => ({
  useProviders: vi.fn(() => ({
    pending: [{ id: "1", businessName: "Test Provider" }],
  })),
}));

vi.mock("../../../src/features/parking/api/parkingApi", () => ({
  parkingApi: {
    getFacilitiesForReview: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("../../../src/features/reports/api/reportApi", () => ({
  reportApi: {
    getPlatformRevenue: vi.fn(() => Promise.resolve({ totalRevenue: 5000 })),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
};

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the dashboard header and cards", async () => {
    renderWithProviders(<AdminDashboardPage />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Overview of the platform's key metrics and activities.",
      ),
    ).toBeInTheDocument();

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText("Properties")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });
});
