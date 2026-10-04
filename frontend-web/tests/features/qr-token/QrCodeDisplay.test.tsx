import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import QrCodeDisplay from "../../../src/features/qr-token/components/QrCodeDisplay";
import { qrTokenApi } from "../../../src/features/qr-token/api/qrTokenApi";
import { render } from "../../utils/test-utils";

vi.mock("../../../src/features/qr-token/api/qrTokenApi", () => ({
  qrTokenApi: {
    getReservationToken: vi.fn(),
  },
}));

describe("QrCodeDisplay Component", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", async () => {
    (qrTokenApi.getReservationToken as Mock).mockReturnValue(new Promise(() => {}));

    render(<QrCodeDisplay reservationId="123" onClose={mockOnClose} />);
    expect(screen.getByText("Booking QR Code")).toBeInTheDocument();
  });

  it("renders the QR code after successfully fetching the token (API-Integration & Component)", async () => {
    (qrTokenApi.getReservationToken as Mock).mockResolvedValue({
      token: "mocked-token-123",
    });

    render(<QrCodeDisplay reservationId="123" onClose={mockOnClose} />);
    
    // Wait for loading to finish and QR to appear
    await waitFor(() => {
      // The button should become enabled when token is present
      const saveButton = screen.getByRole("button", { name: /save image/i });
      expect(saveButton).not.toBeDisabled();
    });

    // Check if qr token api was called
    expect(qrTokenApi.getReservationToken).toHaveBeenCalledWith("123");
  });

  it("renders an error message if the API call fails (Error-State)", async () => {
    const errorResponse = {
      response: { data: { message: "Token expired" } },
    };
    (qrTokenApi.getReservationToken as Mock).mockRejectedValue(errorResponse);

    render(<QrCodeDisplay reservationId="123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText("Token expired")).toBeInTheDocument();
    });
  });

  it("calls onClose when Done button is clicked", async () => {
    (qrTokenApi.getReservationToken as Mock).mockResolvedValue({
      token: "mocked-token-123",
    });
    render(<QrCodeDisplay reservationId="123" onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save image/i })).not.toBeDisabled();
    });

    const doneBtn = screen.getByRole("button", { name: /done/i });
    fireEvent.click(doneBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
