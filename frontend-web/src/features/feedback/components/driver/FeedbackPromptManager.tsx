import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Modal from "../../../../components/common/Modal/Modal";
import Button from "../../../../components/common/Button/Button";
import { useToast } from "../../../../hooks/useToast";
import { reservationApi } from "../../../reservations/api/reservationApi";
import type {Reservation,} from "../../../reservations/types/reservationTypes";
import { feedbackApi } from "../../api/feedbackApi";
import { FirstExperienceSystemFeedbackForm } from "./FirstExperienceSystemFeedbackForm";
import { ParkingFeedbackForm } from "./ParkingFeedbackForm";

type PromptStep =
  | "NONE"
  | "PARKING"
  | "SYSTEM";

export const FeedbackPromptManager = () => {
  const { showToast } = useToast();

  const [promptStep, setPromptStep] =
    useState<PromptStep>("NONE");

  const [
    pendingReservation,
    setPendingReservation,
  ] = useState<Reservation | null>(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    showSkipConfirmation,
    setShowSkipConfirmation,
  ] = useState(false);

  const [
    showParkingRequiredMessage,
    setShowParkingRequiredMessage,
  ] = useState(false);

  const checkForParkingFeedback =
    useCallback(async () => {
      try {
        const [
          checkedOutReservations,
          existingParkingFeedback,
        ] = await Promise.all([
          reservationApi.getMine(
            "CHECKED_OUT",
          ),

          feedbackApi.getMyParkingFeedback(),
        ]);
       
        const reviewedReservationIds =
          new Set(
            existingParkingFeedback
              .map(
                (feedback) =>
                  feedback.reservationId,
              )
              .filter(
                (
                  reservationId,
                ): reservationId is string =>
                  reservationId !== null,
              ),
          );

        const reservation =
          checkedOutReservations.find(
            (item) =>
              !reviewedReservationIds.has(
                item.reservationId,
              ),
          );

        if (!reservation) {
          return;
        }

        setPendingReservation(
          reservation,
        );

        setPromptStep("PARKING");
      } catch (error) {
        console.error(
            "Failed to check for pending parking feedback:",
            error,
        );
        }
    }, []);

   useEffect(() => {
    const timerId =
      window.setTimeout(() => {
        void checkForParkingFeedback();
      }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [checkForParkingFeedback]);

  const handleParkingFeedbackSuccess =
    async () => {
      const reservations =
        await reservationApi.getMine();

      const completedReservations =
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "COMPLETED",
        );
 
      if (
        completedReservations.length === 1
      ) {
        setPromptStep("SYSTEM");

        return;
      }

      setPendingReservation(null);

      setPromptStep("NONE");
    };

  const handleParkingFeedbackClose = () => {
    if (isSubmitting) {
      return;
    }

    setShowParkingRequiredMessage(true);
  };

  const continueParkingFeedback = () => {
    setShowParkingRequiredMessage(false);
  };

  const handleSystemFeedbackClose = () => {
    if (isSubmitting) {
      return;
    }

    setShowSkipConfirmation(true);
  };

  const continueSystemFeedback = () => {
    setShowSkipConfirmation(false);
  };

  const skipSystemFeedback = () => {
    setShowSkipConfirmation(false);

    setPendingReservation(null);

    setPromptStep("NONE");
  };

  return (
    <>
      <Modal
        isOpen={
          promptStep === "PARKING" &&
          pendingReservation !== null &&
          !showParkingRequiredMessage
        }
        onClose={
          handleParkingFeedbackClose
        }
        title="How was your parking experience?"
        maxWidth="max-w-xl"
      >
        {pendingReservation && (
          <ParkingFeedbackForm
            reservationId={
              pendingReservation.reservationId
            }
            parkingId={
              pendingReservation.facilityId
            }
            parkingName={
              pendingReservation.facilityName
            }
            isSubmitting={
              isSubmitting
            }
            onSubmit={async (
              request,
            ) => {
              try {
                setIsSubmitting(true);
                await feedbackApi.createParkingFeedback(
                  request,
                );

                showToast(
                  "Parking feedback submitted successfully.",
                  "success",
                );

                await handleParkingFeedbackSuccess();
              } catch {
                showToast(
                  "Unable to submit parking feedback.",
                  "error",
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={
          showParkingRequiredMessage
        }
        onClose={
          continueParkingFeedback
        }
        title="Parking feedback is required"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium leading-6 text-slate-700">
              Parking feedback is required to
              complete this reservation.
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your feedback helps us understand
              your parking experience and helps
              parking providers continue
              improving their service.
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Please take a moment to rate your
              experience and complete your
              reservation.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={
                continueParkingFeedback
              }
            >
              Continue Feedback
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={
          promptStep === "SYSTEM" &&
          !showSkipConfirmation
        }
        onClose={
          handleSystemFeedbackClose
        }
        title="One last thing — we'd love your feedback"
        maxWidth="max-w-xl"
       >
        <FirstExperienceSystemFeedbackForm
          isSubmitting={
            isSubmitting
          }
          onSubmit={async (
            request,
          ) => {
            try {
              setIsSubmitting(true);

              await feedbackApi.createSystemFeedback(
                request,
              );

              showToast(
                "Thank you! Your feedback has been submitted for review.",
                "success",
              );

              setShowSkipConfirmation(
                false,
              );

              setShowParkingRequiredMessage(
                false,
              );

              setPendingReservation(
                null,
              );

              setPromptStep(
                "NONE",
              );
            } catch {
              showToast(
                "Unable to submit system feedback.",
                "error",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </Modal>

      <Modal
        isOpen={
          showSkipConfirmation
        }
        onClose={
          continueSystemFeedback
        }
        title="Your feedback matters to us"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm leading-6 text-slate-600">
              Your experience helps us
              understand whether QuickPark is
              working well and where we can
              improve.
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              We only ask for this feedback
              after your first parking
              experience, and we'd really
              appreciate a moment of your time
              to share your thoughts.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={
                skipSystemFeedback
              }
            >
              Skip for now
            </Button>

            <Button
              type="button"
              onClick={
                continueSystemFeedback
              }
            >
              Continue Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};