// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ProviderProfilePage from "../../src/pages/provider/ProfilePage";
import type { ProviderProfile } from "../../src/features/providers/types/providerTypes";

// The profile screen talks through the shared client only, so trapping it here keeps every test
// offline while still pinning the address, body and headers each request is sent with.
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));

vi.mock("../../src/services/api/axiosClient", () => ({ axiosClient: http, default: http }));

const ME = "/providers/me";
const NIC = "/providers/me/nic";
const NIC_DOCUMENT = "/providers/me/nic-document";
const PREVIEW_URL = "https://files.test/nic-903456789v.jpg";

const owner = (over: Partial<ProviderProfile> = {}): ProviderProfile => ({
  providerId: "bbbbbbbb-0000-0000-0000-000000000001",
  userId: "aaaaaaaa-0000-0000-0000-000000000001",
  fullName: "Kamala Perera",
  email: "kamala@example.com",
  phone: "0771234567",
  nicNumber: "903456789V",
  businessName: "Galle Road Parking",
  address: "142 Galle Road, Colombo 03",
  verificationStatus: "PENDING",
  verificationRemarks: null,
  hasNicDocument: true,
  nicDocumentUrl: null,
  nicDocumentContentType: "image/jpeg",
  nicDocumentSize: 20480,
  nicSubmittedAt: "2026-09-24T05:00:00Z",
  verifiedAt: null,
  createdAt: "2026-09-24T05:00:00Z",
  updatedAt: "2026-09-24T05:00:00Z",
  ...over,
});

const nicFile = (
  name = "nic-front.jpg",
  type = "image/jpeg",
  bytes = 20480,
): File => new File([new Uint8Array(bytes)], name, { type });

// Cards are the only two panels on this screen, so the heading names which one a reading belongs to.
const cardNamed = (heading: string): HTMLElement => {
  const node = screen
    .getByRole("heading", { name: heading })
    .closest("div.rounded-2xl");
  if (!(node instanceof HTMLElement)) throw new Error(`No card titled "${heading}".`);
  return node;
};

const verificationCard = (): HTMLElement => cardNamed("NIC Verification");
const ownerCard = (): HTMLElement => cardNamed("Owner Information");

const refused = (message: string): Error =>
  Object.assign(new Error(message), { response: { status: 400, data: { message } } });

const renderProfile = (): void => {
  render(<ProviderProfilePage />);
};

// The profile arrives on one read, so a test waits for the cards before touching either of them.
const openProfile = async (profile: ProviderProfile): Promise<void> => {
  http.get.mockImplementation((url: string) => {
    if (url === ME) return Promise.resolve({ data: profile });
    if (url === NIC_DOCUMENT) return Promise.resolve({ data: { url: PREVIEW_URL } });
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
  renderProfile();
  await screen.findByRole("heading", { name: "NIC Verification" });
};

const chooseFile = (file: File): HTMLInputElement => {
  const input = screen.getByLabelText("Replace NIC document") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
  return input;
};

const uploadButton = (): HTMLButtonElement =>
  screen.getByRole("button", { name: "Submit for verification" }) as HTMLButtonElement;

beforeEach(() => {
  http.post.mockResolvedValue({ data: owner() });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("parking owner identity panel", () => {
  it("lays the owner's details out read-only from the single profile read", async () => {
    await openProfile(owner());

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get.mock.calls[0][0]).toBe(ME);

    expect(screen.getByRole("heading", { level: 1, name: "Parking Owner Profile" })).toBeTruthy();
    expect(
      screen.getByText("Review your owner details and manage your identity verification."),
    ).toBeTruthy();

    const card = ownerCard();
    expect(within(card).getByText("Kamala Perera")).toBeTruthy();
    expect(within(card).getByText("kamala@example.com")).toBeTruthy();
    expect(within(card).getByText("0771234567")).toBeTruthy();
    expect(within(card).getByText("903456789V")).toBeTruthy();
    expect(within(card).getByText("Galle Road Parking")).toBeTruthy();
    expect(within(card).getByText("142 Galle Road, Colombo 03")).toBeTruthy();

    // Nothing here is a field the owner can type into; the panel is a read of the platform's record.
    expect(within(card).queryAllByRole("textbox")).toHaveLength(0);
    expect(card.querySelectorAll("input")).toHaveLength(0);
  });

  it("draws a dash for the owner details the platform does not hold", async () => {
    await openProfile(owner({ businessName: null, address: null }));

    const card = ownerCard();
    expect(within(card).getAllByText("—")).toHaveLength(2);
    expect(within(card).getByText("Business name")).toBeTruthy();
    expect(within(card).getByText("Address")).toBeTruthy();
  });

  it("shows its own card and retries when the profile cannot be read", async () => {
    let first = true;
    http.get.mockImplementation(() => {
      if (first) {
        first = false;
        return Promise.reject(refused("Your account is not a parking provider."));
      }
      return Promise.resolve({ data: owner() });
    });
    renderProfile();

    expect(await screen.findByRole("heading", { name: "Unable to load your provider profile" }))
      .toBeTruthy();
    expect(screen.getByText("Your account is not a parking provider.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "NIC Verification" })).toBeTruthy();
  });

  it("holds up a spinner until the profile arrives", async () => {
    let release: ((value: { data: ProviderProfile }) => void) | undefined;
    http.get.mockImplementation(
      () => new Promise((resolve) => {
        release = resolve;
      }),
    );
    const { container } = render(<ProviderProfilePage />);

    expect(container.querySelector('[class*="animate-spin"]')).toBeTruthy();
    // The heading is page furniture and stays up; what the owner must not see early is their own data.
    expect(screen.queryByRole("heading", { name: "Owner Information" })).toBeNull();

    // The read is queued a frame after mount, so the test releases it only once it is actually open.
    await waitFor(() => expect(http.get).toHaveBeenCalledWith(ME));
    release?.({ data: owner() });

    expect(await screen.findByRole("heading", { name: "Owner Information" })).toBeTruthy();
    expect(container.querySelector('[class*="animate-spin"]')).toBeNull();
  });
});

describe("verification state the owner is shown", () => {
  it("names a NIC that is still in the queue and repeats what the admin wrote", async () => {
    await openProfile(
      owner({ verificationRemarks: "Please resubmit with the back side visible." }),
    );

    const card = verificationCard();
    expect(within(card).getByText("Pending review")).toBeTruthy();
    expect(
      within(card).getByText(
        "Your NIC document has been received and is waiting for platform admin review.",
      ),
    ).toBeTruthy();
    expect(within(card).getByText("Admin remarks")).toBeTruthy();
    expect(within(card).getByText("Please resubmit with the back side visible.")).toBeTruthy();
  });

  it("tells an approved owner they are verified and takes the upload form away", async () => {
    await openProfile(owner({ verificationStatus: "APPROVED", verifiedAt: "2026-09-26T09:00:00Z" }));

    const card = verificationCard();
    expect(within(card).getByText("Approved")).toBeTruthy();
    expect(
      within(card).getByText(
        "Your identity has been verified. You can now access all parking owner features.",
      ),
    ).toBeTruthy();
    // An approved owner has nothing left to submit, so the whole form is fenced off.
    expect(within(card).queryByText("Replace NIC document")).toBeNull();
    expect(card.querySelectorAll("input")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Submit for verification" })).toBeNull();

    fireEvent.click(within(card).getByRole("button", { name: "View uploaded NIC" }));
    await waitFor(() => expect(http.get).toHaveBeenCalledWith(NIC_DOCUMENT));
    expect(http.post).not.toHaveBeenCalled();
  });

  it("shows a rejected NIC with its help text and keeps the resubmission form open", async () => {
    await openProfile(
      owner({
        verificationStatus: "REJECTED",
        verificationRemarks: "The NIC photo is unreadable.",
      }),
    );

    const card = verificationCard();
    expect(within(card).getByText("Rejected")).toBeTruthy();
    expect(
      within(card).getByText(
        "Your NIC document was rejected. Review the remarks and upload a clear JPG or PNG copy to resubmit.",
      ),
    ).toBeTruthy();
    expect(within(card).getByText("The NIC photo is unreadable.")).toBeTruthy();
    expect(within(card).getByText("Replace NIC document")).toBeTruthy();
    expect(uploadButton().disabled).toBe(true);
  });

  it("says an owner who has never uploaded has to start from scratch, and hides the stored rows", async () => {
    await openProfile(
      owner({
        verificationStatus: "PENDING",
        hasNicDocument: false,
        nicDocumentContentType: null,
        nicDocumentSize: 0,
        nicSubmittedAt: null,
      }),
    );

    const card = verificationCard();
    expect(
      within(card).getByText(
        "You have not uploaded your NIC yet. Upload a clear JPG or PNG copy below to start the verification process.",
      ),
    ).toBeTruthy();
    expect(within(card).getByText("Upload NIC document")).toBeTruthy();
    expect(within(card).queryByText("Document type")).toBeNull();
    expect(within(card).queryByText("Document size")).toBeNull();
    // The two dates are always listed; with nothing filed they simply read blank.
    expect(within(card).getAllByText("—")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "View uploaded NIC" })).toBeNull();
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it("lists the stored document's own type and size next to the dates it moved on", async () => {
    await openProfile(owner());

    const card = verificationCard();
    expect(within(card).getByText("Document type")).toBeTruthy();
    expect(within(card).getByText("image/jpeg")).toBeTruthy();
    expect(within(card).getByText("Document size")).toBeTruthy();
    expect(within(card).getByText("20.0 KB")).toBeTruthy();
    expect(within(card).getByText("Submitted at")).toBeTruthy();
    // Nothing has decided on it yet, so the verified date is still blank rather than a guess.
    expect(within(card).getByText("Verified at")).toBeTruthy();
    expect(within(card).getAllByText("—")).toHaveLength(1);
  });
});

describe("NIC upload from the owner's own profile", () => {
  it("sends the chosen image to the nic endpoint as multipart and shows the resubmitted profile", async () => {
    const file = nicFile();
    http.post.mockResolvedValue({
      data: owner({ nicSubmittedAt: "2026-10-02T11:00:00Z" }),
    });
    await openProfile(owner({ verificationStatus: "REJECTED" }));

    expect(uploadButton().disabled).toBe(true);
    const input = chooseFile(file);

    expect(within(verificationCard()).getByText("Selected: nic-front.jpg (20.0 KB)")).toBeTruthy();
    expect(uploadButton().disabled).toBe(false);

    fireEvent.click(uploadButton());

    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(1));
    const [url, body, config] = http.post.mock.calls[0] as [string, FormData, { headers: Record<string, string> }];
    expect(url).toBe(NIC);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });

    // The panel now reads as the profile the platform handed back, and the box is emptied.
    expect(await screen.findByRole("heading", { name: "Owner Information" })).toBeTruthy();
    expect(within(verificationCard()).getByText("Pending review")).toBeTruthy();
    expect(input.value).toBe("");
    expect(verificationCard().textContent).not.toContain("Selected: nic-front.jpg");
  });

  it("turns away a file the NIC rules do not accept, naming the rule it broke", async () => {
    await openProfile(owner());

    const cases: [File, string][] = [
      [new File([], "blank.png", { type: "image/png" }), "The selected file is empty."],
      [nicFile("scan.pdf", "application/pdf"), "Only JPG or PNG images are accepted."],
      [nicFile("nic-front.bmp", "image/png"), "File name must end with .jpg, .jpeg or .png."],
      [nicFile("huge.png", "image/png", 5 * 1024 * 1024 + 1), "NIC image must be 5 MB or smaller."],
    ];

    for (const [file, message] of cases) {
      chooseFile(file);
      fireEvent.click(uploadButton());

      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toBe(message);
      expect(http.post).not.toHaveBeenCalled();
    }
  });

  it("will not send anything while no file has been chosen", async () => {
    await openProfile(owner());

    fireEvent.click(uploadButton());
    expect(http.post).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();

    // Submitting the panel by any other route still has to say what is missing.
    const form = verificationCard().querySelector("form");
    if (!(form instanceof HTMLFormElement)) throw new Error("No NIC form on the panel.");
    fireEvent.submit(form);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Please choose a JPG or PNG image of your NIC.");
    expect(http.post).not.toHaveBeenCalled();
  });

  it("tells the owner what the platform said when it refuses the image", async () => {
    await openProfile(owner());
    chooseFile(nicFile());

    http.post.mockRejectedValue(refused("The NIC image could not be stored."));
    fireEvent.click(uploadButton());

    // The hook's own error flag replaces the whole screen: the panel never gets to show its note.
    expect(await screen.findByRole("heading", { name: "Unable to load your provider profile" }))
      .toBeTruthy();
    expect(screen.getByText("The NIC image could not be stored.")).toBeTruthy();
    expect(screen.queryByText("NIC upload failed.")).toBeNull();
    // The panel is gone with the message, so its inline alert never reaches the owner.
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("disables the file box and the submit button while the image is on its way", async () => {
    let release: ((value: { data: ProviderProfile }) => void) | undefined;
    http.post.mockImplementation(
      () => new Promise((resolve) => {
        release = resolve;
      }),
    );
    await openProfile(owner());
    const input = chooseFile(nicFile());

    fireEvent.click(uploadButton());

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Uploading…" }) as HTMLButtonElement,
      ).toBeTruthy(),
    );
    expect(input.disabled).toBe(true);
    expect(document.querySelectorAll('[class*="animate-spin"]').length).toBeGreaterThan(0);

    release?.({ data: owner() });
    expect(await screen.findByRole("button", { name: "Submit for verification" })).toBeTruthy();
    expect(input.disabled).toBe(false);
  });
});

describe("stored NIC preview", () => {
  it("opens the document at the address the platform gives and asks for it only once", async () => {
    await openProfile(owner());

    fireEvent.click(within(verificationCard()).getByRole("button", { name: "View uploaded NIC" }));

    const dialog = await screen.findByRole("dialog", { name: "Uploaded NIC document" });
    expect(http.get).toHaveBeenCalledWith(NIC_DOCUMENT);
    const image = within(dialog).getByRole("img") as HTMLImageElement;
    expect(image.src).toBe(PREVIEW_URL);
    expect(image.alt).toBe("Uploaded NIC document");

    fireEvent.click(within(dialog).getByRole("button", { name: "Close preview" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    // The address is kept, so reopening the same picture is free.
    fireEvent.click(within(verificationCard()).getByRole("button", { name: "View uploaded NIC" }));
    await screen.findByRole("dialog", { name: "Uploaded NIC document" });
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get.mock.calls.map((call) => call[0])).toEqual([ME, NIC_DOCUMENT]);
  });

  it("says so when the stored document cannot be retrieved", async () => {
    http.get.mockImplementation((url: string) =>
      url === ME
        ? Promise.resolve({ data: owner() })
        : Promise.reject(refused("The stored NIC document has gone missing.")),
    );
    renderProfile();
    await screen.findByRole("heading", { name: "NIC Verification" });

    fireEvent.click(within(verificationCard()).getByRole("button", { name: "View uploaded NIC" }));

    expect(http.get).toHaveBeenCalledWith(NIC_DOCUMENT);
    expect(http.post).not.toHaveBeenCalled();
    // Reading the document failed, and the hook records that as a profile error, so the screen
    // drops to its load-failure card instead of the panel's "try again" note.
    expect(await screen.findByRole("heading", { name: "Unable to load your provider profile" }))
      .toBeTruthy();
    expect(screen.getByText("The stored NIC document has gone missing.")).toBeTruthy();
  });

  it("is never offered to an owner with nothing stored", async () => {
    await openProfile(
      owner({ hasNicDocument: false, nicDocumentContentType: null, nicDocumentSize: 0 }),
    );

    expect(screen.queryByRole("button", { name: "View uploaded NIC" })).toBeNull();
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith(ME);
  });
});
