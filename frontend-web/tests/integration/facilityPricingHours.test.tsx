// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import FacilitySetupPage from "../../src/pages/provider/FacilitySetupPage";
import ParkingListPage from "../../src/pages/provider/ParkingListPage";
import type {
  FacilityAllocation,
  ParkingFacility,
  VehicleTypeOption,
} from "../../src/features/parking/types/parkingTypes";

const api = vi.hoisted(() => ({
  getMyFacilities: vi.fn(),
  getDocuments: vi.fn(),
  getRegistrationOptions: vi.fn(),
  updateFacility: vi.fn(),
  saveAllocations: vi.fn(),
  submitForReview: vi.fn(),
}));

vi.mock("../../src/features/parking/api/parkingApi", () => ({ parkingApi: api }));

const FACILITY_ID = "11111111-1111-1111-1111-111111111111";
const CAR = "aaaaaaaa-0000-0000-0000-000000000001";
const JEEP = "aaaaaaaa-0000-0000-0000-000000000002";
const VAN = "aaaaaaaa-0000-0000-0000-000000000003";
const BUS = "aaaaaaaa-0000-0000-0000-000000000004";

const vehicleType = (over: Partial<VehicleTypeOption> = {}): VehicleTypeOption => ({
  id: CAR,
  name: "Car",
  code: "CAR",
  sortOrder: 1,
  bayLengthMeters: 4.5,
  bayWidthMeters: 2.5,
  minPrice: 100,
  maxPrice: 900,
  commissionRate: 10,
  ...over,
});

// One priced-and-sized type, one the admin never priced, one without a bay, one usable but pricey.
const TYPES: VehicleTypeOption[] = [
  vehicleType(),
  vehicleType({
    id: JEEP,
    name: "Jeep",
    code: "JEEP",
    sortOrder: 2,
    bayLengthMeters: 5,
    bayWidthMeters: 2.7,
    minPrice: 300,
    maxPrice: 1500,
    commissionRate: 12,
  }),
  vehicleType({
    id: VAN,
    name: "Van",
    code: "VAN",
    sortOrder: 3,
    minPrice: null,
    maxPrice: null,
    commissionRate: null,
  }),
  vehicleType({
    id: BUS,
    name: "Bus",
    code: "BUS",
    sortOrder: 4,
    bayLengthMeters: null,
    bayWidthMeters: null,
    minPrice: 500,
    maxPrice: 3000,
    commissionRate: 15,
  }),
];

const allocation = (over: Partial<FacilityAllocation> = {}): FacilityAllocation => ({
  vehicleTypeId: CAR,
  vehicleTypeName: "Car",
  vehicleTypeCode: "CAR",
  bayLengthMeters: 4.5,
  bayWidthMeters: 2.5,
  numberOfSlots: 20,
  hourlyRate: 400,
  commissionRate: 10,
  ...over,
});

const facility = (over: Partial<ParkingFacility> = {}): ParkingFacility => ({
  facilityId: FACILITY_ID,
  providerId: "22222222-2222-2222-2222-222222222222",
  name: "Galle Road Parking",
  address: "No 123, Galle Road",
  city: "Colombo",
  province: "Western",
  district: "Colombo",
  latitude: 6.9271,
  longitude: 79.8612,
  distanceKm: null,
  landAreaPerches: 15.5,
  openingTime: "08:00:00",
  closingTime: "20:00:00",
  hasEvCharging: false,
  status: "DRAFT",
  slotCount: 0,
  documents: [],
  documentsComplete: false,
  documentRequirements: [],
  sections: [],
  allocations: [],
  slotGroups: [],
  missingRequirements: [],
  readyForSubmission: false,
  isEditable: true,
  rejectionReason: null,
  submittedAt: null,
  reviewedAt: null,
  createdAt: "2026-09-22T00:00:00Z",
  updatedAt: "2026-09-22T00:00:00Z",
  ...over,
});

// An approved, bookable property: the only state whose card offers live retuning.
const live = (over: Partial<ParkingFacility> = {}): ParkingFacility =>
  facility({
    status: "APPROVED",
    slotCount: 20,
    readyForSubmission: false,
    documentsComplete: true,
    allocations: [allocation()],
    ...over,
  });

// Input renders its label without an htmlFor/id pair, so the label text is the only handle on the field.
const fieldFor = (labelText: string): HTMLInputElement => {
  const label = screen.getByText(labelText, { selector: "label" });
  const input = label.parentElement?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`No field beside "${labelText}".`);
  }
  return input;
};

const checkboxFor = (typeName: string): HTMLInputElement => {
  const box = screen.getByRole("checkbox", { name: new RegExp(`^${typeName}`) });
  if (!(box instanceof HTMLInputElement)) throw new Error(`"${typeName}" is not a tick box.`);
  return box;
};

// Each layout row holds its own "Slots" and "Your price per hour (LKR)" fields, so they are reached through the row.
const fieldIn = (typeName: string, labelText: string): HTMLInputElement => {
  const row = checkboxFor(typeName).closest("li");
  const label = [...(row?.querySelectorAll("label") ?? [])].find(
    (element) => element.textContent?.trim() === labelText,
  );
  const input = label?.parentElement?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`The ${typeName} row has no "${labelText}" field.`);
  }
  return input;
};

// Readings built from several JSX expressions only match on the whole element's text.
const elementReading = (text: string): HTMLElement => {
  const nodes = [...globalThis.document.querySelectorAll<HTMLElement>("p, span")];
  const found = nodes.find((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim() === text);
  if (!found) throw new Error(`Nothing on the page reads "${text}".`);
  return found;
};

const openLayout = async (current: ParkingFacility): Promise<void> => {
  api.getMyFacilities.mockResolvedValue([current]);
  render(
    <MemoryRouter initialEntries={[`/facilities/${FACILITY_ID}/setup`]}>
      <Routes>
        <Route path="/facilities" element={<p>properties list</p>} />
        <Route path="/facilities/:facilityId/setup" element={<FacilitySetupPage />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole("tab", { name: "Vehicle types & pricing" }));
  await screen.findByRole("checkbox", { name: /^Car/ });
};

const openCard = async (current: ParkingFacility): Promise<void> => {
  api.getMyFacilities.mockResolvedValue([current]);
  render(
    <MemoryRouter initialEntries={["/facilities"]}>
      <Routes>
        <Route path="/facilities" element={<ParkingListPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText(current.name);
};

const refuse = (message: string): { response: { status: number; data: { message: string } } } => ({
  response: { status: 400, data: { message } },
});

beforeEach(() => {
  api.getMyFacilities.mockResolvedValue([]);
  api.getDocuments.mockResolvedValue([]);
  api.getRegistrationOptions.mockResolvedValue({ vehicleTypes: TYPES });
  api.submitForReview.mockResolvedValue(undefined);
  // A PUT of the layout answers with the property, so the card keeps its panel after saving prices.
  api.saveAllocations.mockResolvedValue(live());
  api.updateFacility.mockImplementation((id: string, input: object) =>
    Promise.resolve(live({ facilityId: id, ...(input as object) })),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("vehicle types and pricing layout tab", () => {
  it("offers only the types the admin has both priced and sized, read from the registration options", async () => {
    await openLayout(facility());

    expect(api.getRegistrationOptions).toHaveBeenCalledTimes(1);
    expect(checkboxFor("Car").disabled).toBe(false);
    expect(screen.getByText("Allowed: 100 - 900 per hour")).toBeTruthy();
    expect(screen.getByText("Allowed: 300 - 1500 per hour")).toBeTruthy();
    expect(checkboxFor("Van").disabled).toBe(true);
    expect(screen.getByText("The admin has not set pricing for this type yet.")).toBeTruthy();
    expect(checkboxFor("Bus").disabled).toBe(true);
    expect(screen.getByText("The admin has not set this type's bay size yet.")).toBeTruthy();
    expect(elementReading("0 vehicle types · 0 slots")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save layout" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("saves the ticked types with their bay counts and rates through the allocations endpoint, then re-reads the property", async () => {
    await openLayout(facility());

    fireEvent.click(checkboxFor("Car"));
    expect(elementReading("Standard bay (set by the system)")).toBeTruthy();
    expect(screen.getByText("4.5 m × 2.5 m")).toBeTruthy();
    expect(elementReading("Every car slot here is built to this size.")).toBeTruthy();
    expect(screen.getByText("Enter a price to see your share.")).toBeTruthy();
    expect(elementReading("1 vehicle type · 1 slot")).toBeTruthy();

    fireEvent.change(fieldIn("Car", "Slots"), { target: { value: "20" } });
    fireEvent.change(fieldIn("Car", "Your price per hour (LKR)"), { target: { value: "400" } });
    expect(elementReading("40 LKR to the platform · you keep 360 LKR")).toBeTruthy();
    expect(elementReading("1 vehicle type · 20 slots")).toBeTruthy();

    fireEvent.click(checkboxFor("Jeep"));
    fireEvent.change(fieldIn("Jeep", "Slots"), { target: { value: "5" } });
    fireEvent.change(fieldIn("Jeep", "Your price per hour (LKR)"), { target: { value: "700" } });
    expect(elementReading("2 vehicle types · 25 slots")).toBeTruthy();
    expect(screen.getAllByText("Commission (set by the admin)")).toHaveLength(2);
    expect(screen.getByText("12%")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Save layout" }));

    await waitFor(() => expect(api.saveAllocations).toHaveBeenCalledTimes(1));
    expect(api.saveAllocations.mock.calls[0]).toEqual([
      FACILITY_ID,
      [
        { vehicleTypeId: CAR, numberOfSlots: 20, hourlyRate: 400 },
        { vehicleTypeId: JEEP, numberOfSlots: 5, hourlyRate: 700 },
      ],
    ]);
    expect(api.getMyFacilities).toHaveBeenCalledTimes(2);
    expect(api.updateFacility).not.toHaveBeenCalled();
  });

  it("refuses a rate the admin's window does not allow before the server is asked", async () => {
    await openLayout(facility());

    fireEvent.click(checkboxFor("Car"));
    fireEvent.click(screen.getByRole("button", { name: "Save layout" }));
    expect(await screen.findByText("Hourly rate must be greater than 0.")).toBeTruthy();

    fireEvent.change(fieldIn("Car", "Your price per hour (LKR)"), { target: { value: "50" } });
    expect(screen.getByText("Must be at least 100 LKR.")).toBeTruthy();
    expect(screen.queryByText("Hourly rate must be greater than 0.")).toBeNull();

    fireEvent.change(fieldIn("Car", "Your price per hour (LKR)"), { target: { value: "5000" } });
    expect(screen.getByText("Must be at most 900 LKR.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Save layout" }));
    expect(api.saveAllocations).not.toHaveBeenCalled();
  });

  it("counts the ceiling across the whole property, so 500 bays still fit and 600 do not", async () => {
    await openLayout(facility());

    fireEvent.click(checkboxFor("Car"));
    fireEvent.click(checkboxFor("Jeep"));
    fireEvent.change(fieldIn("Car", "Your price per hour (LKR)"), { target: { value: "400" } });
    fireEvent.change(fieldIn("Jeep", "Your price per hour (LKR)"), { target: { value: "700" } });

    fireEvent.change(fieldIn("Car", "Slots"), { target: { value: "400" } });
    fireEvent.change(fieldIn("Jeep", "Slots"), { target: { value: "200" } });
    expect(elementReading("2 vehicle types · 600 slots")).toBeTruthy();
    expect(screen.getAllByText("A property can have at most 500 slots.")).toHaveLength(2);

    fireEvent.change(fieldIn("Jeep", "Slots"), { target: { value: "100" } });
    // A field error fades out through framer-motion, so its node only leaves the DOM on the next frame.
    await waitFor(() =>
      expect(screen.queryByText("A property can have at most 500 slots.")).toBeNull(),
    );
    expect(elementReading("2 vehicle types · 500 slots")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Save layout" }));
    await waitFor(() => expect(api.saveAllocations).toHaveBeenCalled());
    expect(api.saveAllocations.mock.calls[0][1]).toEqual([
      { vehicleTypeId: CAR, numberOfSlots: 400, hourlyRate: 400 },
      { vehicleTypeId: JEEP, numberOfSlots: 100, hourlyRate: 700 },
    ]);
  });

  it("warns that a live property's layout change goes back to the admin, yet saves without submitting", async () => {
    await openLayout(live({ allocations: [allocation()] }));

    expect(
      elementReading(
        "Saving a new price keeps this property live. Adding or removing a vehicle type, or changing a slot count, rebuilds the slot list and sends it back to the admin queue.",
      ),
    ).toBeTruthy();

    // Existing allocations come back pre-ticked, so the draft starts from what the server holds.
    expect(checkboxFor("Car").checked).toBe(true);
    expect(fieldIn("Car", "Slots").value).toBe("20");
    expect(fieldIn("Car", "Your price per hour (LKR)").value).toBe("400");

    fireEvent.click(screen.getByRole("button", { name: "Save & send for review" }));
    await waitFor(() => expect(api.saveAllocations).toHaveBeenCalled());
    expect(api.submitForReview).not.toHaveBeenCalled();
  });

  it("keeps every field shut while an admin is deciding the property", async () => {
    await openLayout(
      facility({ status: "PENDING_APPROVAL", isEditable: false, allocations: [allocation()] }),
    );

    expect(checkboxFor("Car").disabled).toBe(true);
    expect(fieldIn("Car", "Slots").disabled).toBe(true);
    expect(fieldIn("Car", "Your price per hour (LKR)").disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Save layout" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.click(checkboxFor("Van"));
    expect(api.saveAllocations).not.toHaveBeenCalled();
  });

  it("carries the server's refusal of a layout back onto the tab without re-reading", async () => {
    api.saveAllocations.mockRejectedValue(
      refuse("A bay size must be set for every vehicle type you allocate."),
    );
    await openLayout(facility());

    fireEvent.click(checkboxFor("Car"));
    fireEvent.change(fieldIn("Car", "Your price per hour (LKR)"), { target: { value: "400" } });
    fireEvent.click(screen.getByRole("button", { name: "Save layout" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "A bay size must be set for every vehicle type you allocate.",
    );
    expect(api.getMyFacilities).toHaveBeenCalledTimes(1);
  });

  it("says plainly when the vehicle types could not be read, and offers no list", async () => {
    api.getRegistrationOptions.mockRejectedValue({});
    api.getMyFacilities.mockResolvedValue([facility()]);

    render(
      <MemoryRouter initialEntries={[`/facilities/${FACILITY_ID}/setup`]}>
        <Routes>
          <Route path="/facilities" element={<p>properties list</p>} />
          <Route path="/facilities/:facilityId/setup" element={<FacilitySetupPage />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole("tab", { name: "Vehicle types & pricing" }));

    expect(await screen.findByText("Failed to load the vehicle types.")).toBeTruthy();
    expect(
      elementReading(
        "The vehicle types could not be read, so no list is shown below. Reload this page to try again.",
      ),
    ).toBeTruthy();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});

describe("live pricing and operating hours on the property card", () => {
  it("keeps the retuning panel off a property the drivers cannot book yet", async () => {
    await openCard(facility({ status: "DRAFT", slotCount: 20, allocations: [allocation()] }));

    expect(screen.queryByText("Pricing & operating hours")).toBeNull();
    expect(screen.getByText("08:00 - 20:00")).toBeTruthy();
  });

  it("shows the saved hours and one price per allocated type, with its bay count and window", async () => {
    await openCard(live());

    expect(screen.getByText("Pricing & operating hours")).toBeTruthy();
    expect(
      screen.getByText("Both apply as soon as you save, and this property stays live and bookable."),
    ).toBeTruthy();
    expect(fieldFor("Opens at").value).toBe("08:00");
    expect(fieldFor("Closes at").value).toBe("20:00");
    expect(fieldFor("Car per hour (LKR)").value).toBe("400");
    expect(elementReading("20 bays · Allowed: 100 - 900 per hour")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save hours" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByRole("button", { name: "Save prices" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("re-sends the whole property when only the opening time moved, leaving the layout alone", async () => {
    await openCard(live());

    fireEvent.change(fieldFor("Opens at"), { target: { value: "07:00" } });
    expect((screen.getByRole("button", { name: "Save hours" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save hours" }));

    await waitFor(() => expect(api.updateFacility).toHaveBeenCalled());
    expect(api.updateFacility.mock.calls[0]).toEqual([
      FACILITY_ID,
      {
        name: "Galle Road Parking",
        address: "No 123, Galle Road",
        city: "Colombo",
        province: "Western",
        district: "Colombo",
        latitude: 6.9271,
        longitude: 79.8612,
        landAreaPerches: 15.5,
        openingTime: "07:00:00",
        closingTime: "20:00:00",
        hasEvCharging: false,
      },
    ]);
    expect(api.saveAllocations).not.toHaveBeenCalled();
  });

  it("refuses an empty or backwards time pair before the server sees it", async () => {
    await openCard(live());

    fireEvent.change(fieldFor("Closes at"), { target: { value: "" } });
    expect(await screen.findByText("Enter both an opening and a closing time.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save hours" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.change(fieldFor("Closes at"), { target: { value: "06:00" } });
    expect(screen.getByText("Closing time must be later than opening time.")).toBeTruthy();
    expect(api.updateFacility).not.toHaveBeenCalled();
  });

  it("prices one type on its own, carrying its bay count along untouched", async () => {
    await openCard(live({ allocations: [allocation(), allocation({ vehicleTypeId: JEEP, vehicleTypeName: "Jeep", numberOfSlots: 3, hourlyRate: 700, commissionRate: 12 })] }));

    fireEvent.change(fieldFor("Car per hour (LKR)"), { target: { value: "500" } });
    expect((screen.getByRole("button", { name: "Save prices" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save prices" }));

    await waitFor(() => expect(api.saveAllocations).toHaveBeenCalled());
    expect(api.saveAllocations.mock.calls[0]).toEqual([
      FACILITY_ID,
      [
        { vehicleTypeId: CAR, numberOfSlots: 20, hourlyRate: 500 },
        { vehicleTypeId: JEEP, numberOfSlots: 3, hourlyRate: 700 },
      ],
    ]);
    expect(api.updateFacility).not.toHaveBeenCalled();
    expect(screen.queryByText("Pricing & operating hours")).toBeTruthy();
  });

  it("reports the server's reason twice when the new hours are refused", async () => {
    api.updateFacility.mockRejectedValue(refuse("Operating hours must cover the booked bays."));
    await openCard(live());

    fireEvent.change(fieldFor("Opens at"), { target: { value: "07:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Save hours" }));

    expect(
      await screen.findByText("Operating hours must cover the booked bays."),
    ).toBeTruthy();
    expect(
      await screen.findByText("Not saved — the reason is shown above your property list."),
    ).toBeTruthy();
    expect(fieldFor("Opens at").value).toBe("07:00");
  });
});
