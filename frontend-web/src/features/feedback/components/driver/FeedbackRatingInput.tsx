import { Star } from "lucide-react";

interface FeedbackRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const FeedbackRatingInput = ({
  value,
  onChange,
  disabled = false,
}: FeedbackRatingInputProps) => {
  return (
    <div
      className="flex gap-2"
      aria-label="Feedback rating"
    >
      {Array.from(
        { length: 5 },
        (_, index) => index + 1,
      ).map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          onClick={() => onChange(rating)}
          className="rounded-lg p-1 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`${rating} stars`}
        >
          <Star
            className={
              rating <= value
                ? "h-8 w-8 fill-amber-400 text-amber-400"
                : "h-8 w-8 text-slate-300"
            }
          />
        </button>
      ))}
    </div>
  );
};