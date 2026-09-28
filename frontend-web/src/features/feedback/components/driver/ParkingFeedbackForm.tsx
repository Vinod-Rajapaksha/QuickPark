import {
  useState,
  type FormEvent,
} from "react";
import Button from "../../../../components/common/Button/Button";
import {FeedbackKeywordType,} from "../../types/feedbackTypes";
import type {
  CreateParkingFeedbackRequest,
} from "../../types/feedbackTypes";
import { FeedbackRatingInput } from "./FeedbackRatingInput";

const keywordOptions = [
  {
    value: FeedbackKeywordType.SAFE,
    label: "Safe",
  },
  {
    value: FeedbackKeywordType.CLEAN,
    label: "Clean",
  },
  {
    value: FeedbackKeywordType.USER_FRIENDLY,
    label: "User friendly",
  },
  {
    value: FeedbackKeywordType.GOOD_LOCATION,
    label: "Good location",
  },
  {
    value: FeedbackKeywordType.AFFORDABLE,
    label: "Affordable",
  },
];

interface ParkingFeedbackFormProps {
  reservationId: string;
  parkingId: string;
  parkingName: string;

  isSubmitting: boolean;

  onSubmit: (
    request: CreateParkingFeedbackRequest,
  ) => Promise<void>;
}

export const ParkingFeedbackForm = ({
  reservationId,
  parkingId,
  parkingName,
  isSubmitting,
  onSubmit,
}: ParkingFeedbackFormProps) => {
  const [rating, setRating] = useState(0);

  const [comment, setComment] =
    useState("");

  const [keywords, setKeywords] =
    useState<FeedbackKeywordType[]>([]);

  const toggleKeyword = (
    keyword: FeedbackKeywordType,
  ) => {
    setKeywords((current) =>
      current.includes(keyword)
        ? current.filter(
            (item) => item !== keyword,
          )
        : [...current, keyword],
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (rating === 0) {
      return;
    }

    await onSubmit({
      type: "PARKING",
      parkingId,
      reservationId,
      rating,
      comment: comment.trim(),
      keywords,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Parking location
        </p>

        <h3 className="mt-1 font-semibold text-slate-900">
          {parkingName}
        </h3>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">
          How was your parking experience?
        </label>

        <FeedbackRatingInput
          value={rating}
          onChange={setRating}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          What stood out?
        </label>

        <div className="flex flex-wrap gap-2">
          {keywordOptions.map((option) => {
            const selected =
              keywords.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  toggleKeyword(option.value)
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tell us more
        </label>

        <textarea
          value={comment}
          disabled={isSubmitting}
          maxLength={1000}
          onChange={(event) =>
            setComment(event.target.value)
          }
          rows={5}
          placeholder="Share your parking experience..."
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />

        <div className="mt-1 text-right text-xs text-slate-400">
          {comment.length}/1000
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={
            isSubmitting ||
            rating === 0
          }
        >
          Submit Parking Feedback
        </Button>
      </div>
    </form>
  );
};