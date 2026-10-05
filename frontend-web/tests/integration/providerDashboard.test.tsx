// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProviderDashboardPage, {
  ProviderDashboardPage as NamedProviderDashboardPage,
} from "../../src/pages/provider/ProviderDashboardPage";
import { ROUTES } from "../../src/app/routes/routeConstants";
import type { ProviderProfile } from "../../src/features/providers/types/providerTypes";
import type { ParkingFacility } from "../../src/features/parking/types/parkingTypes";
import type { Reservation } from "../../src/features/reservations/types/reservationTypes";

const api = vi.hoisted(() => ({
  provider: {
    getMyProfile: vi.fn(),
    uploadNicDocument: vi.fn(),
    getMyNicDocumentUrl: vi.fn(),
  },
  parking: { getMyFacilities: vi.fn() },
  reservations: { getProvider: vi.fn() },
}));

vi.mock("../../src/features/providers/api/providerApi", () => ({
  providerApi: api.provider,
}));
vi.mock("../../src/features/parking/api/parkingApi", () => ({
  parkingApi: api.parking,
}));
vi.mock("../../src/features/reservations/api/reservationApi", () => ({
  reservationApi: api.reservations,
}));

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

// Only the length of each list reaches this screen, so the tiles are counted, not rendered from.
const just = <T,>(count: number): T[] =>
  Array.from({ length: count }) as unknown as T[];

const refused = (message: string): Error =>
  Object.assign(new Error(message), { response: { status: 400, data: { message } } });

const renderAt = (path: string): HTMLElement => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  const { container } = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={ROUTES.PROVIDER_DASHBOARD} element={<ProviderDashboardPage />} />
          <Route path={ROUTES.FACILITIES} element={<p>properties list</p>} />
          <Route
            path={ROUTES.PROVIDER_RESERVATIONS}
            element={<p>request queue</p>}
          />
          <Route path={ROUTES.PROVIDER_STAFF} element={<p>staff page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return container;
};

const openDashboard = async (
  profile: ProviderProfile = owner(),
  counts: { facilities?: number; reservations?: number } = {},
): Promise<HTMLElement> => {
  api.provider.getMyProfile.mockResolvedValue(profile);
  api.parking.getMyFacilities.mockResolvedValue(
    just<ParkingFacility>(counts.facilities ?? 0),
  );
  api.reservations.getProvider.mockResolvedValue(
    just<Reservation>(counts.reservations ?? 0),
  );

  const container = renderAt(ROUTES.PROVIDER_DASHBOARD);
  await screen.findByText("Properties");
  return container;
};

// The label and its number are sibling paragraphs, so the reading under test is the one beside it.
const tileValue = (label: string): string => {
  const value = screen.getByText(label).nextElementSibling?.textContent;
  if (value === undefined || value === null) throw new Error(`No counter beside "${label}".`);
  return value.trim();
};

const tileOf = (label: string): HTMLElement => {
  const card = screen.getByText(label).closest("div.rounded-2xl");
  if (!(card instanceof HTMLElement)) throw new Error(`"${label}" is not on a tile.`);
  return card;
};

beforeEach(() => {
  api.provider.getMyProfile.mockResolvedValue(owner());
  api.parking.getMyFacilities.mockResolvedValue([]);
  api.reservations.getProvider.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("parking owner dashboard", () => {
  it("counts the properties and requests the platform holds beside the account status", async () => {
    await openDashboard(owner({ verificationStatus: "PENDING" }), {
      facilities: 2,
      reservations: 3,
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeTruthy();
    expect(tileValue("Properties")).toBe("2");
    expect(tileValue("Reservations")).toBe("3");
    expect(tileValue("Account Status")).toBe("PENDING");
  });

  it("is mounted at the address the app redirects a parking owner to", async () => {
    expect(ROUTES.PROVIDER_DASHBOARD).toBe("/provider/dashboard");

    await openDashboard();

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeTruthy();
    expect(screen.queryByText("properties list")).toBeNull();
    expect(screen.queryByText("request queue")).toBeNull();
    expect(screen.queryByText("staff page")).toBeNull();
  });

  it("reads the profile, the owner's properties and the owner's request queue once on mount", async () => {
    await openDashboard();

    expect(api.provider.getMyProfile).toHaveBeenCalledTimes(1);
    expect(api.parking.getMyFacilities).toHaveBeenCalledTimes(1);
    expect(api.reservations.getProvider).toHaveBeenCalledTimes(1);
    expect(api.reservations.getProvider.mock.calls[0][0]).toBeUndefined();
  });

  it("counts an empty portfolio and an empty queue as zero rather than hiding the tiles", async () => {
    await openDashboard(owner(), { facilities: 0, reservations: 0 });

    expect(tileValue("Properties")).toBe("0");
    expect(tileValue("Reservations")).toBe("0");
    expect(screen.queryByText(/no \w+ (yet|found)/i)).toBeNull();
  });

  it("holds up one spinner until the profile arrives, and shows no tile before it", async () => {
    let release: ((value: ProviderProfile) => void) | undefined;
    api.provider.getMyProfile.mockImplementation(
      () =>
        new Promise<ProviderProfile>((resolve) => {
          release = resolve;
        }),
    );
    const container = renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(container.querySelector('[class*="animate-spin"]')).toBeTruthy();
    expect(screen.queryByText("Properties")).toBeNull();
    expect(screen.queryByText("Account Status")).toBeNull();

    await waitFor(() => expect(api.provider.getMyProfile).toHaveBeenCalled());
    release?.(owner());

    expect(await screen.findByText("Properties")).toBeTruthy();
    expect(container.querySelector('[class*="animate-spin"]')).toBeNull();
  });

  it("shows its own failure card and reads the profile again when the owner retries", async () => {
    api.provider.getMyProfile
      .mockRejectedValueOnce(refused("Your account is not a parking provider."))
      .mockResolvedValue(owner());

    renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(
      await screen.findByRole("heading", { name: "Unable to load your dashboard" }),
    ).toBeTruthy();
    expect(screen.getByText("Your account is not a parking provider.")).toBeTruthy();
    expect(screen.queryByText("Properties")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(api.provider.getMyProfile).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Properties")).toBeTruthy();
  });

  it("falls back to its own wording when the platform refuses with nothing to say", async () => {
    api.provider.getMyProfile.mockRejectedValue({});

    renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(
      await screen.findByRole("heading", { name: "Unable to load your dashboard" }),
    ).toBeTruthy();
    expect(screen.getByText("Failed to load your provider profile.")).toBeTruthy();
  });

  it("takes the owner to properties, requests and staff from the three actions", async () => {
    for (const [button, landing] of [
      ["Manage Properties", "properties list"],
      ["View Reservations", "request queue"],
      ["Manage Staff", "staff page"],
    ] as const) {
      await openDashboard();

      fireEvent.click(screen.getByRole("button", { name: button }));

      expect(await screen.findByText(landing)).toBeTruthy();
      cleanup();
    }
  });

  it("makes the two counted tiles the same two journeys as the buttons", async () => {
    await openDashboard(owner(), { facilities: 1, reservations: 1 });
    fireEvent.click(tileOf("Properties"));
    expect(await screen.findByText("properties list")).toBeTruthy();
    cleanup();

    await openDashboard(owner(), { facilities: 1, reservations: 1 });
    fireEvent.click(tileOf("Reservations"));
    expect(await screen.findByText("request queue")).toBeTruthy();
    cleanup();

    // The status tile reports the account, it is not a way off this screen.
    await openDashboard();
    fireEvent.click(tileOf("Account Status"));
    await waitFor(() => expect(screen.getByText("Properties")).toBeTruthy());
    expect(screen.queryByText("properties list")).toBeNull();
  });

  it("carries the owner's identity and NIC state down the same screen as the tiles", async () => {
    const container = await openDashboard(owner());

    expect(
      screen.getByRole("heading", { name: "Profile & Verification" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Owner Information" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "NIC Verification" })).toBeTruthy();
    expect(screen.getByText("Kamala Perera")).toBeTruthy();
    expect(screen.getByText("Galle Road Parking")).toBeTruthy();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });

  it("marks an approved account apart from one the platform has not decided yet", async () => {
    await openDashboard(owner({ verificationStatus: "APPROVED" }));
    expect(tileValue("Account Status")).toBe("APPROVED");
    expect(
      screen.getByText("Account Status").nextElementSibling?.className,
    ).toContain("text-emerald-700");
    cleanup();

    await openDashboard(owner({ verificationStatus: "PENDING" }));
    expect(tileValue("Account Status")).toBe("PENDING");
    expect(
      screen.getByText("Account Status").nextElementSibling?.className,
    ).toContain("text-amber-700");
  });

  it("exports one component and paints the same page twice for the same holdings", async () => {
    expect(typeof ProviderDashboardPage).toBe("function");
    expect(NamedProviderDashboardPage).toBe(ProviderDashboardPage);

    const first = (await openDashboard()).textContent;
    cleanup();
    const second = (await openDashboard()).textContent;
    await waitFor(() => expect(api.provider.getMyProfile).toHaveBeenCalledTimes(2));

    expect(second).toBe(first);
  });
});
