// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import FacilitySetupPage from "../../src/pages/provider/FacilitySetupPage";
import ParkingCreatePage from "../../src/pages/provider/ParkingCreatePage";
import ParkingListPage from "../../src/pages/provider/ParkingListPage";
import type {
  FacilitySectionReview,
  ParkingFacility,
} from "../../src/features/parking/types/parkingTypes";

const api = vi.hoisted(() => ({
  getMyFacilities: vi.fn(),
  getDocuments: vi.fn(),
  getRegistrationOptions: vi.fn(),
  createFacility: vi.fn(),
  updateFacility: vi.fn(),
  deleteFacility: vi.fn(),
  saveAllocations: vi.fn(),
  submitForReview: vi.fn(),
}));

vi.mock("../../src/features/parking/api/parkingApi", () => ({ parkingApi: api }));

const FACILITY_ID = "11111111-1111-1111-1111-111111111111";

const section = (over: Partial<FacilitySectionReview> = {}): FacilitySectionReview => ({
  section: "BASIC_INFORMATION",
  label: "Basic information",
  description: "",
  status: "PENDING",
  remarks: null,
  reviewedBy: null,
  reviewedAt: null,
  missingRequirements: [],
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
  slotCount: 12,
  documents: [],
  documentsComplete: false,
  documentRequirements: [],
  sections: [],
  allocations: [],
  slotGroups: [],
  missingRequirements: [],
  readyForSubmission: true,
  isEditable: true,
  rejectionReason: null,
  submittedAt: null,
  reviewedAt: null,
  createdAt: "2026-09-22T00:00:00Z",
  updatedAt: "2026-09-22T00:00:00Z",
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

const LocationProbe: React.FC = () => {
  const { pathname } = useLocation();
  return <p data-testid="path">{pathname}</p>;
};

const renderList = () =>
  render(
    <MemoryRouter initialEntries={["/facilities"]}>
      <Routes>
        <Route path="/facilities" element={<ParkingListPage />} />
      </Routes>
    </MemoryRouter>,
  );

const openWizard = (current: ParkingFacility) => {
  api.getMyFacilities.mockResolvedValue([current]);
  return render(
    <MemoryRouter initialEntries={[`/facilities/${FACILITY_ID}/setup`]}>
      <Routes>
        <Route path="/facilities" element={<p>properties list</p>} />
        <Route path="/facilities/:facilityId/setup" element={<FacilitySetupPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

const goToTab = async (name: string): Promise<void> => {
  fireEvent.click(await screen.findByRole("tab", { name }));
};

beforeEach(() => {
  api.getMyFacilities.mockResolvedValue([]);
  api.getDocuments.mockResolvedValue([]);
  api.getRegistrationOptions.mockResolvedValue({ vehicleTypes: [] });
  api.deleteFacility.mockResolvedValue(undefined);
  api.submitForReview.mockResolvedValue(undefined);
  api.saveAllocations.mockResolvedValue(undefined);
  api.updateFacility.mockImplementation((id: string, input: object) =>
    Promise.resolve(facility({ facilityId: id, ...input })),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("provider property list", () => {
  it("lists every property the owner holds with what it still owes", async () => {
    api.getMyFacilities.mockResolvedValue([
      facility({ name: "Fort Street Lot", missingRequirements: ["4 property photos"] }),
      facility({
        facilityId: "33333333-3333-3333-3333-333333333333",
        name: "Kandy Road Yard",
        address: "No 5, Kandy Road",
        status: "PENDING_APPROVAL",
        isEditable: false,
        missingRequirements: [],
      }),
    ]);

    renderList();

    expect(await screen.findByText("Fort Street Lot")).toBeTruthy();
    expect(screen.getByText("Kandy Road Yard")).toBeTruthy();
    expect(screen.getByText("Still needed: 4 property photos.")).toBeTruthy();
    expect(screen.getByText("No 123, Galle Road")).toBeTruthy();
    expect(screen.getAllByText("Colombo, Western Province").length).toBe(2);
  });

  // Defect pinned: components/ParkingStatusBadge.tsx prints the raw enum instead of utils/parkingUtils STATUS_LABEL.
  it("shows the stored status value on the badge rather than the wording the utils file defines", async () => {
    api.getMyFacilities.mockResolvedValue([facility({ status: "PENDING_APPROVAL" })]);

    renderList();

    expect(await screen.findByText("PENDING_APPROVAL")).toBeTruthy();
    expect(screen.queryByText("Pending admin review")).toBeNull();
  });

  it("asks before deleting and then deletes the property it named", async () => {
    api.getMyFacilities.mockResolvedValue([facility()]);

    renderList();

    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(
      await screen.findByText("Delete “Galle Road Parking”?"),
    ).toBeTruthy();
    expect(api.deleteFacility).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete property" }));
    await waitFor(() => expect(api.deleteFacility).toHaveBeenCalledWith(FACILITY_ID));
  });
});

describe("property registration wizard", () => {
  it("opens on the five steps the admin approves one at a time", async () => {
    openWizard(facility());

    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Basic information",
      "Property location",
      "Documents & photos",
      "Vehicle types & pricing",
      "Review & submit",
    ]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("saves the whole property from the details tab, with the times in the form the API takes", async () => {
    openWizard(facility());

    await screen.findByRole("tab", { name: "Basic information" });
    fireEvent.change(fieldFor("Property name"), { target: { value: "Fort Street Lot" } });
    fireEvent.change(fieldFor("Opening time"), { target: { value: "07:30" } });
    fireEvent.change(fieldFor("Closing time"), { target: { value: "22:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    await waitFor(() => expect(api.updateFacility).toHaveBeenCalled());
    const [id, input] = api.updateFacility.mock.calls[0];
    expect(id).toBe(FACILITY_ID);
    expect(input).toEqual({
      name: "Fort Street Lot",
      address: "No 123, Galle Road",
      city: "Colombo",
      province: "Western",
      district: "Colombo",
      landAreaPerches: 15.5,
      openingTime: "07:30:00",
      closingTime: "22:00:00",
      hasEvCharging: false,
      latitude: 6.9271,
      longitude: 79.8612,
    });
  });

  it("refuses a closing time that is not later than the opening time without asking the server", async () => {
    openWizard(facility());

    await screen.findByRole("tab", { name: "Basic information" });
    fireEvent.change(fieldFor("Closing time"), { target: { value: "07:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Save details" }));

    expect(await screen.findByText("Closing time must be later than opening time")).toBeTruthy();
    expect(api.updateFacility).not.toHaveBeenCalled();
  });

  it("locks a property the admin is still reading", async () => {
    openWizard(
      facility({
        status: "PENDING_APPROVAL",
        isEditable: false,
        readyForSubmission: false,
      }),
    );

    expect(
      await screen.findByText(
        "An admin is reviewing this property, so it is read-only here. You can change it again as soon as they have decided.",
      ),
    ).toBeTruthy();
    expect(fieldFor("Property name").disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Save details" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    goToTab("Review & submit");
    await waitFor(() =>
      expect(
        (screen.getByRole("button", { name: "Submit for admin review" }) as HTMLButtonElement)
          .disabled,
      ).toBe(true),
    );
  });

  // Cosmetic label pinned on purpose: "Save & send for review" only PUTs the property. Real submission
  // is the Review tab's POST /parkingFacilities/{id}/submit, which this asserts is never reached by saving.
  it("saves an approved property under a label that promises a review it does not start", async () => {
    openWizard(facility({ status: "APPROVED" }));

    await screen.findByRole("tab", { name: "Basic information" });
    const button = screen.getByRole("button", { name: "Save & send for review" });
    fireEvent.click(button);

    await waitFor(() => expect(api.updateFacility).toHaveBeenCalled());
    expect(api.submitForReview).not.toHaveBeenCalled();
  });

  it("shows each section's own verdict on the review tab and submits through the submit endpoint", async () => {
    openWizard(
      facility({
        sections: [
          section({ status: "NOT_SUBMITTED" }),
          section({ section: "PROPERTY_LOCATION", label: "Property location", status: "PENDING" }),
          section({ section: "DOCUMENTS", label: "Documents and photos", status: "APPROVED" }),
          section({
            section: "PRICING",
            label: "Vehicle types and pricing",
            status: "REJECTED",
            remarks: "The van rate is above the allowed window.",
          }),
        ],
      }),
    );

    goToTab("Review & submit");

    expect(await screen.findByText("Awaiting admin")).toBeTruthy();
    expect(screen.getByText("Not submitted")).toBeTruthy();
    expect(screen.getByText("Approved")).toBeTruthy();
    expect(screen.getByText("Needs fixing")).toBeTruthy();
    expect(
      screen.getByText("Admin: The van rate is above the allowed window."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Submit for admin review" }));
    await waitFor(() => expect(api.submitForReview).toHaveBeenCalledWith(FACILITY_ID));
    expect(api.updateFacility).not.toHaveBeenCalled();
  });

  it("carries the server's refusal to submit back onto the review tab", async () => {
    api.submitForReview.mockRejectedValue({
      response: { status: 400, data: { message: "Enter the property location before submitting." } },
    });
    openWizard(facility());

    goToTab("Review & submit");
    fireEvent.click(await screen.findByRole("button", { name: "Submit for admin review" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Enter the property location before submitting.");
  });
});

describe("registering a new property", () => {
  it("creates the draft with trimmed text and whole-second times, then hands over to its wizard", async () => {
    api.createFacility.mockResolvedValue(facility({ name: "Nugegala Street Lot" }));

    render(
      <MemoryRouter initialEntries={["/facilities/new"]}>
        <Routes>
          <Route path="/facilities/new" element={<ParkingCreatePage />} />
          <Route path="/facilities/:facilityId/setup" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(fieldFor("Property name"), { target: { value: "  Nugegala Street Lot " } });
    fireEvent.change(fieldFor("Address"), { target: { value: "No 43, Kandy Road" } });
    fireEvent.change(fieldFor("City"), { target: { value: "Nugegoda" } });
    fireEvent.change(screen.getByLabelText(/^Province/), { target: { value: "Western" } });
    fireEvent.change(screen.getByLabelText(/^District/), { target: { value: "Colombo" } });
    fireEvent.change(fieldFor("Land area (perches)"), { target: { value: "8" } });
    fireEvent.change(fieldFor("Opening time"), { target: { value: "06:00" } });
    fireEvent.change(fieldFor("Closing time"), { target: { value: "23:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Create property" }));

    await waitFor(() => expect(api.createFacility).toHaveBeenCalled());
    expect(api.createFacility.mock.calls[0][0]).toEqual({
      name: "Nugegala Street Lot",
      address: "No 43, Kandy Road",
      city: "Nugegoda",
      province: "Western",
      district: "Colombo",
      landAreaPerches: 8,
      openingTime: "06:00:00",
      closingTime: "23:30:00",
      hasEvCharging: false,
    });
    // The page navigates only after the create call comes back, so the probe mounts a commit later
    // than the recorded api call: waiting on it is the only way this does not depend on machine speed.
    const path = await screen.findByTestId("path");
    expect(path.textContent).toBe(`/facilities/${FACILITY_ID}/setup`);
  });
});
