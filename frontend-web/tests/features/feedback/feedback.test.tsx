import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { axiosClient } from "../../../src/services/api/axiosClient";

import { feedbackApi } from "../../../src/features/feedback/api/feedbackApi";
import { feedbackAdminApi } from "../../../src/features/feedback/api/feedbackAdminApi";
import { feedbackReplyApi } from "../../../src/features/feedback/api/feedbackReplyApi";

import { SystemFeedbackForm } from "../../../src/features/feedback/components/public/SystemFeedbackForm";
import { ParkingFeedbackForm } from "../../../src/features/feedback/components/driver/ParkingFeedbackForm";
import { DriverFeedbackCard } from "../../../src/features/feedback/components/driver/DriverFeedbackCard";

import { FeedbackFilters } from "../../../src/features/feedback/components/admin/FeedbackFilters";
import { FeedbackStats } from "../../../src/features/feedback/components/admin/FeedbackStats";
import { FeedbackTable } from "../../../src/features/feedback/components/admin/FeedbackTable";
import { FeedbackModerationDialog } from "../../../src/features/feedback/components/admin/FeedbackModerationDialog";

import { StarRating } from "../../../src/features/feedback/components/shared/StarRating";
import { FeedbackStatusBadge } from "../../../src/features/feedback/components/shared/FeedbackStatusBadge";

import FeedbackPage from "../../../src/pages/driver/FeedbackPage";
import FeedbackManagementPage from "../../../src/pages/admin/FeedbackManagementPage";

import { useDriverFeedback } from "../../../src/features/feedback/hooks/useDriverFeedback";
import { useAdminFeedback } from "../../../src/features/feedback/hooks/useAdminFeedback";
import { useToast } from "../../../src/hooks/useToast";

import type {
  Feedback,
} from "../../../src/features/feedback/types/feedbackTypes";

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
  "../../../src/features/feedback/hooks/useDriverFeedback",
);

vi.mock(
  "../../../src/features/feedback/hooks/useAdminFeedback",
);

vi.mock(
  "../../../src/hooks/useToast",
);

const mockedAxios = vi.mocked(
  axiosClient,
);

const apiFeedback = {
  id: "feedback-1",
  userName: "John Doe",
  type: 1,
  parkingId: null,
  reservationId: null,
  rating: 5,
  comment: "Great system",
  status: 1,
  keywords: null,
  replies: [],
  createdAt:
    "2026-10-01T10:00:00Z",
  updatedAt:
    "2026-10-01T10:00:00Z",
};

const createFeedback = (
  overrides: Partial<Feedback> = {},
): Feedback => ({
  id: "feedback-1",
  userName: "John Doe",
  type: "SYSTEM",
  parkingId: null,
  reservationId: null,
  rating: 4,
  comment:
    "QuickPark works very well.",
  status: "PENDING_APPROVAL",
  keywords: [],
  replies: [],
  createdAt:
    "2026-10-01T10:00:00Z",
  updatedAt:
    "2026-10-01T10:00:00Z",
  ...overrides,
});

const driverHookDefaults = {
  feedbacks: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  fetchFeedbacks: vi.fn(),
  updateFeedback: vi.fn(),
  deleteFeedback: vi.fn(),
};

const adminHookDefaults = {
  feedbacks: [],
  activeFeedbacks: [],
  pendingFeedbacks: [],
  hiddenFeedbacks: [],
  reports: [],
  isLoading: false,
  isActionLoading: false,
  error: null,
  fetchData: vi.fn(),
  approveFeedback: vi.fn(),
  hideFeedback: vi.fn(),
  restoreFeedback: vi.fn(),
  removeFeedback: vi.fn(),
  replyToFeedback: vi.fn(),
};

describe("Feedback API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("feedbackApi", () => {
    it("loads and maps all feedback", async () => {
      vi.mocked(
        mockedAxios.get,
      ).mockResolvedValue({
        data: [apiFeedback],
      });

      const result =
        await feedbackApi.getAll();

      expect(
        mockedAxios.get,
      ).toHaveBeenCalledWith(
        "/Feedback",
      );

      expect(result).toHaveLength(1);

      expect(result[0]).toMatchObject({
        id: "feedback-1",
        type: "SYSTEM",
        status: "ACTIVE",
        keywords: [],
      });
    });

    it("loads one feedback by id", async () => {
      vi.mocked(
        mockedAxios.get,
      ).mockResolvedValue({
        data: apiFeedback,
      });

      const result =
        await feedbackApi.getById(
          "feedback-1",
        );

      expect(
        mockedAxios.get,
      ).toHaveBeenCalledWith(
        "/Feedback/feedback-1",
      );

      expect(result.type).toBe(
        "SYSTEM",
      );

      expect(result.status).toBe(
        "ACTIVE",
      );
    });

    it("creates system feedback", async () => {
      vi.mocked(
        mockedAxios.post,
      ).mockResolvedValue({
        data: apiFeedback,
      });

      await feedbackApi.createSystemFeedback(
        {
          type: "SYSTEM",
          parkingId: null,
          reservationId: null,
          rating: 5,
          comment:
            "Excellent application",
          keywords: null,
        },
      );

      expect(
        mockedAxios.post,
      ).toHaveBeenCalledWith(
        "/Feedback",
        expect.objectContaining({
          type: 1,
          rating: 5,
          comment:
            "Excellent application",
        }),
      );
    });

    it("creates parking feedback and maps keywords", async () => {
      vi.mocked(
        mockedAxios.post,
      ).mockResolvedValue({
        data: {
          ...apiFeedback,
          type: 0,
          parkingId: "parking-1",
          reservationId:
            "reservation-1",
          keywords: [0, 4],
        },
      });

      await feedbackApi.createParkingFeedback(
        {
          type: "PARKING",
          parkingId: "parking-1",
          reservationId:
            "reservation-1",
          rating: 4,
          comment: "Good parking",
          keywords: [
            "SAFE",
            "AFFORDABLE",
          ],
        },
      );

      expect(
        mockedAxios.post,
      ).toHaveBeenCalledWith(
        "/Feedback",
        expect.objectContaining({
          type: 0,
          parkingId: "parking-1",
          reservationId:
            "reservation-1",
          keywords: [0, 4],
        }),
      );
    });

    it("updates feedback", async () => {
      vi.mocked(
        mockedAxios.put,
      ).mockResolvedValue({
        data: {
          ...apiFeedback,
          type: 0,
          keywords: [1, 2],
        },
      });

      await feedbackApi.update(
        "feedback-1",
        {
          rating: 3,
          comment:
            "Updated feedback",
          keywords: [
            "CLEAN",
            "USER_FRIENDLY",
          ],
        },
      );

      expect(
        mockedAxios.put,
      ).toHaveBeenCalledWith(
        "/Feedback/feedback-1",
        {
          rating: 3,
          comment:
            "Updated feedback",
          keywords: [1, 2],
        },
      );
    });

    it("removes driver feedback", async () => {
      vi.mocked(
        mockedAxios.delete,
      ).mockResolvedValue({
        data: undefined,
      });

      await feedbackApi.remove(
        "feedback-1",
      );

      expect(
        mockedAxios.delete,
      ).toHaveBeenCalledWith(
        "/Feedback/feedback-1",
      );
    });
  });

  describe("feedbackAdminApi", () => {
    it("loads pending feedback", async () => {
      vi.mocked(
        mockedAxios.get,
      ).mockResolvedValue({
        data: [apiFeedback],
      });

      await feedbackAdminApi.getPending();

      expect(
        mockedAxios.get,
      ).toHaveBeenCalledWith(
        "/Feedback/pending",
      );
    });

    it("loads hidden feedback", async () => {
      vi.mocked(
        mockedAxios.get,
      ).mockResolvedValue({
        data: [apiFeedback],
      });

      await feedbackAdminApi.getHidden();

      expect(
        mockedAxios.get,
      ).toHaveBeenCalledWith(
        "/Feedback/hidden",
      );
    });

    it("approves feedback", async () => {
      vi.mocked(
        mockedAxios.patch,
      ).mockResolvedValue({
        data: undefined,
      });

      await feedbackAdminApi.approve(
        "feedback-1",
      );

      expect(
        mockedAxios.patch,
      ).toHaveBeenCalledWith(
        "/Feedback/feedback-1/approve",
      );
    });

    it("hides feedback", async () => {
      vi.mocked(
        mockedAxios.patch,
      ).mockResolvedValue({
        data: undefined,
      });

      await feedbackAdminApi.hide(
        "feedback-1",
      );

      expect(
        mockedAxios.patch,
      ).toHaveBeenCalledWith(
        "/Feedback/feedback-1/hide",
      );
    });

    it("restores feedback", async () => {
      vi.mocked(
        mockedAxios.patch,
      ).mockResolvedValue({
        data: undefined,
      });

      await feedbackAdminApi.restore(
        "feedback-1",
      );

      expect(
        mockedAxios.patch,
      ).toHaveBeenCalledWith(
        "/Feedback/feedback-1/restore",
      );
    });

    it("removes feedback as admin", async () => {
      vi.mocked(
        mockedAxios.delete,
      ).mockResolvedValue({
        data: undefined,
      });

      await feedbackAdminApi.remove(
        "feedback-1",
      );

      expect(
        mockedAxios.delete,
      ).toHaveBeenCalledWith(
        "/Feedback/admin/feedback-1",
      );
    });
  });

  describe("feedbackReplyApi", () => {
    it("creates a feedback reply", async () => {
      vi.mocked(
        mockedAxios.post,
      ).mockResolvedValue({
        data: {
          id: "reply-1",
          repliedByUserId:
            "admin-1",
          role: "ADMIN",
          message: "Thank you",
          createdAt:
            "2026-10-01T10:00:00Z",
        },
      });

      await feedbackReplyApi.create({
        feedbackId:
          "feedback-1",
        message: "Thank you",
      });

      expect(
        mockedAxios.post,
      ).toHaveBeenCalledWith(
        "/FeedbackReply",
        {
          feedbackId:
            "feedback-1",
          message: "Thank you",
        },
      );
    });

    it("loads replies for feedback", async () => {
      vi.mocked(
        mockedAxios.get,
      ).mockResolvedValue({
        data: [],
      });

      await feedbackReplyApi.getByFeedbackId(
        "feedback-1",
      );

      expect(
        mockedAxios.get,
      ).toHaveBeenCalledWith(
        "/FeedbackReply/feedback-1",
      );
    });
  });
});

describe("Feedback Components", () => {
  describe("SystemFeedbackForm", () => {
    it("prevents submission before required data is entered", () => {
      render(
        <SystemFeedbackForm
          isSubmitting={false}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
      );

      expect(
        screen.getByRole(
          "button",
          {
            name:
              "Submit Feedback",
          },
        ),
      ).toBeDisabled();
    });

    it("submits trimmed system feedback", async () => {
      const user =
        userEvent.setup();

      const onSubmit = vi
        .fn()
        .mockResolvedValue(
          undefined,
        );

      render(
        <SystemFeedbackForm
          isSubmitting={false}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "5 stars",
          },
        ),
      );

      await user.type(
        screen.getByPlaceholderText(
          "Tell us about your QuickPark experience...",
        ),
        "  Excellent parking platform  ",
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Submit Feedback",
          },
        ),
      );

      expect(
        onSubmit,
      ).toHaveBeenCalledWith(
        5,
        "Excellent parking platform",
      );

      expect(
        await screen.findByText(
          "Thank you for your feedback",
        ),
      ).toBeInTheDocument();
    });

    it("calls cancel", async () => {
      const user =
        userEvent.setup();

      const onCancel = vi.fn();

      render(
        <SystemFeedbackForm
          isSubmitting={false}
          onSubmit={vi.fn()}
          onCancel={onCancel}
        />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "Cancel",
          },
        ),
      );

      expect(
        onCancel,
      ).toHaveBeenCalledOnce();
    });
  });

  describe("ParkingFeedbackForm", () => {
    it("submits parking feedback with selected keywords", async () => {
      const user =
        userEvent.setup();

      const onSubmit = vi
        .fn()
        .mockResolvedValue(
          undefined,
        );

      render(
        <ParkingFeedbackForm
          reservationId="reservation-10"
          parkingId="parking-10"
          parkingName="Colombo City Parking"
          isSubmitting={false}
          onSubmit={onSubmit}
        />,
      );

      expect(
        screen.getByText(
          "Colombo City Parking",
        ),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "4 stars",
          },
        ),
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "Safe",
          },
        ),
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "Affordable",
          },
        ),
      );

      await user.type(
        screen.getByPlaceholderText(
          "Share your parking experience...",
        ),
        "  Good and secure parking  ",
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Submit Parking Feedback",
          },
        ),
      );

      expect(
        onSubmit,
      ).toHaveBeenCalledWith({
        type: "PARKING",
        parkingId:
          "parking-10",
        reservationId:
          "reservation-10",
        rating: 4,
        comment:
          "Good and secure parking",
        keywords: [
          "SAFE",
          "AFFORDABLE",
        ],
      });
    });
  });

  describe("DriverFeedbackCard", () => {
    it("renders feedback, keywords and replies", () => {
      render(
        <DriverFeedbackCard
          feedback={createFeedback({
            type: "PARKING",
            keywords: [
              "SAFE",
              "GOOD_LOCATION",
            ],
            replies: [
              {
                id: "reply-1",
                repliedByUserId:
                  "provider-1",
                role:
                  "PARKING_OWNER",
                message:
                  "Thank you for visiting.",
                createdAt:
                  "2026-10-01T10:00:00Z",
              },
            ],
          })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(
        screen.getByText(
          "QuickPark works very well.",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText("SAFE"),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "GOOD LOCATION",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Provider Replies",
        ),
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          "Thank you for visiting.",
        ),
      ).toBeInTheDocument();
    });

    it("calls edit and remove actions", async () => {
      const user =
        userEvent.setup();

      const feedback =
        createFeedback({
          type: "PARKING",
        });

      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <DriverFeedbackCard
          feedback={feedback}
          onEdit={onEdit}
          onDelete={onDelete}
        />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /edit/i,
          },
        ),
      );

      expect(
        onEdit,
      ).toHaveBeenCalledWith(
        feedback,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /remove/i,
          },
        ),
      );

      expect(
        onDelete,
      ).toHaveBeenCalledWith(
        feedback,
      );
    });
  });

  describe("FeedbackFilters", () => {
    it("changes search filter", async () => {
      const user =
        userEvent.setup();

      const onChange = vi.fn();

      render(
        <FeedbackFilters
          filters={{
            search: "",
            status: "ALL",
          }}
          onChange={onChange}
        />,
      );

      await user.type(
        screen.getByPlaceholderText(
          "Search system feedback...",
        ),
        "John",
      );

      expect(
        onChange,
      ).toHaveBeenCalled();
    });

    it("changes status filter", () => {
      const onChange = vi.fn();

      render(
        <FeedbackFilters
          filters={{
            search: "",
            status: "ALL",
          }}
          onChange={onChange}
        />,
      );

      fireEvent.change(
        screen.getByRole(
          "combobox",
        ),
        {
          target: {
            value:
              "PENDING_APPROVAL",
          },
        },
      );

      expect(
        onChange,
      ).toHaveBeenCalledWith({
        search: "",
        status:
          "PENDING_APPROVAL",
      });
    });
  });

  describe("FeedbackStats", () => {
    it("calculates feedback statistics", () => {
      render(
        <FeedbackStats
          feedbacks={[
            createFeedback({
              id: "1",
              status:
                "ACTIVE",
              rating: 5,
            }),
            createFeedback({
              id: "2",
              status:
                "PENDING_APPROVAL",
              rating: 3,
            }),
          ]}
        />,
      );

      const visibleCard =
        screen.getByText(
          "Visible Feedback",
        ).parentElement;

      expect(
        visibleCard,
      ).not.toBeNull();

      expect(
        within(
          visibleCard!,
        ).getByText("1"),
      ).toBeInTheDocument();

      const totalCard =
        screen.getByText(
          "Total Loaded",
        ).parentElement;

      expect(
        within(
          totalCard!,
        ).getByText("2"),
      ).toBeInTheDocument();

      const averageCard =
        screen.getByText(
          "Average Rating",
        ).parentElement;

      expect(
        within(
          averageCard!,
        ).getByText("4.0"),
      ).toBeInTheDocument();
    });
  });

  describe("FeedbackTable", () => {
    it("shows empty state", () => {
      render(
        <FeedbackTable
          feedbacks={[]}
          onView={vi.fn()}
          onReply={vi.fn()}
          onHide={vi.fn()}
          onRestore={vi.fn()}
          onDelete={vi.fn()}
        />,
      );

      expect(
        screen.getByText(
          "No feedback found",
        ),
      ).toBeInTheDocument();
    });

    it("calls table actions", async () => {
      const user =
        userEvent.setup();

      const feedback =
        createFeedback({
          status: "ACTIVE",
        });

      const onView = vi.fn();
      const onReply = vi.fn();
      const onHide = vi.fn();
      const onDelete = vi.fn();

      render(
        <FeedbackTable
          feedbacks={[
            feedback,
          ]}
          onView={onView}
          onReply={onReply}
          onHide={onHide}
          onRestore={vi.fn()}
          onDelete={onDelete}
        />,
      );

      await user.click(
        screen.getByTitle(
          "View",
        ),
      );

      expect(
        onView,
      ).toHaveBeenCalledWith(
        feedback,
      );

      await user.click(
        screen.getByTitle(
          "Reply",
        ),
      );

      expect(
        onReply,
      ).toHaveBeenCalledWith(
        feedback,
      );

      await user.click(
        screen.getByTitle(
          "Hide",
        ),
      );

      expect(
        onHide,
      ).toHaveBeenCalledWith(
        feedback,
      );

      await user.click(
        screen.getByTitle(
          "Remove",
        ),
      );

      expect(
        onDelete,
      ).toHaveBeenCalledWith(
        feedback,
      );
    });

    it("shows restore action for hidden feedback", async () => {
      const user =
        userEvent.setup();

      const feedback =
        createFeedback({
          status: "HIDDEN",
        });

      const onRestore =
        vi.fn();

      render(
        <FeedbackTable
          feedbacks={[
            feedback,
          ]}
          onView={vi.fn()}
          onReply={vi.fn()}
          onHide={vi.fn()}
          onRestore={
            onRestore
          }
          onDelete={vi.fn()}
        />,
      );

      await user.click(
        screen.getByTitle(
          "Make visible",
        ),
      );

      expect(
        onRestore,
      ).toHaveBeenCalledWith(
        feedback,
      );

      expect(
        screen.queryByTitle(
          "Hide",
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe(
    "FeedbackModerationDialog",
    () => {
      it("approves pending feedback", async () => {
        const user =
          userEvent.setup();

        const onApprove = vi
          .fn()
          .mockResolvedValue(
            undefined,
          );

        const onClose =
          vi.fn();

        render(
          <FeedbackModerationDialog
            feedback={createFeedback()}
            isOpen
            isLoading={false}
            onClose={onClose}
            onReply={vi.fn()}
            onApprove={
              onApprove
            }
          />,
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Approve Feedback",
            },
          ),
        );

        expect(
          onApprove,
        ).toHaveBeenCalledWith(
          "feedback-1",
        );

        expect(
          onClose,
        ).toHaveBeenCalled();
      });

      it("sends trimmed admin reply", async () => {
        const user =
          userEvent.setup();

        const onReply = vi
          .fn()
          .mockResolvedValue(
            undefined,
          );

        render(
          <FeedbackModerationDialog
            feedback={createFeedback(
              {
                status:
                  "ACTIVE",
              },
            )}
            isOpen
            isLoading={false}
            onClose={vi.fn()}
            onReply={onReply}
            onApprove={vi.fn()}
          />,
        );

        await user.type(
          screen.getByPlaceholderText(
            "Write a reply...",
          ),
          "  Thank you for the feedback  ",
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Send Reply",
            },
          ),
        );

        expect(
          onReply,
        ).toHaveBeenCalledWith(
          "feedback-1",
          "Thank you for the feedback",
        );
      });
    },
  );

  describe("Shared feedback components", () => {
    it("renders star rating accessibility text", () => {
      render(
        <StarRating
          rating={4}
        />,
      );

      expect(
        screen.getByLabelText(
          "4 out of 5 stars",
        ),
      ).toBeInTheDocument();
    });

    it("renders feedback status", () => {
      render(
        <FeedbackStatusBadge
          status="PENDING_APPROVAL"
        />,
      );

      expect(
        screen.getByText(
          "Pending Approval",
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("Feedback Pages", () => {
  const showToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(
      useToast,
    ).mockReturnValue({
      showToast,
    });

    vi.mocked(
      useDriverFeedback,
    ).mockReturnValue(
      driverHookDefaults,
    );

    vi.mocked(
      useAdminFeedback,
    ).mockReturnValue(
      adminHookDefaults,
    );
  });

  describe("Driver FeedbackPage", () => {
    it("shows empty feedback state", () => {
      render(
        <FeedbackPage />,
      );

      expect(
        screen.getByText(
          "No parking feedback yet",
        ),
      ).toBeInTheDocument();
    });

    it("shows driver parking feedback", () => {
      vi.mocked(
        useDriverFeedback,
      ).mockReturnValue({
        ...driverHookDefaults,
        feedbacks: [
          createFeedback({
            type: "PARKING",
            parkingId:
              "parking-1",
            reservationId:
              "reservation-1",
            comment:
              "Secure parking location",
          }),
        ],
      });

      render(
        <FeedbackPage />,
      );

      expect(
        screen.getByText(
          "Secure parking location",
        ),
      ).toBeInTheDocument();
    });

    it("shows feedback loading error", () => {
      vi.mocked(
        useDriverFeedback,
      ).mockReturnValue({
        ...driverHookDefaults,
        error:
          "Unable to load your parking feedback.",
      });

      render(
        <FeedbackPage />,
      );

      expect(
        screen.getByText(
          "Unable to load your parking feedback.",
        ),
      ).toBeInTheDocument();
    });

    it("submits system feedback", async () => {
      const user =
        userEvent.setup();

      const createSystemSpy =
        vi.spyOn(
          feedbackApi,
          "createSystemFeedback",
        );

      createSystemSpy.mockResolvedValue(
        createFeedback({
          status:
            "PENDING_APPROVAL",
        }),
      );

      render(
        <FeedbackPage />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              /give system feedback/i,
          },
        ),
      );

      expect(
        screen.getByText(
          "Share your QuickPark experience",
        ),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole(
          "button",
          {
            name: "5 stars",
          },
        ),
      );

      await user.type(
        screen.getByPlaceholderText(
          "Tell us about your QuickPark experience...",
        ),
        "Great QuickPark system",
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name:
              "Submit Feedback",
          },
        ),
      );

      expect(
        createSystemSpy,
      ).toHaveBeenCalledWith({
        type: "SYSTEM",
        parkingId: null,
        reservationId: null,
        rating: 5,
        comment:
          "Great QuickPark system",
        keywords: null,
      });

      expect(
        showToast,
      ).toHaveBeenCalledWith(
        "Your feedback has been submitted for admin review.",
        "success",
      );
    });

    it("removes parking feedback after confirmation", async () => {
      const user =
        userEvent.setup();

      const deleteFeedback =
        vi
          .fn()
          .mockResolvedValue(
            undefined,
          );

      vi.mocked(
        useDriverFeedback,
      ).mockReturnValue({
        ...driverHookDefaults,
        feedbacks: [
          createFeedback({
            type: "PARKING",
            parkingId:
              "parking-1",
            reservationId:
              "reservation-1",
          }),
        ],
        deleteFeedback,
      });

      render(
        <FeedbackPage />,
      );

      await user.click(
        screen.getByRole(
          "button",
          {
            name: /remove/i,
          },
        ),
      );

      expect(
        screen.getByText(
          "Remove parking feedback?",
        ),
      ).toBeInTheDocument();

      const removeButtons =
        screen.getAllByRole(
          "button",
          {
            name: "Remove",
          },
        );

      await user.click(
        removeButtons[
          removeButtons.length -
            1
        ],
      );

      expect(
        deleteFeedback,
      ).toHaveBeenCalledWith(
        "feedback-1",
      );
    });
  });

  describe(
    "FeedbackManagementPage",
    () => {
      it("shows only system feedback", () => {
        vi.mocked(
          useAdminFeedback,
        ).mockReturnValue({
          ...adminHookDefaults,
          feedbacks: [
            createFeedback({
              id: "system-1",
              type: "SYSTEM",
              userName:
                "System Feedback User",
            }),
            createFeedback({
              id: "parking-1",
              type: "PARKING",
              userName:
                "Parking Feedback User",
            }),
          ],
        });

        render(
          <FeedbackManagementPage />,
        );

        expect(
          screen.getByText(
            "System Feedback User",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            "Parking Feedback User",
          ),
        ).not.toBeInTheDocument();
      });

      it("filters feedback using search", async () => {
        const user =
          userEvent.setup();

        vi.mocked(
          useAdminFeedback,
        ).mockReturnValue({
          ...adminHookDefaults,
          feedbacks: [
            createFeedback({
              id: "1",
              userName:
                "Alice",
            }),
            createFeedback({
              id: "2",
              userName:
                "Bob",
              comment:
                "Needs improvement",
            }),
          ],
        });

        render(
          <FeedbackManagementPage />,
        );

        const search =
          screen.getByPlaceholderText(
            "Search system feedback...",
          );

        await user.type(
          search,
          "Alice",
        );

        expect(
          screen.getByText(
            "Alice",
          ),
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            "Bob",
          ),
        ).not.toBeInTheDocument();
      });

      it("refreshes admin feedback", async () => {
        const user =
          userEvent.setup();

        const fetchData =
          vi.fn();

        vi.mocked(
          useAdminFeedback,
        ).mockReturnValue({
          ...adminHookDefaults,
          fetchData,
        });

        render(
          <FeedbackManagementPage />,
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                /refresh/i,
            },
          ),
        );

        expect(
          fetchData,
        ).toHaveBeenCalledOnce();
      });

      it("shows loading failure and retries", async () => {
        const user =
          userEvent.setup();

        const fetchData =
          vi.fn();

        vi.mocked(
          useAdminFeedback,
        ).mockReturnValue({
          ...adminHookDefaults,
          error:
            "Unable to load feedback management data.",
          fetchData,
        });

        render(
          <FeedbackManagementPage />,
        );

        expect(
          screen.getByText(
            "Unable to load feedback",
          ),
        ).toBeInTheDocument();

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                /try again/i,
            },
          ),
        );

        expect(
          fetchData,
        ).toHaveBeenCalledOnce();
      });
    },
  );
});