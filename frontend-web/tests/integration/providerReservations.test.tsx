// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProviderReservationsPage from "../../src/pages/provider/ReservationsPage";
import ProviderReservationApprovalPage from "../../src/pages/provider/ProviderReservationApprovalPage";
import { ToastProvider } from "../../src/app/providers/ToastProvider";
import type { Reservation } from "../../src/features/reservations/types/reservationTypes";
import { ROUTES } from "../../src/app/routes/routeConstants";

const api = vi.hoisted(() => ({
  getProvider: vi.fn(),
  getById: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("../../src/features/reservations/api/reservationApi", () => ({
  reservationApi: api,
}));

const RES_ID = "cccccccc-1111-1111-1111-111111111111";
const LIST_PATH = ROUTES.PROVIDER_RESERVATIONS;
const approvalPath = (id: string): string =>
  ROUTES.PROVIDER_RESERVATION_APPROVAL.replace(":id", id);

const reservation = (over: Partial<Reservation> = {}): Reservation => ({
  reservationId: RES_ID,
  driverId: "dddddddd-0000-0000-0000-000000000001",
  driverName: "Nimal Perera",
  driverPhone: "0771111111",
  facilityId: "11111111-1111-1111-1111-111111111111",
  facilityName: "Galle Road Parking",
  city: "Colombo",
  province: "Western",
  district: "Colombo",
  providerId: "22222222-2222-2222-2222-222222222222",
  slotId: "33333333-0000-0000-0000-000000000001",
  slotNumber: "A-07",
  vehicleTypeId: "aaaaaaaa-0000-0000-0000-000000000001",
  vehicleTypeName: "Car",
  startTime: "2026-10-06T09:00:00Z",
  endTime: "2026-10-06T12:00:00Z",
  hours: 3,
  hourlyRate: 400,
  totalAmount: 1200,
  commissionRate: 15,
  commissionAmount: 200,
  providerAmount: 1000,
  status: "PENDING",
  isApprovedByProvider: false,
  isAgentBooking: true,
  checkedInAt: null,
  checkedOutAt: null,
  cancelReason: null,
  cancelledBy: null,
  cancelledAt: null,
  createdAt: "2026-10-05T08:00:00Z",
  updatedAt: "2026-10-05T08:00:00Z",
  ...over,
});

// Readings built from several JSX expressions only match on the whole element's text.
const elementReading = (text: string): HTMLElement => {
  const nodes = [...globalThis.document.querySelectorAll<HTMLElement>("p, span, h2")];
  const found = nodes.find(
    (node) => (node.textContent ?? "").replace(/\s+/g, " ").trim() === text,
  );
  if (!found) throw new Error(`Nothing on the page reads "${text}".`);
  return found;
};

const renderAt = (path: string): void => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.PROVIDER_RESERVATIONS} element={<ProviderReservationsPage />} />
            <Route
              path={ROUTES.PROVIDER_RESERVATION_APPROVAL}
              element={<ProviderReservationApprovalPage />}
            />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
};

const openApproval = async (current: Reservation): Promise<void> => {
  api.getById.mockResolvedValue(current);
  renderAt(approvalPath(current.reservationId));
  await screen.findByText("Reservation Approval");
};

const refuse = (message: string): Error =>
  Object.assign(new Error(message), { response: { status: 400, data: { message } } });

beforeEach(() => {
  api.getProvider.mockResolvedValue([]);
  api.getById.mockResolvedValue(reservation());
  api.approve.mockResolvedValue(reservation({ status: "CONFIRMED", isApprovedByProvider: true }));
  api.reject.mockResolvedValue(reservation({ status: "CANCELLED" }));
  api.sendMessage.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("provider reservation requests list", () => {
  it("lists every request on the owner's bays, marking only an agent booking that still needs them", async () => {
    api.getProvider.mockResolvedValue([
      reservation(),
      reservation({
        reservationId: "cccccccc-2222-2222-2222-222222222222",
        driverName: "Amara Silva",
        isAgentBooking: false,
      }),
      reservation({
        reservationId: "cccccccc-3333-3333-3333-333333333333",
        driverName: "Ruwan Jayasena",
        status: "CONFIRMED",
        isApprovedByProvider: true,
      }),
    ]);

    renderAt(LIST_PATH);

    expect(await screen.findByText("Nimal Perera")).toBeTruthy();
    expect(screen.getByText("Requires Approval")).toBeTruthy();
    expect(screen.getByText("Amara Silva")).toBeTruthy();
    expect(screen.getByText("Ruwan Jayasena")).toBeTruthy();
    expect(screen.getByText("CONFIRMED")).toBeTruthy();
    // A request the driver made in the app itself needs no decision, so it keeps its plain status.
    expect(screen.getAllByText("PENDING")).toHaveLength(1);
  });

  it("reads the requests from the provider endpoint and opens one by its own address", async () => {
    api.getProvider.mockResolvedValue([reservation()]);

    renderAt(LIST_PATH);
    fireEvent.click(await screen.findByRole("button", { name: "View Details" }));

    expect(api.getProvider).toHaveBeenCalledTimes(1);
    expect(api.getProvider.mock.calls[0][0]).toBeUndefined();
    expect(await screen.findByText("Reservation Approval")).toBeTruthy();
    await waitFor(() => expect(api.getById).toHaveBeenCalledWith(RES_ID));
  });

  it("says there are none when the owner holds no request", async () => {
    renderAt(LIST_PATH);

    expect(await screen.findByText("No reservations found.")).toBeTruthy();
  });

  it("shows its own failure card when the server will not answer", async () => {
    api.getProvider.mockRejectedValue(refuse("Your account is not a parking provider."));

    renderAt(LIST_PATH);

    expect(await screen.findByText("Error Loading Reservations")).toBeTruthy();
    expect(screen.getByText("Could not load reservations from the server.")).toBeTruthy();
  });
});

describe("reservation approval screen", () => {
  it("lays the request out as the owner needs it, with only their own share as revenue", async () => {
    await openApproval(reservation());

    expect(elementReading("Request Details")).toBeTruthy();
    expect(screen.getByText("Pending Approval")).toBeTruthy();
    expect(screen.getByText("Nimal Perera")).toBeTruthy();
    expect(screen.getByText("Car")).toBeTruthy();
    expect(screen.getByText("Driver Name")).toBeTruthy();
    expect(screen.getByText("Vehicle")).toBeTruthy();
    expect(screen.getByText("Requested Time")).toBeTruthy();
    // The owner's own share, never the driver's gross total: the platform fee stays the platform's.
    expect(screen.getByText("Est. Revenue")).toBeTruthy();
    expect(elementReading("1000 LKR")).toBeTruthy();
    expect(screen.queryByText("1200 LKR")).toBeNull();
    expect(screen.getByText("Message to Driver")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("E.g. Reason for rejection, or a question about their vehicle..."),
    ).toBeTruthy();
  });

  it("approves an agent booking through the approve endpoint only after the owner confirms", async () => {
    await openApproval(reservation());

    fireEvent.click(screen.getByRole("button", { name: "Approve Request" }));
    expect(await screen.findByText("Approve Reservation")).toBeTruthy();
    expect(
      screen.getByText(
        "Are you sure you want to approve this reservation? The driver will be notified and asked to pay.",
      ),
    ).toBeTruthy();
    expect(api.approve).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(
      await screen.findByText(
        "Reservation approved successfully. The driver has been notified.",
      ),
    ).toBeTruthy();
    await waitFor(() => expect(api.approve).toHaveBeenCalledWith(RES_ID));
    expect(api.reject).not.toHaveBeenCalled();
  });

  it("still tells the owner when the platform refuses their approval", async () => {
    api.approve.mockRejectedValue(refuse("The booking window for this slot has passed."));
    await openApproval(reservation());

    fireEvent.click(screen.getByRole("button", { name: "Approve Request" }));
    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));

    expect(await screen.findByText("The booking window for this slot has passed.")).toBeTruthy();
    // The dialog leaves through a framer-motion exit, so it only drops out of the DOM on a later frame.
    await waitFor(() => expect(screen.queryByText("Approve Reservation")).toBeNull());
  });

  it("sends the reason the owner typed along with the rejection", async () => {
    await openApproval(reservation());

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "The bay is being repainted that morning." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject Request" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));

    await waitFor(() =>
      expect(api.reject).toHaveBeenCalledWith(RES_ID, "The bay is being repainted that morning."),
    );
    expect(await screen.findByText("Reservation rejected.")).toBeTruthy();
    expect(api.approve).not.toHaveBeenCalled();
  });

  it("falls back to its own wording when the owner rejects without a reason", async () => {
    await openApproval(reservation());

    fireEvent.click(screen.getByRole("button", { name: "Reject Request" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));

    await waitFor(() =>
      expect(api.reject).toHaveBeenCalledWith(RES_ID, "Provider rejected the request."),
    );
  });

  it("leaves a booking made in the app itself beyond the owner's approve button, and says why", async () => {
    await openApproval(reservation({ isAgentBooking: false }));

    expect(screen.getByText("Auto-Approval Notice")).toBeTruthy();
    expect(
      screen.getByText(
        "This reservation was booked directly through the standard app (not via AI Agent). You do not need to manually approve it.",
      ),
    ).toBeTruthy();
    expect((screen.getByRole("button", { name: "Approve Request" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve Request" }));
    expect(screen.queryByText("Approve Reservation")).toBeNull();
    expect(api.approve).not.toHaveBeenCalled();
  });

  it("closes a decided request with its own card instead of the approve buttons", async () => {
    await openApproval(
      reservation({ status: "CONFIRMED", isApprovedByProvider: true }),
    );

    expect(elementReading("Reservation Approved")).toBeTruthy();
    expect(
      screen.getByText("The driver has been notified and the spot is now reserved."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve Request" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reject Request" })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Back to Requests" }));
    expect(await screen.findByText("Reservations")).toBeTruthy();
  });

  it("sends a note to the driver through the message endpoint alone and empties the box", async () => {
    await openApproval(reservation());

    const box = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect((screen.getByRole("button", { name: "Send Message" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.change(box, { target: { value: "Is your vehicle under 2.5 m wide?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

    await waitFor(() =>
      expect(api.sendMessage).toHaveBeenCalledWith(RES_ID, "Is your vehicle under 2.5 m wide?"),
    );
    expect(await screen.findByText("Message sent to driver via AI Agent!")).toBeTruthy();
    expect(box.value).toBe("");
    expect(api.approve).not.toHaveBeenCalled();
    expect(api.reject).not.toHaveBeenCalled();
  });

  it("shows the server's refusal when the request cannot be read", async () => {
    api.getById.mockRejectedValue(new Error("You can only act on your own reservations."));

    renderAt(approvalPath(RES_ID));

    expect(await screen.findByText("Error Loading Reservation")).toBeTruthy();
    expect(screen.getByText("You can only act on your own reservations.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back to Reservations" })).toBeTruthy();
  });
});
