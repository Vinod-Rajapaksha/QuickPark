import {useState,type FormEvent,} from "react";
import {Heart,Star,} from "lucide-react";
import Button from "../../../../components/common/Button/Button";

import type {
  CreateSystemFeedbackRequest,
} from "../../types/feedbackTypes";

interface FirstExperienceSystemFeedbackFormProps {
  isSubmitting: boolean;

  onSubmit: (
    request: CreateSystemFeedbackRequest,
  ) => Promise<void>;
}

export const FirstExperienceSystemFeedbackForm = ({
  isSubmitting,
  onSubmit,
}: FirstExperienceSystemFeedbackFormProps) => {
  const [rating, setRating] = useState(0);

  const [comment, setComment] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      rating === 0 ||
      !comment.trim()
    ) {
      return;
    }

    await onSubmit({
      type: "SYSTEM",
      parkingId: null,
      reservationId: null,
      rating,
      comment: comment.trim(),
      keywords: null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <Heart className="h-5 w-5 text-primary-600" />
        </div>

        <h3 className="font-semibold text-slate-900">
          Thank you for choosing QuickPark!
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          We appreciate your time and kindness.
          Since this was your first parking
          experience with QuickPark, we would
          also love to know whether our system
          worked well for you.
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your feedback helps us improve the
          QuickPark experience for everyone.
        </p>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">
          How would you rate QuickPark?
        </label>

        <div className="flex gap-2">
          {Array.from(
            { length: 5 },
            (_, index) => index + 1,
          ).map((value) => (
            <button
              key={value}
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                setRating(value)
              }
              className="rounded-lg p-1 transition hover:scale-110 disabled:opacity-60"
              aria-label={`${value} stars`}
            >
              <Star
                className={
                  value <= rating
                    ? "h-8 w-8 fill-amber-400 text-amber-400"
                    : "h-8 w-8 text-slate-300"
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          How was your overall QuickPark
          experience?
        </label>

        <textarea
          value={comment}
          disabled={isSubmitting}
          maxLength={1000}
          onChange={(event) =>
            setComment(event.target.value)
          }
          rows={5}
          placeholder="Was QuickPark easy to use? Tell us what worked well or what we could improve..."
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />

        <div className="mt-1 text-right text-xs text-slate-400">
          {comment.length}/1000
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        isLoading={isSubmitting}
        disabled={
          isSubmitting ||
          rating === 0 ||
          !comment.trim()
        }
      >
        Submit System Feedback
      </Button>
    </form>
  );
};