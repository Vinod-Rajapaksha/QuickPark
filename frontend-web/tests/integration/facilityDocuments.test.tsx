// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import FacilitySetupPage from "../../src/pages/provider/FacilitySetupPage";
import FacilityDocumentTabs from "../../src/features/parking/components/FacilityDocumentTabs";
import FacilityReviewStep from "../../src/features/parking/components/FacilityReviewStep";
import type {
  DocumentRequirement,
  ParkingFacility,
  ParkingFacilityDocument,
} from "../../src/features/parking/types/parkingTypes";

const api = vi.hoisted(() => ({
  getMyFacilities: vi.fn(),
  getDocuments: vi.fn(),
  getRegistrationOptions: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

vi.mock("../../src/features/parking/api/parkingApi", () => ({ parkingApi: api }));

const FACILITY_ID = "11111111-1111-1111-1111-111111111111";

const requirement = (over: Partial<DocumentRequirement> = {}): DocumentRequirement => ({
  type: "VERIFIED_DEED",
  label: "Verified deed",
  count: 0,
  minRequired: 1,
  maxAllowed: 1,
  replacesExisting: true,
  satisfied: false,
  ...over,
});

// What the server sends as this property's document rules, in its own order.
const requirements = (photos: Partial<DocumentRequirement> = {}): DocumentRequirement[] => [
  requirement(),
  requirement({ type: "LAND_OWNER_NIC", label: "Land owner NIC" }),
  requirement({
    type: "PROPERTY_PHOTO",
    label: "Property photos",
    minRequired: 4,
    maxAllowed: 4,
    replacesExisting: false,
    ...photos,
  }),
  requirement({ type: "SLOT_SKETCH", label: "Slot sketch", replacesExisting: false }),
];

const proofDoc = (over: Partial<ParkingFacilityDocument> = {}): ParkingFacilityDocument => ({
  documentId: "doc-1",
  facilityId: FACILITY_ID,
  type: "VERIFIED_DEED",
  url: "https://storage.test/doc-1.png",
  fileName: "deed.png",
  contentType: "image/png",
  sizeBytes: 20480,
  uploadedAt: "2026-09-22T09:00:00Z",
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
  documentRequirements: requirements(),
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

const image = (name: string, type = "image/png", bytes = 1024): File =>
  new File([new Uint8Array(bytes)], name, { type });

const openDocuments = async (current: ParkingFacility): Promise<void> => {
  api.getMyFacilities.mockResolvedValue([current]);
  render(
    <MemoryRouter initialEntries={[`/facilities/${FACILITY_ID}/setup`]}>
      <Routes>
        <Route path="/facilities/:facilityId/setup" element={<FacilitySetupPage />} />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.click(await screen.findByRole("tab", { name: "Documents & photos" }));
};

// Only the open requirement renders its picker, so the id is looked up on the document, not the screen.
const fileInputFor = (type: string): HTMLInputElement | null => {
  const node = globalThis.document.getElementById(`document-file-${type}`);
  return node instanceof HTMLInputElement ? node : null;
};

const openTab = async (name: string): Promise<void> => {
  fireEvent.click(await screen.findByRole("tab", { name }));
};

beforeEach(() => {
  api.getMyFacilities.mockResolvedValue([]);
  api.getDocuments.mockResolvedValue([]);
  api.getRegistrationOptions.mockResolvedValue({ vehicleTypes: [] });
  api.deleteDocument.mockResolvedValue(undefined);
  api.uploadDocument.mockImplementation((_id: string, _type: string, file: File) =>
    Promise.resolve(proofDoc({ fileName: file.name })),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("property document tabs", () => {
  it("lists every requirement the admin set, with the number of images each one wants", async () => {
    await openDocuments(facility());

    expect(await screen.findByText("Deed image verified by a notary for this land.")).toBeTruthy();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Basic information",
      "Property location",
      "Documents & photos",
      "Vehicle types & pricing",
      "Review & submit",
      "Verified deed0/1",
      "Land owner NIC0/1",
      "Property photos0/4",
      "Slot sketch0/1",
    ]);
  });

  it("words the open requirement by how far it still falls short", async () => {
    await openDocuments(facility());

    expect(await screen.findByText("Required")).toBeTruthy();
    expect(screen.getByText("Nothing uploaded in this tab yet.")).toBeTruthy();

    await openTab("Property photos0/4");
    expect(screen.getByText("0 of 4 uploaded")).toBeTruthy();
    expect(
      screen.getByText(
        "Four clear photos of the property: the front, the entrance, the parking area and a street view.",
      ),
    ).toBeTruthy();
  });

  it("gives each requirement its own file input, and only while its tab is open", async () => {
    await openDocuments(facility());

    await screen.findByText("Deed image verified by a notary for this land.");
    expect(fileInputFor("VERIFIED_DEED")).toBeTruthy();
    expect(fileInputFor("SLOT_SKETCH")).toBeNull();
    expect(screen.getByText("Upload to Verified deed")).toBeTruthy();

    await openTab("Slot sketch0/1");
    expect(fileInputFor("SLOT_SKETCH")).toBeTruthy();
    expect(fileInputFor("VERIFIED_DEED")).toBeNull();
    expect(screen.getByText("Upload to Slot sketch")).toBeTruthy();
    expect(screen.getByText("Sketch of the parking layout showing how the slots are arranged.")).toBeTruthy();
  });

  it("sends the chosen image to the server for the type whose tab is open", async () => {
    await openDocuments(facility());

    const deed = image("deed.png");
    fireEvent.change(fileInputFor("VERIFIED_DEED")!, { target: { files: [deed] } });
    expect(await screen.findByText("Selected: deed.png (1.0 KB)")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    await waitFor(() =>
      expect(api.uploadDocument).toHaveBeenCalledWith(FACILITY_ID, "VERIFIED_DEED", deed),
    );
    expect(await screen.findByText("deed.png")).toBeTruthy();
    expect(screen.getByText(/20\.0 KB/)).toBeTruthy();
  });

  it("refuses an image the server would reject without asking it", async () => {
    await openDocuments(facility());

    fireEvent.change(fileInputFor("VERIFIED_DEED")!, {
      target: { files: [image("title-deed.pdf", "application/pdf")] },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Upload document" }));

    expect(await screen.findByText("Only JPG or PNG images are accepted.")).toBeTruthy();
    expect(api.uploadDocument).not.toHaveBeenCalled();
  });

  it("hides the picker once a type holds every image it allows", async () => {
    await openDocuments(
      facility({
        documentRequirements: [
          requirement({
            type: "PROPERTY_PHOTO",
            label: "Property photos",
            minRequired: 4,
            maxAllowed: 4,
            replacesExisting: false,
            count: 4,
            satisfied: true,
          }),
        ],
      }),
    );

    expect(await screen.findByText("Property photos is complete with 4 images. Delete one to replace it.")).toBeTruthy();
    expect(fileInputFor("PROPERTY_PHOTO")).toBeNull();
  });

  it("offers to replace the single image a replaceable type already holds", async () => {
    api.getDocuments.mockResolvedValue([proofDoc()]);
    await openDocuments(facility({ documentRequirements: [requirement({ count: 1, satisfied: true })] }));

    const progress = await screen.findByText(/uploading a new image replaces this one/);
    expect(progress.textContent).toBe("Uploaded — uploading a new image replaces this one.");
    expect(fileInputFor("VERIFIED_DEED")).toBeTruthy();
  });

  it("deletes the document the row names, by its own id", async () => {
    api.getDocuments.mockResolvedValue([proofDoc({ documentId: "doc-9" })]);
    await openDocuments(facility());

    fireEvent.click(await screen.findByRole("button", { name: "Delete document" }));
    await waitFor(() => expect(api.deleteDocument).toHaveBeenCalledWith("doc-9"));
  });

  it("says so when the requirements never arrived", async () => {
    await openDocuments(facility({ documentRequirements: [] }));

    expect(
      await screen.findByText(
        "The document requirements could not be loaded. Refresh this page and try again.",
      ),
    ).toBeTruthy();
  });

  it("keeps the picker shut while an upload is in flight", () => {
    render(
      <FacilityDocumentTabs
        requirements={requirements()}
        documents={[]}
        isUploading
        actionError={null}
        onUpload={() => Promise.resolve(true)}
        onRemove={() => Promise.resolve(true)}
      />,
    );

    expect(fileInputFor("VERIFIED_DEED")!.disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: /Uploading/ }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("carries the server's refusal on to the screen and leaves the count where it was", async () => {
    api.uploadDocument.mockRejectedValue({
      response: { status: 400, data: { message: "The deed image is too large." } },
    });
    await openDocuments(facility());

    fireEvent.change(fileInputFor("VERIFIED_DEED")!, { target: { files: [image("deed.png")] } });
    fireEvent.click(await screen.findByRole("button", { name: "Upload document" }));

    expect(await screen.findByText("The deed image is too large.")).toBeTruthy();
    expect(within(screen.getByRole("tab", { name: "Verified deed0/1" })).getByText("0/1")).toBeTruthy();
  });

  it("lists the outstanding documents on the review step, count against what is wanted", async () => {
    render(
      <FacilityReviewStep
        facility={facility({ documentRequirements: requirements({ count: 2 }) })}
        isSubmitting={false}
        serverError={null}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByText("Verified deed")).toBeTruthy();
    expect(screen.getAllByText("0/1").length).toBe(3);
    expect(screen.getByText("2/4")).toBeTruthy();
  });
});
