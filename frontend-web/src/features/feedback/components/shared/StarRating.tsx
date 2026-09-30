import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
}

export const StarRating = ({
  rating,
  size = 18,
}: StarRatingProps) => {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const active = index < rating;

        return (
          <Star
            key={index}
            size={size}
            className={
              active
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }
          />
        );
      })}
    </div>
  );
};