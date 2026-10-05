import React from "react";
import Button from "../../../components/common/Button/Button";

interface DiscoveryPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}

export const DiscoveryPagination: React.FC<DiscoveryPaginationProps> = ({
  page,
  pageCount,
  total,
  onChange,
}) => (
  <nav
    className="flex flex-wrap items-center justify-between gap-3"
    aria-label="Search result pages"
  >
    <p className="text-sm text-slate-500">
      {total} propert{total === 1 ? "y" : "ies"} found
    </p>
    {pageCount > 1 && (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {page} of {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    )}
  </nav>
);

export default DiscoveryPagination;
