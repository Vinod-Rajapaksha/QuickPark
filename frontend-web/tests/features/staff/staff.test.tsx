import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { axiosClient } from "../../../src/services/api/axiosClient";

import { staffApi } from "../../../src/features/parking-staff/api/staffApi";

import { CreateStaffModal } from "../../../src/features/parking-staff/components/CreateStaffModal";
import { EditStaffModal } from "../../../src/features/parking-staff/components/EditStaffModal";

import StaffManagementPage from "../../../src/pages/provider/StaffManagementPage";

import { useStaff } from "../../../src/features/parking-staff/hooks/useStaff";
import { useParkings } from "../../../src/features/parking/hooks/useParkings";

import type {
  StaffResponse,
} from "../../../src/features/parking-staff/types/staffTypes";

vi.mock(
  "../../../src/services/api/axiosClient",
  () => ({
    axiosClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  }),
);

vi.mock(
  "../../../src/features/parking-staff/hooks/useStaff",
);

vi.mock(
  "../../../src/features/parking/hooks/useParkings",
);

const mockedAxios = vi.mocked(
  axiosClient,
);

const staff: StaffResponse = {
  id: "staff-1",
  userId: "user-1",
  fullName: "John Staff",
  email: "john@test.com",
  phone: "+94771234567",
  nic: "200012345678",
  facilityId: "facility-1",
  facilityName:
    "Colombo Parking",
  type: "STANDARD",
  position: "Attendant",
  canManageReservations:
    false,
  canCheckInVehicle: true,
  canCheckOutVehicle: true,
  canViewReports: false,
  canManageStaff: false,
  isActive: true,
  createdAt:
    "2026-10-01T10:00:00Z",
};

const staffHookDefaults = {
  staffList: [],
  isLoading: false,
  error: null,
  fetchStaff: vi.fn(),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  updateStaffStatus: vi.fn(),
  updateStaffAssignment:
    vi.fn(),
};

describe("Staff API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads provider staff", async () => {
    vi.mocked(
      mockedAxios.get,
    ).mockResolvedValue({
      data: [staff],
    });

    const result =
      await staffApi.getAllStaff();

    expect(
      mockedAxios.get,
    ).toHaveBeenCalledWith(
      "/provider/staff",
    );

    expect(result).toEqual([
      staff,
    ]);
  });

  it("creates staff", async () => {
    vi.mocked(
      mockedAxios.post,
    ).mockResolvedValue({
      data: staff,
    });

    const request = {
      facilityId:
        "facility-1",
      fullName: "John Staff",
      email: "john@test.com",
      password:
        "Password123!",
      phone:
        "+94771234567",
      nic:
        "200012345678",
      type:
        "STANDARD" as const,
      position: "Attendant",
    };

    await staffApi.createStaff(
      request,
    );

    expect(
      mockedAxios.post,
    ).toHaveBeenCalledWith(
      "/provider/staff",
      request,
    );
  });

  it("updates staff details", async () => {
    vi.mocked(
      mockedAxios.put,
    ).mockResolvedValue({
      data: staff,
    });

    const request = {
      fullName:
        "John Updated",
      phone:
        "+94770000000",
      nic:
        "200012345678",
      type:
        "ADMINISTRATIVE" as const,
      position: "Supervisor",
    };

    await staffApi.updateStaff(
      "staff-1",
      request,
    );

    expect(
      mockedAxios.put,
    ).toHaveBeenCalledWith(
      "/provider/staff/staff-1",
      request,
    );
  });

  it("updates staff active status", async () => {
    vi.mocked(
      mockedAxios.patch,
    ).mockResolvedValue({
      data: undefined,
    });

    await staffApi.updateStaffStatus(
      "staff-1",
      {
        isActive: false,
      },
    );

    expect(
      mockedAxios.patch,
    ).toHaveBeenCalledWith(
      "/provider/staff/staff-1/status",
      {
        isActive: false,
      },
    );
  });

  it("updates staff facility assignment", async () => {
    vi.mocked(
      mockedAxios.patch,
    ).mockResolvedValue({
      data: undefined,
    });

    await staffApi.updateStaffAssignment(
      "staff-1",
      {
        facilityId:
          "facility-2",
      },
    );

    expect(
      mockedAxios.patch,
    ).toHaveBeenCalledWith(
      "/provider/staff/staff-1/assignment",
      {
        facilityId:
          "facility-2",
      },
    );
  });
});

describe("Staff Components", () => {
  describe("CreateStaffModal", () => {
    it("does not render when closed", () => {
      render(
        <CreateStaffModal
          isOpen={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          facilities={[]}
        />,
      );

      expect(
        screen.queryByText(
          "Add Staff Member",
        ),
      ).not.toBeInTheDocument();
    });

    it("renders available facilities", () => {
      render(
        <CreateStaffModal
          isOpen
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          facilities={[
            {
              facilityId:
                "facility-1",
              name:
                "Colombo Parking",
            },
            {
              facilityId:
                "facility-2",
              name:
                "Kandy Parking",
            },
          ]}
        />,
      );

      expect(
        screen.getByText(
          "Colombo Parking",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Kandy Parking",
        ),
      ).toBeInTheDocument();
    });

    it("shows no facilities message", () => {
      render(
        <CreateStaffModal
          isOpen
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          facilities={[]}
        />,
      );

      expect(
        screen.getByText(
          "No facilities found - Create one first",
        ),
      ).toBeInTheDocument();
    });

    it("creates a staff member", async () => {
      const user =
        userEvent.setup();

      const onSubmit = vi
        .fn()
        .mockResolvedValue(
          true,
        );

      const onClose =
        vi.fn();

      render(
        <CreateStaffModal
          isOpen
          onClose={onClose}
          onSubmit={onSubmit}
          facilities={[
            {
              facilityId:
                "facility-1",
              name:
                "Colombo Parking",
            },
          ]}
        />,
      );

      const selects =
        screen.getAllByRole(
          "combobox",
        );

      await user.selectOptions(
        selects[0],
        "facility-1",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. John Doe",
        ),
        "John Staff",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. john@example.com",
        ),
        "john@test.com",
      );

      await user.type(
        screen.getByPlaceholderText(
          "Min. 8 characters",
        ),
        "Password123!",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. +94771234567",
        ),
        "+94771234567",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. 199012345678",
        ),
        "200012345678",
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Create Staff",
          },
        ),
      );

      expect(
        onSubmit,
      ).toHaveBeenCalledWith({
        facilityId:
          "facility-1",
        fullName:
          "John Staff",
        email:
          "john@test.com",
        password:
          "Password123!",
        phone:
          "+94771234567",
        nic:
          "200012345678",
        type: "STANDARD",
        position:
          "Attendant",
      });

      expect(
        onClose,
      ).toHaveBeenCalledOnce();
    });

    it("keeps create modal open when creation fails", async () => {
      const user =
        userEvent.setup();

      const onSubmit = vi
        .fn()
        .mockResolvedValue(
          false,
        );

      const onClose =
        vi.fn();

      render(
        <CreateStaffModal
          isOpen
          onClose={onClose}
          onSubmit={onSubmit}
          facilities={[
            {
              facilityId:
                "facility-1",
              name:
                "Colombo Parking",
            },
          ]}
        />,
      );

      const selects =
        screen.getAllByRole(
          "combobox",
        );

      await user.selectOptions(
        selects[0],
        "facility-1",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. John Doe",
        ),
        "John Staff",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. john@example.com",
        ),
        "john@test.com",
      );

      await user.type(
        screen.getByPlaceholderText(
          "Min. 8 characters",
        ),
        "Password123!",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. +94771234567",
        ),
        "+94771234567",
      );

      await user.type(
        screen.getByPlaceholderText(
          "e.g. 199012345678",
        ),
        "200012345678",
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Create Staff",
          },
        ),
      );

      expect(
        onSubmit,
      ).toHaveBeenCalledOnce();

      expect(
        onClose,
      ).not.toHaveBeenCalled();
    });
  });

  describe("EditStaffModal", () => {
    it("does not render when closed", () => {
      render(
        <EditStaffModal
          isOpen={false}
          staff={staff}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />,
      );

      expect(
        screen.queryByText(
          "Edit Staff Member",
        ),
      ).not.toBeInTheDocument();
    });

    it("loads existing staff values", () => {
    const { rerender } = render(
      <EditStaffModal
        isOpen={false}
        staff={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    rerender(
      <EditStaffModal
        isOpen
        staff={staff}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Edit Staff Member",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("John Staff"),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("john@test.com"),
    ).toBeDisabled();

    expect(
      screen.getByDisplayValue("+94771234567"),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("200012345678"),
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Attendant"),
    ).toBeInTheDocument();
  });

    it("updates staff information", async () => {
      const user = userEvent.setup();

      const onSubmit = vi
        .fn()
        .mockResolvedValue(true);

      const onClose = vi.fn();

      const { rerender } = render(
        <EditStaffModal
          isOpen={false}
          staff={null}
          onClose={onClose}
          onSubmit={onSubmit}
        />,
      );

      rerender(
        <EditStaffModal
          isOpen
          staff={staff}
          onClose={onClose}
          onSubmit={onSubmit}
        />,
      );

      const nameInput =
        screen.getByDisplayValue(
          "John Staff",
        );

      await user.clear(nameInput);

      await user.type(
        nameInput,
        "John Updated",
      );

      const positionInput =
        screen.getByDisplayValue(
          "Attendant",
        );

      await user.clear(
        positionInput,
      );

      await user.type(
        positionInput,
        "Supervisor",
      );

      await user.click(
        screen.getByRole("button", {
          name: "Save Changes",
        }),
      );

      expect(
        onSubmit,
      ).toHaveBeenCalledWith(
        "staff-1",
        expect.objectContaining({
          fullName: "John Updated",
          phone: "+94771234567",
          nic: "200012345678",
          type: "STANDARD",
          position: "Supervisor",
        }),
      );

      expect(
        onClose,
      ).toHaveBeenCalledOnce();
    });
    it("keeps edit modal open when update fails", async () => {
      const user =
        userEvent.setup();

      const onSubmit = vi
        .fn()
        .mockResolvedValue(
          false,
        );

      const onClose =
        vi.fn();

      render(
        <EditStaffModal
          isOpen
          staff={staff}
          onClose={onClose}
          onSubmit={onSubmit}
        />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Save Changes",
          },
        ),
      );

      expect(
        onSubmit,
      ).toHaveBeenCalled();

      expect(
        onClose,
      ).not.toHaveBeenCalled();
    });
  });
});

describe(
  "Staff Management Page",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      vi.mocked(
        useStaff,
      ).mockReturnValue(
        staffHookDefaults,
      );

      vi.mocked(
        useParkings,
      ).mockReturnValue({
        facilities: [
          {
            facilityId:
              "facility-1",
            name:
              "Colombo Parking",
          },
        ],
      } as ReturnType<
        typeof useParkings
      >);
    });

    it("fetches staff when page loads", () => {
      const fetchStaff =
        vi.fn();

      vi.mocked(
        useStaff,
      ).mockReturnValue({
        ...staffHookDefaults,
        fetchStaff,
      });

      render(
        <StaffManagementPage />,
      );

      expect(
        fetchStaff,
      ).toHaveBeenCalledOnce();
    });

    it("shows loading indicator", () => {
      vi.mocked(
        useStaff,
      ).mockReturnValue({
        ...staffHookDefaults,
        isLoading: true,
      });

      const {
        container,
      } = render(
        <StaffManagementPage />,
      );

      expect(
        container.querySelector(
          ".animate-spin",
        ),
      ).toBeInTheDocument();
    });

    it("shows empty staff state", () => {
      render(
        <StaffManagementPage />,
      );

      expect(
        screen.getByText(
          "No Staff Members Found",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Add Your First Staff Member",
          },
        ),
      ).toBeInTheDocument();
    });

    it("shows staff members", () => {
      vi.mocked(
        useStaff,
      ).mockReturnValue({
        ...staffHookDefaults,
        staffList: [
          staff,
        ],
      });

      render(
        <StaffManagementPage />,
      );

      expect(
        screen.getByText(
          "John Staff",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "john@test.com",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Colombo Parking",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Attendant",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Active",
        ),
      ).toBeInTheDocument();
    });

    it("opens create staff modal", async () => {
      const user =
        userEvent.setup();

      render(
        <StaffManagementPage />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              /add staff member/i,
          },
        ),
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Add Staff Member",
          },
        ),
      ).toBeInTheDocument();
    });

    it("opens edit staff modal", async () => {
      const user =
        userEvent.setup();

      vi.mocked(
        useStaff,
      ).mockReturnValue({
        ...staffHookDefaults,
        staffList: [
          staff,
        ],
      });

      render(
        <StaffManagementPage />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "Edit",
          },
        ),
      );

      expect(
        screen.getByRole(
          "heading",
          {
            name:
              "Edit Staff Member",
          },
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByDisplayValue(
          "John Staff",
        ),
      ).toBeInTheDocument();
    });

    it("deactivates active staff member", async () => {
      const user =
        userEvent.setup();

      const updateStaffStatus =
        vi.fn();

      vi.mocked(
        useStaff,
      ).mockReturnValue({
        ...staffHookDefaults,
        staffList: [
          staff,
        ],
        updateStaffStatus,
      });

      render(
        <StaffManagementPage />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Deactivate",
          },
        ),
      );

      expect(
        updateStaffStatus,
      ).toHaveBeenCalledWith(
        "staff-1",
        false,
      );
    });

    it("activates inactive staff member", async () => {
      const user =
        userEvent.setup();

      const updateStaffStatus =
        vi.fn();

      vi.mocked(
        useStaff,
      ).mockReturnValue({
        ...staffHookDefaults,
        staffList: [
          {
            ...staff,
            isActive: false,
          },
        ],
        updateStaffStatus,
      });

      render(
        <StaffManagementPage />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "Activate",
          },
        ),
      );

      expect(
        updateStaffStatus,
      ).toHaveBeenCalledWith(
        "staff-1",
        true,
      );
    });
  },
);