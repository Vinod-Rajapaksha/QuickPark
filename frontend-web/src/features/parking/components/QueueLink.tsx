import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { FacilityQueueRow } from "../types/parkingTypes";

// Carries the admin's active filters along, so going back leaves the queue as they left it.
export const QueueLink: React.FC<{ row: FacilityQueueRow; search: string }> = ({
  row,
  search,
}) => (
  <Link
    to={`/admin/properties/${row.facility.facilityId}${search ? `?${search}` : ""}`}
    className="flex items-center gap-1 font-medium text-primary-700 hover:text-primary-800 hover:underline"
  >
    Review
    <ChevronRight size={16} />
  </Link>
);

export default QueueLink;
