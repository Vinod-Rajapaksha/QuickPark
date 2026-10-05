import React from "react";
import { SearchX } from "lucide-react";
import Alert from "../../../components/feedback/Alert";
import Button from "../../../components/common/Button/Button";
import Spinner from "../../../components/common/Spinner/Spinner";
import ParkingResultCard from "./ParkingResultCard";
import DiscoveryPagination from "./DiscoveryPagination";
import type { ParkingFacility } from "../types/parkingTypes";

interface DiscoveryResultsProps {
  isLoading: boolean;
  loadError: string | null;
  total: number;
  pageItems: ParkingFacility[];
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onViewDetails: (facility: ParkingFacility) => void;
  emptyTitle: string;
  emptyHint: string;
}

export const DiscoveryResults: React.FC<DiscoveryResultsProps> = ({
  isLoading,
  loadError,
  total,
  pageItems,
  page,
  pageCount,
  onPageChange,
  onRetry,
  onViewDetails,
  emptyTitle,
  emptyHint,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert tone="error" title="Could not load parking options">
          {loadError}
        </Alert>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-14 text-center">
        <SearchX size={32} className="text-slate-300" />
        <p className="mt-3 font-medium text-slate-700">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
        {pageItems.map((facility) => (
          <ParkingResultCard
            key={facility.facilityId}
            facility={facility}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
      <DiscoveryPagination
        page={page}
        pageCount={pageCount}
        total={total}
        onChange={onPageChange}
      />
    </div>
  );
};

export default DiscoveryResults;
