// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProviderDashboardPage, {
  ProviderDashboardPage as NamedProviderDashboardPage,
} from "../../src/pages/provider/ProviderDashboardPage";
import { ROUTES } from "../../src/app/routes/routeConstants";

// The overview could have read its tiles from any of these, so every method on every one of them
// is trapped: a call lands in `reads` and fails the test instead of reaching the network.
const harness = vi.hoisted(() => {
  const reads: string[] = [];
  const record = (name: string) =>
    new Proxy({} as Record<string, unknown>, {
      get: (_target, prop) => {
        if (typeof prop !== "string" || prop === "then") return undefined;
        return (...args: unknown[]) => {
          reads.push(`${name}.${prop}(${JSON.stringify(args)})`);
          return Promise.reject(
            new Error(`The provider overview tried to call ${name}.${prop}().`),
          );
        };
      },
    });
  return { reads, record };
});

vi.mock("../../src/features/parking/api/parkingApi", () => ({
  parkingApi: harness.record("parkingApi"),
}));
vi.mock("../../src/features/providers/api/providerApi", () => ({
  providerApi: harness.record("providerApi"),
}));
vi.mock("../../src/features/reports/api/reportApi", () => ({
  reportApi: harness.record("reportApi"),
}));
vi.mock("../../src/features/reservations/api/reservationApi", () => ({
  reservationApi: harness.record("reservationApi"),
}));
vi.mock("../../src/features/parking-slots/api/parkingSlotApi", () => ({
  parkingSlotApi: harness.record("parkingSlotApi"),
}));
vi.mock("../../src/services/api/axiosClient", () => ({
  axiosClient: harness.record("axiosClient"),
  default: harness.record("axiosClient"),
}));

const HEADING = "Provider Dashboard";
const PLACEHOLDER = "The provider overview is being built out by the provider team.";

const renderAt = (path: string): HTMLElement => {
  const { container } = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={ROUTES.PROVIDER_DASHBOARD} element={<ProviderDashboardPage />} />
        <Route path={ROUTES.FACILITIES} element={<p>properties list</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return container;
};

// A read queued like the profile hook's (Promise.resolve().then(...)) still lands on a later frame.
const flushFrames = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 30);
  });

let fetchSpy: ReturnType<typeof vi.fn>;
let openSpy: ReturnType<typeof vi.spyOn>;
let sendSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  openSpy = vi.spyOn(XMLHttpRequest.prototype, "open");
  sendSpy = vi.spyOn(XMLHttpRequest.prototype, "send");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  harness.reads.length = 0;
});

describe("parking owner overview screen", () => {
  it("shows the owner a heading and one standing note, and nothing else at all", () => {
    const container = renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(
      screen.getByRole("heading", { level: 1, name: HEADING }),
    ).toBeTruthy();
    expect(screen.getByText(PLACEHOLDER)).toBeTruthy();
    // The whole page is these two readings: no card, tile or counter hides any extra text.
    expect(container.textContent).toBe(`${HEADING}${PLACEHOLDER}`);
    expect(container.querySelectorAll("*")).toHaveLength(3);
  });

  it("is mounted at the address the app redirects a parking owner to", () => {
    expect(ROUTES.PROVIDER_DASHBOARD).toBe("/provider/dashboard");

    renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(screen.getByRole("heading", { name: HEADING })).toBeTruthy();
    expect(screen.queryByText("properties list")).toBeNull();
  });

  it("reads no tile, counter or list from any api on mount", async () => {
    renderAt(ROUTES.PROVIDER_DASHBOARD);
    await flushFrames();

    expect(harness.reads).toEqual([]);
  });

  it("opens no request of any kind, so the screen is the same whatever the server holds", async () => {
    renderAt(ROUTES.PROVIDER_DASHBOARD);
    await flushFrames();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("has no zero, empty or data state of its own: one static note covers every case", () => {
    const container = renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(screen.queryAllByRole("heading")).toHaveLength(1);
    expect(screen.queryAllByRole("status")).toHaveLength(0);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(screen.queryByText(/no \w+ (yet|found)/i)).toBeNull();
    expect(container.textContent).not.toMatch("0");
  });

  it("never enters a loading state the owner would have to wait out", async () => {
    const container = renderAt(ROUTES.PROVIDER_DASHBOARD);
    const before = container.textContent;
    await flushFrames();

    expect(container.textContent).toBe(before);
    expect(screen.queryByText(/loading/i)).toBeNull();
    expect(container.querySelector('[class*="animate-spin"]')).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("carries no error card or retry path, because it has nothing that can fail", () => {
    renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(screen.queryByText(/error/i)).toBeNull();
    expect(screen.queryByText("Unable to load your provider profile")).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("offers the owner no action to click, so nothing on it can navigate anywhere", () => {
    const container = renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(container.querySelector("[href], [onclick], button, a")).toBeNull();
    // The sibling screen in the tree stays unreachable from here.
    expect(screen.queryByText("properties list")).toBeNull();
  });

  it("renders bare, with no query client, toast provider or auth store wrapped around it", () => {
    expect(() => renderAt(ROUTES.PROVIDER_DASHBOARD)).not.toThrow();
    expect(screen.getByText(PLACEHOLDER)).toBeTruthy();
  });

  it("is the provider's own placeholder, not another team's unwired screen", () => {
    renderAt(ROUTES.PROVIDER_DASHBOARD);

    expect(screen.getByText(PLACEHOLDER)).toBeTruthy();
    expect(screen.queryByText(/reporting team/)).toBeNull();
    expect(screen.queryByText(/reservation team/)).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  it("paints the identical page on every mount and its exports name one component", async () => {
    expect(typeof ProviderDashboardPage).toBe("function");
    expect(NamedProviderDashboardPage).toBe(ProviderDashboardPage);

    const first = renderAt(ROUTES.PROVIDER_DASHBOARD).innerHTML;
    cleanup();
    const second = renderAt(ROUTES.PROVIDER_DASHBOARD).innerHTML;
    await flushFrames();

    expect(second).toBe(first);
    expect(harness.reads).toEqual([]);
  });
});
