// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SlotManagementPage from "../../src/pages/provider/SlotManagementPage";
import type {
  ParkingSlotRow,
  SlotBoard,
  SlotBoardCounts,
} from "../../src/features/parking-slots/types/parkingSlotTypes";
import type { ParkingFacility } from "../../src/features/parking/types/parkingTypes";

const slots = vi.hoisted(() => ({
  getBoard: vi.fn(),
  getSlot: vi.fn(),
  updateSlotStatus: vi.fn(),
}));

const parking = vi.hoisted(() => ({
  getMyFacilities: vi.fn(),
}));

vi.mock("../../src/features/parking-slots/api/parkingSlotApi", () => ({
  parkingSlotApi: slots,
}));
vi.mock("../../src/features/parking/api/parkingApi", () => ({ parkingApi: parking }));

const FACILITY_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_FACILITY_ID = "44444444-4444-4444-4444-444444444444";
const CAR = "aaaaaaaa-0000-0000-0000-000000000001";
const BAY_1 = "55555555-0000-0000-0000-000000000001";
const BAY_2 = "55555555-0000-0000-0000-000000000002";
const BAY_3 = "55555555-0000-0000-0000-000000000003";

const owned = (facilityId: string, name: string): ParkingFacility =>
  ({ facilityId, name, slotCount: 3 }) as unknown as ParkingFacility;

const bay = (over: Partial<ParkingSlotRow> = {}): ParkingSlotRow => ({
  slotId: BAY_1,
  facilityId: FACILITY_ID,
  slotNumber: "A-01",
  vehicleTypeId: CAR,
  vehicleTypeName: "Car",
  bayLabel: "4.5 m × 2.5 m",
  status: "AVAILABLE",
  effectiveStatus: "AVAILABLE",
  bookable: true,
  hourlyRate: 400,
  busyFrom: null,
  busyUntil: null,
  current: null,
  ...over,
});

// A fee that has not settled still holds its bay, but the board never calls it reserved.
const AWAITING = bay({
  slotId: BAY_2,
  slotNumber: "A-02",
  status: "PENDING",
  effectiveStatus: "PENDING",
  bookable: false,
  busyFrom: "2026-10-06T09:00:00Z",
  busyUntil: "2026-10-06T12:00:00Z",
  current: {
    reservationId: "66666666-0000-0000-0000-000000000002",
    driverName: "Nimal Perera",
    startTime: "2026-10-06T09:00:00Z",
    endTime: "2026-10-06T12:00:00Z",
  },
});
const ON_SITE = bay({
  slotId: BAY_3,
  slotNumber: "A-03",
  // What the server stores is RESERVED; what the bay has become while the driver sits in it is OCCUPIED.
  status: "RESERVED",
  effectiveStatus: "OCCUPIED",
  bookable: false,
  busyFrom: "2026-10-06T08:00:00Z",
  busyUntil: "2026-10-06T14:00:00Z",
  current: {
    reservationId: "66666666-0000-0000-0000-000000000003",
    driverName: "Amara Silva",
    startTime: "2026-10-06T08:00:00Z",
    endTime: "2026-10-06T14:00:00Z",
  },
});
const ALL_BAYS = [bay(), AWAITING, ON_SITE];

const counts = (over: Partial<SlotBoardCounts> = {}): SlotBoardCounts => ({
  total: ALL_BAYS.length,
  available: 1,
  pending: 1,
  reserved: 0,
  occupied: 1,
  maintenance: 0,
  disabled: 0,
  byVehicleType: [
    { vehicleTypeId: CAR, vehicleTypeName: "Car", total: ALL_BAYS.length, available: 1 },
  ],
  ...over,
});

const board = (rows: ParkingSlotRow[], over: Partial<SlotBoard> = {}): SlotBoard => ({
  facility: owned(FACILITY_ID, "Galle Road Parking"),
  counts: counts({ total: rows.length }),
  slots: rows,
  ...over,
});

const elementReading = (text: string): HTMLElement => {
  const nodes = [...globalThis.document.querySelectorAll("p, span, h2, h3, h4")];
  const found = nodes.find(
    (node) => (node.textContent ?? "").replace(/\s+/g, " ").trim() === text,
  );
  if (!found) throw new Error(`Nothing on the page reads "${text}".`);
  return found;
};

// Input renders its label without an htmlFor/id pair, so the label text is the only handle on the field.
const fieldFor = (labelText: string): HTMLInputElement => {
  const label = screen.getByText(labelText, { selector: "label" });
  const input = label.parentElement?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`No field beside "${labelText}".`);
  }
  return input;
};

// The card is the smallest element that holds both the bay number and the buttons under it.
const bayCard = (bayNumber: string): HTMLElement => {
  let node: HTMLElement | null = screen.getByText(bayNumber).parentElement;
  while (node && !node.querySelector("button")) node = node.parentElement;
  if (!node) throw new Error(`No card for bay ${bayNumber}.`);
  return node;
};

// The side panel is the one place a bay's state is read again before it is changed.
const bayPanel = (): HTMLElement => {
  const panel = globalThis.document.querySelector("aside");
  if (!panel) throw new Error("No bay panel on the page.");
  return panel as HTMLElement;
};

const renderBoard = (facilityId = FACILITY_ID): void => {
  render(
    <MemoryRouter initialEntries={[`/facilities/${facilityId}/slots`]}>
      <Routes>
        <Route path="/facilities" element={<p>properties list</p>} />
        <Route path="/facilities/:facilityId/slots" element={<SlotManagementPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

// The board arrives on a read of its own, so a test waits for the bays before touching them.
const openBoard = async (facilityId = FACILITY_ID): Promise<void> => {
  renderBoard(facilityId);
  await screen.findByText("A-01");
};

const openStateForm = async (bayNumber: string): Promise<HTMLElement> => {
  fireEvent.click(
    within(bayCard(bayNumber)).getByRole("button", { name: "Change state" }),
  );
  return screen.findByRole("dialog", { name: `Change bay ${bayNumber}` });
};

const stateSelect = (): HTMLSelectElement =>
  screen.getByLabelText(/^New state/) as HTMLSelectElement;

beforeEach(() => {
  parking.getMyFacilities.mockResolvedValue([owned(FACILITY_ID, "Galle Road Parking")]);
  slots.getBoard.mockResolvedValue(board(ALL_BAYS));
  slots.getSlot.mockImplementation((slotId: string) => {
    const row = ALL_BAYS.find((item) => item.slotId === slotId) ?? bay();
    return Promise.resolve({
      slot: row,
      upcoming: row.current ? [row.current] : [],
      history: [],
    });
  });
  slots.updateSlotStatus.mockResolvedValue(
    bay({ status: "MAINTENANCE", effectiveStatus: "MAINTENANCE", bookable: false }),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("provider bay board", () => {
  it("reads the property in the address through the owner endpoint and counts what the server derived", async () => {
    await openBoard();

    expect(screen.getByText("Galle Road Parking")).toBeTruthy();
    await waitFor(() => expect(slots.getBoard).toHaveBeenCalled());
    expect(slots.getBoard.mock.calls[0][0]).toBe(FACILITY_ID);
    expect(slots.getBoard.mock.calls[0][1]).toEqual({
      vehicleTypeId: undefined,
      status: undefined,
      from: undefined,
      to: undefined,
    });

    expect(screen.getByText("3 bays · 1 available · 1 awaiting payment · 1 occupied")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Car · 4.5 m × 2.5 m" })).toBeTruthy();
    expect(elementReading("1 of 3 free")).toBeTruthy();
  });

  it("names a bay holding an unpaid booking as awaiting payment, never as reserved", async () => {
    await openBoard();

    expect(within(bayCard("A-01")).getByText("Available")).toBeTruthy();
    expect(within(bayCard("A-02")).getByText("Awaiting payment")).toBeTruthy();
    expect(within(bayCard("A-03")).getByText("Occupied")).toBeTruthy();
    // A derived state is never stamped by hand, and no card borrows a word the server did not send.
    expect(within(bayCard("A-02")).queryByText("Reserved")).toBeNull();
    expect(within(bayCard("A-02")).queryByText("PENDING")).toBeNull();
    expect(within(bayCard("A-03")).queryByText("RESERVED")).toBeNull();

    // The bay whose fee has not settled is held for one driver's window, not free.
    expect(within(bayCard("A-02")).getByText("Nimal Perera")).toBeTruthy();
    expect(within(bayCard("A-03")).getByText("Amara Silva")).toBeTruthy();
    expect(screen.getAllByText("Free for the period you are looking at.")).toHaveLength(1);
    expect(
      within(bayCard("A-02"))
        .getByText("Awaiting payment")
        .getAttribute("title"),
    ).toBe(
      "The booking fee has not settled, so this bay is held for that booking's window only. It becomes Reserved once the fee is paid.",
    );
  });

  it("opens one bay on its own read instead of repeating the card", async () => {
    await openBoard();

    fireEvent.click(within(bayCard("A-02")).getByRole("button", { name: "Details" }));

    await waitFor(() => expect(slots.getSlot).toHaveBeenCalledWith(BAY_2));
    await waitFor(() => expect(elementReading("Bay A-02")).toBeTruthy());
    expect(within(bayPanel()).getByText("Awaiting payment")).toBeTruthy();

    fireEvent.click(within(bayPanel()).getByRole("button", { name: "Close" }));
    expect(
      await within(bayPanel()).findByText(
        "Pick a bay to see its state and the period it is held for.",
      ),
    ).toBeTruthy();
  });

  it("sends the state the owner picked together with the note that stays on the bay", async () => {
    await openBoard();
    await openStateForm("A-01");

    // The bay's own state is no choice at all, so only the two moves the owner can make are offered.
    expect([...stateSelect().options].map((option) => option.text)).toEqual([
      "Maintenance",
      "Retire this bay",
    ]);
    expect(stateSelect().value).toBe("MAINTENANCE");
    expect(
      screen.getByText(
        "Drivers stop being shown the bay. A booking that has not ended has to move or be cancelled first.",
      ),
    ).toBeTruthy();

    fireEvent.change(fieldFor("Note (optional)"), {
      target: { value: "  Cracked slab, resealing on Tuesday.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save bay" }));

    await waitFor(() =>
      expect(slots.updateSlotStatus).toHaveBeenCalledWith(BAY_1, {
        status: "MAINTENANCE",
        reason: "Cracked slab, resealing on Tuesday.",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(slots.getBoard).toHaveBeenCalledTimes(2);
  });

  it("will not let the owner mark a bay reserved or occupied by hand", async () => {
    await openBoard();
    const dialog = await openStateForm("A-03");

    expect(dialog.textContent).toContain("This bay reads as Occupied.");
    expect(dialog.textContent).toContain(
      "A booking decides this bay's state while it is on the calendar.",
    );
    expect(screen.queryByLabelText(/^New state/)).toBeNull();
    expect((screen.getByRole("button", { name: "Save bay" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save bay" }));
    expect(slots.updateSlotStatus).not.toHaveBeenCalled();
  });

  it("only lets a bay a driver is still sitting on come back into service", async () => {
    slots.getBoard.mockResolvedValue(
      board([
        bay({
          status: "MAINTENANCE",
          effectiveStatus: "MAINTENANCE",
          bookable: false,
          current: AWAITING.current,
        }),
      ]),
    );
    await openBoard();
    await openStateForm("A-01");

    expect([...stateSelect().options].map((option) => option.text)).toEqual([
      "Back in service",
      "Retire this bay",
    ]);

    fireEvent.change(stateSelect(), { target: { value: "DISABLED" } });
    expect(
      elementReading(
        "Nimal Perera has a booking here that has not ended. Move or cancel it before taking this bay out of service.",
      ),
    ).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save bay" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save bay" }));
    expect(slots.updateSlotStatus).not.toHaveBeenCalled();

    fireEvent.change(stateSelect(), { target: { value: "AVAILABLE" } });
    expect(screen.queryByText(/has a booking here that has not ended/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save bay" }));

    await waitFor(() =>
      expect(slots.updateSlotStatus).toHaveBeenCalledWith(BAY_1, {
        status: "AVAILABLE",
        reason: undefined,
      }),
    );
  });

  it("keeps the bay open on the form when the platform refuses the change", async () => {
    slots.updateSlotStatus.mockRejectedValue({
      response: {
        status: 409,
        data: { message: "This bay is held by a booking that has not ended." },
      },
    });
    await openBoard();
    await openStateForm("A-01");

    fireEvent.click(screen.getByRole("button", { name: "Save bay" }));

    const dialog = await screen.findByRole("dialog", { name: "Change bay A-01" });
    expect(dialog.textContent).toContain("This bay is held by a booking that has not ended.");
    expect(slots.getBoard).toHaveBeenCalledTimes(2);
  });

  it("sends the filters the owner applies and none at all when they clear them", async () => {
    renderBoard();
    await screen.findByText("A-01");

    expect(screen.getByText("A period is optional. Left empty, every bay reads as it is right now."))
      .toBeTruthy();

    fireEvent.change(screen.getByLabelText(/^Vehicle type/), { target: { value: CAR } });
    fireEvent.change(screen.getByLabelText(/^Bay state/), { target: { value: "AVAILABLE" } });
    fireEvent.change(fieldFor("From"), { target: { value: "2026-10-06T09:00" } });
    fireEvent.change(fieldFor("To"), { target: { value: "2026-10-06T18:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => expect(slots.getBoard).toHaveBeenCalledTimes(2));
    expect(slots.getBoard.mock.calls[1][1]).toEqual({
      vehicleTypeId: CAR,
      status: "AVAILABLE",
      from: new Date("2026-10-06T09:00").toISOString(),
      to: new Date("2026-10-06T18:00").toISOString(),
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(slots.getBoard).toHaveBeenCalledTimes(3));
    expect(slots.getBoard.mock.calls[2][1]).toEqual({
      vehicleTypeId: undefined,
      status: undefined,
      from: undefined,
      to: undefined,
    });
    expect(fieldFor("From").value).toBe("");
  });

  it("says so when no bay survives the filters", async () => {
    slots.getBoard.mockResolvedValue(
      board([], { counts: counts({ total: 0, available: 0, pending: 0, occupied: 0 }) }),
    );
    renderBoard();

    expect(
      await screen.findByText(
        "No bay matches these filters. Clear them, or add bays to this property from its layout.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("0 bays · 0 available")).toBeTruthy();
  });

  it("shows its own reason when the board cannot be read at all", async () => {
    slots.getBoard.mockRejectedValue({});
    renderBoard();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Failed to load your bays.");
    expect(screen.getByRole("heading", { name: "Bays" })).toBeTruthy();
  });

  it("moves the board to another property without leaving this one's bay in the panel", async () => {
    parking.getMyFacilities.mockResolvedValue([
      owned(FACILITY_ID, "Galle Road Parking"),
      owned(OTHER_FACILITY_ID, "Fort Street Lot"),
    ]);
    await openBoard();

    fireEvent.click(within(bayCard("A-02")).getByRole("button", { name: "Details" }));
    await waitFor(() => expect(slots.getSlot).toHaveBeenCalledWith(BAY_2));
    await screen.findByText("Bay A-02");

    fireEvent.change(screen.getByLabelText(/^Show bays of/), {
      target: { value: OTHER_FACILITY_ID },
    });

    await waitFor(() => expect(slots.getBoard.mock.calls.at(-1)?.[0]).toBe(OTHER_FACILITY_ID));
    expect(
      within(bayPanel()).getByText("Pick a bay to see its state and the period it is held for."),
    ).toBeTruthy();
  });
});
