import {useState,type FormEvent,} from "react";
import Button from "../../../../components/common/Button/Button";
import Modal from "../../../../components/common/Modal/Modal";
import {FeedbackKeywordType,} from "../../types/feedbackTypes";
import type {Feedback,UpdateFeedbackRequest,} from "../../types/feedbackTypes";
import { FeedbackRatingInput } from "./FeedbackRatingInput";

const keywordOptions =
  Object.values(
    FeedbackKeywordType,
  );

interface EditParkingFeedbackDialogProps {
  feedback: Feedback | null;
  isSubmitting: boolean;

  onClose: () => void;

  onSave: (
    id: string,
    request: UpdateFeedbackRequest,
  ) => Promise<void>;
}

interface EditFormProps {
  feedback: Feedback;
  isSubmitting: boolean;

  onClose: () => void;

  onSave: (
    id: string,
    request: UpdateFeedbackRequest,
  ) => Promise<void>;
}

const EditForm = ({
  feedback,
  isSubmitting,
  onClose,
  onSave,
}: EditFormProps) => {
  const [rating, setRating] =
    useState(feedback.rating);

  const [comment, setComment] =
    useState(feedback.comment ?? "");

  const [
    selectedKeywords,
    setSelectedKeywords,
  ] = useState<FeedbackKeywordType[]>(
    feedback.keywords,
  );

  const toggleKeyword = (
    keyword: FeedbackKeywordType,
  ) => {
    setSelectedKeywords((current) =>
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

    await onSave(feedback.id, {
      rating,
      comment: comment.trim(),
      keywords: selectedKeywords,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">
          Rating
        </label>

        <FeedbackRatingInput
          value={rating}
          onChange={setRating}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Parking highlights
        </label>

        <div className="flex flex-wrap gap-2">
          {keywordOptions.map((keyword) => {
            const selected =
              selectedKeywords.includes(keyword);

            return (
              <button
                key={keyword}
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  toggleKeyword(keyword)
                }
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {keyword.replaceAll(
                  "_",
                  " ",
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Comment
        </label>

        <textarea
          value={comment}
          maxLength={1000}
          disabled={isSubmitting}
          onChange={(event) =>
            setComment(event.target.value)
          }
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />

        <div className="mt-1 text-right text-xs text-slate-400">
          {comment.length}/1000
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting}
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={
            isSubmitting ||
            rating === 0
          }
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export const EditParkingFeedbackDialog = ({
  feedback,
  isSubmitting,
  onClose,
  onSave,
}: EditParkingFeedbackDialogProps) => {
  if (!feedback) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Parking Feedback"
      maxWidth="max-w-xl"
    >
      <EditForm
        key={feedback.id}
        feedback={feedback}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
};