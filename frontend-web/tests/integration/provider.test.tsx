// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProvidersPage from "../../src/pages/admin/ProvidersPage";
import { ToastProvider } from "../../src/app/providers/ToastProvider";
import type { ProviderProfile } from "../../src/features/providers/types/providerTypes";

const api = vi.hoisted(() => ({
  getPendingVerifications: vi.fn(),
  updateVerificationStatus: vi.fn(),
}));

vi.mock("../../src/features/providers/api/providerApi", () => ({
  providerApi: api,
}));

const USER_ID = "aaaaaaaa-0000-0000-0000-000000000001";

const owner = (over: Partial<ProviderProfile> = {}): ProviderProfile => ({
  providerId: "bbbbbbbb-0000-0000-0000-000000000001",
  userId: USER_ID,
  fullName: "Kamala Perera",
  email: "kamala@example.com",
  phone: "0771234567",
  nicNumber: "903456789V",
  businessName: null,
  address: null,
  verificationStatus: "PENDING",
  verificationRemarks: null,
  hasNicDocument: true,
  nicDocumentUrl: "https://example.test/nic.png",
  nicDocumentContentType: "image/png",
  nicDocumentSize: 20480,
  nicSubmittedAt: "2026-09-24T05:00:00Z",
  verifiedAt: null,
  createdAt: "2026-09-24T05:00:00Z",
  updatedAt: "2026-09-24T05:00:00Z",
  ...over,
});

const queueWith = (row: ProviderProfile) => {
  // The first read is the queue before the decision, every later read the queue after it.
  api.getPendingVerifications.mockResolvedValueOnce([row]).mockResolvedValue([]);
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("admin NIC verification queue", () => {
  it("pops an alert naming the owner and the remarks when a verification is rejected", async () => {
    queueWith(owner());
    api.updateVerificationStatus.mockResolvedValue(
      owner({
        verificationStatus: "REJECTED",
        verificationRemarks: "The NIC photo is unreadable.",
      }),
    );

    render(
      <ToastProvider>
        <ProvidersPage />
      </ToastProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));
    fireEvent.change(screen.getByLabelText("Rejection remarks (required)"), {
      target: { value: "The NIC photo is unreadable." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(
      await screen.findByText("NIC verification rejected for Kamala Perera"),
    ).toBeTruthy();
    expect(
      screen.getByText("Remarks sent to the owner: The NIC photo is unreadable."),
    ).toBeTruthy();
    expect(api.updateVerificationStatus).toHaveBeenCalledWith(
      USER_ID,
      "REJECTED",
      "The NIC photo is unreadable.",
    );
  });

  it("pops its own alert on an approval, worded as an approval", async () => {
    queueWith(owner());
    api.updateVerificationStatus.mockResolvedValue(
      owner({ verificationStatus: "APPROVED" }),
    );

    render(
      <ToastProvider>
        <ProvidersPage />
      </ToastProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));

    expect(
      await screen.findByText("NIC verification approved for Kamala Perera"),
    ).toBeTruthy();
    expect(screen.getByText(/register a parking property/)).toBeTruthy();
    expect(
      document.querySelector('[aria-live="polite"]')?.textContent,
    ).not.toContain("rejected");
    await waitFor(() =>
      expect(api.updateVerificationStatus).toHaveBeenCalledWith(
        USER_ID,
        "APPROVED",
        undefined,
      ),
    );
  });

  it("still reports a rejected decision that the platform refused", async () => {
    queueWith(owner());
    api.updateVerificationStatus.mockRejectedValue(
      new Error("Remarks are required when rejecting a verification."),
    );

    render(
      <ToastProvider>
        <ProvidersPage />
      </ToastProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));
    fireEvent.change(screen.getByLabelText("Rejection remarks (required)"), {
      target: { value: "Blurry" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(
      await screen.findByText("Remarks are required when rejecting a verification."),
    ).toBeTruthy();
    expect(
      document.querySelector('[aria-live="polite"]')?.textContent,
    ).toBe("");
  });
});
