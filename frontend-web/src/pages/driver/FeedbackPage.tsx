import {
  useState,
} from "react";
import {
  MessageSquarePlus,
} from "lucide-react";
import Button from "../../components/common/Button/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import Modal from "../../components/common/Modal/Modal";
import { Skeleton } from "../../components/common/Skeleton/Skeleton";
import { DriverFeedbackCard } from "../../features/feedback/components/driver/DriverFeedbackCard";
import { EditParkingFeedbackDialog } from "../../features/feedback/components/driver/EditParkingFeedbackDialog";
import { SystemFeedbackForm } from "../../features/feedback/components/public/SystemFeedbackForm";
import { feedbackApi } from "../../features/feedback/api/feedbackApi";
import { useDriverFeedback } from "../../features/feedback/hooks/useDriverFeedback";
import type {
  Feedback,
} from "../../features/feedback/types/feedbackTypes";
import { useToast } from "../../hooks/useToast";

const FeedbackPage = () => {
  const {
    feedbacks,
    isLoading,
    isSubmitting,
    error,
    updateFeedback,
    deleteFeedback,
  } = useDriverFeedback();

  const { showToast } =
    useToast();

  const [
    systemFeedbackOpen,
    setSystemFeedbackOpen,
  ] = useState(false);

  const [
    systemSubmitting,
    setSystemSubmitting,
  ] = useState(false);

  const [
    editingFeedback,
    setEditingFeedback,
  ] =
    useState<Feedback | null>(
      null,
    );

  const [
    deletingFeedback,
    setDeletingFeedback,
  ] =
    useState<Feedback | null>(
      null,
    );

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Feedback & Ratings
          </span>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Your Parking Feedback
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            View and manage feedback from
            your parking experiences,
            including ratings and provider
            replies.
          </p>
        </div>

        <Button
          onClick={() =>
            setSystemFeedbackOpen(
              true,
            )
          }
        >
          <MessageSquarePlus
            size={18}
          />

          Give System Feedback
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="font-semibold text-slate-900">
            No parking feedback yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            After you check out from a
            parking reservation and submit
            your parking feedback, it will
            appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {feedbacks.map(
            (feedback) => (
              <DriverFeedbackCard
                key={feedback.id}
                feedback={
                  feedback
                }
                onEdit={
                  setEditingFeedback
                }
                onDelete={
                  setDeletingFeedback
                }
              />
            ),
          )}
        </div>
      )}

      <Modal
        isOpen={
          systemFeedbackOpen
        }
        onClose={() =>
          setSystemFeedbackOpen(
            false,
          )
        }
        title="Share your QuickPark experience"
      >
        <SystemFeedbackForm
          isSubmitting={
            systemSubmitting
          }
          onSubmit={async (
            rating,
            comment,
          ) => {
            try {
              setSystemSubmitting(
                true,
              );

              await feedbackApi.createSystemFeedback(
                {
                  type: "SYSTEM",
                  parkingId: null,
                  reservationId: null,
                  rating,
                  comment,
                  keywords: null,
                },
              );

              showToast(
                "Your feedback has been submitted for admin review.",
                "success",
              );
            } catch {
              showToast(
                "Unable to submit system feedback.",
                "error",
              );

              throw new Error(
                "System feedback submission failed.",
              );
            } finally {
              setSystemSubmitting(
                false,
              );
            }
          }}
          onCancel={() =>
            setSystemFeedbackOpen(
              false,
            )
          }
        />
      </Modal>

      <EditParkingFeedbackDialog
        feedback={
          editingFeedback
        }
        isSubmitting={
          isSubmitting
        }
        onClose={() =>
          setEditingFeedback(
            null,
          )
        }
        onSave={async (
          id,
          request,
        ) => {
          try {
            await updateFeedback(
              id,
              request,
            );

            setEditingFeedback(
              null,
            );

            showToast(
              "Parking feedback updated successfully.",
              "success",
            );
          } catch {
            showToast(
              "Unable to update parking feedback.",
              "error",
            );
          }
        }}
      />

      {/* Remove Parking Feedback */}
      <ConfirmDialog
        isOpen={
          deletingFeedback !==
          null
        }
        title="Remove parking feedback?"
        description="Are you sure you want to remove this parking feedback?"
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        isLoading={isSubmitting}
        onClose={() =>
          setDeletingFeedback(
            null,
          )
        }
        onConfirm={async () => {
          if (
            !deletingFeedback
          ) {
            return;
          }

          try {
            await deleteFeedback(
              deletingFeedback.id,
            );

            setDeletingFeedback(
              null,
            );

            showToast(
              "Parking feedback removed.",
              "success",
            );
          } catch {
            showToast(
              "Unable to remove parking feedback.",
              "error",
            );
          }
        }}
      />
    </div>
  );
};

export default FeedbackPage;