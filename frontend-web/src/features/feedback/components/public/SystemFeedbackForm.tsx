import { useState } from 'react';
import type {FormEvent,} from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import  Button  from '../../../../components/common/Button/Button';

interface SystemFeedbackFormProps {
  isSubmitting: boolean;

  onSubmit: (
    rating: number,
    comment: string
  ) => Promise<void>;

  onCancel: () => void;
}

export const SystemFeedbackForm = ({
  isSubmitting,
  onSubmit,
  onCancel,
}: SystemFeedbackFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (rating < 1 || !comment.trim()) {
      return;
    }

    await onSubmit(rating, comment.trim());

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>

        <h3 className="text-lg font-semibold text-slate-900">
          Thank you for your feedback
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Your feedback has been submitted and is waiting
          for approval before appearing publicly.
        </p>

        <div className="mt-6">
          <Button onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div>
        <label className="mb-3 block text-sm font-medium text-slate-700">
          How would you rate QuickPark?
        </label>

        <div className="flex gap-2">
          {Array.from({ length: 5 }).map(
            (_, index) => {
              const value = index + 1;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-lg p-1 transition hover:scale-110"
                  aria-label={`${value} stars`}
                >
                  <Star
                    className={
                      value <= rating
                        ? 'h-8 w-8 fill-amber-400 text-amber-400'
                        : 'h-8 w-8 text-slate-300'
                    }
                  />
                </button>
              );
            }
          )}
        </div>

        {rating === 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Select a rating from 1 to 5.
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tell us about your experience
        </label>

        <textarea
            value={comment}
            onChange={(event) =>
            setComment(event.target.value)
            }
            placeholder="Tell us about your QuickPark experience..."
            rows={5}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <div className="mt-1 text-right text-xs text-slate-400">
          {comment.length}/1000
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            rating === 0 ||
            !comment.trim()
          }
        >
          {isSubmitting
            ? 'Submitting...'
            : 'Submit Feedback'}
        </Button>
      </div>
    </form>
  );
};