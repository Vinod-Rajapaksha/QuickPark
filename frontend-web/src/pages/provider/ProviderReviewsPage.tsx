import { useMemo } from 'react';
import { MessageSquareText, RefreshCw, Star } from 'lucide-react';
import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import Spinner from '../../components/common/Spinner/Spinner';
import { useFeedback } from '../../features/feedback/hooks/useFeedback';
import { useParkings } from '../../features/parking/hooks/useParkings';

export default function ProviderReviewsPage() {
  const { feedbacks, isLoading: feedbackLoading, fetchFeedbacks } = useFeedback();
  const { facilities, isLoading: facilityLoading, refresh: fetchFacilities } = useParkings();

  const isLoading = feedbackLoading || facilityLoading;

  const providerFeedbacks = useMemo(() => {
    if (!facilities.length || !feedbacks.length) return [];
    const facilityIds = new Set(facilities.map(f => f.facilityId));
    return feedbacks.filter(f => f.type === 'PARKING' && f.parkingId && facilityIds.has(f.parkingId));
  }, [facilities, feedbacks]);

  const refreshAll = () => {
    void fetchFeedbacks();
    void fetchFacilities();
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <MessageSquareText size={18} />
            Facility Reviews
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Parking Reviews</h1>
          <p className="mt-2 text-sm text-slate-500">
            See what drivers are saying about your parking facilities.
          </p>
        </div>
        <Button variant="secondary" onClick={refreshAll} disabled={isLoading}>
          <RefreshCw size={17} /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : providerFeedbacks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <MessageSquareText size={48} className="text-slate-200 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No reviews yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Drivers haven't left any feedback on your facilities yet.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providerFeedbacks.map(feedback => {
            const facility = facilities.find(f => f.facilityId === feedback.parkingId);
            return (
              <Card key={feedback.id} className="flex flex-col p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{facility?.name || 'Unknown Facility'}</h4>
                <p className="text-sm text-slate-600 flex-1">{feedback.comment || 'No comment provided.'}</p>
                {feedback.keywords && feedback.keywords.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {feedback.keywords.map((kw) => (
                      <span key={kw} className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">By {feedback.userName}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
