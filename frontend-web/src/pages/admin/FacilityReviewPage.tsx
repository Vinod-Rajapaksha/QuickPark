import React from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
} from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import Alert from "../../components/feedback/Alert";
import ParkingStatusBadge from "../../features/parking/components/ParkingStatusBadge";
import ReviewSectionDetails from "../../features/parking/components/ReviewSectionDetails";
import SectionReviews from "../../features/parking/components/SectionReviews";
import {
  useFacilityDetail,
  useFacilityQueue,
} from "../../features/parking/hooks/useFacilityReviews";
import type { FacilitySectionStatus } from "../../features/parking/types/parkingTypes";
import { openSections } from "../../features/parking/utils/parkingUtils";
import { ROUTES } from "../../app/routes/routeConstants";

const sectionIcon = (status: FacilitySectionStatus): React.ReactNode => {
  if (status === "APPROVED") {
    return <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />;
  }
  if (status === "REJECTED") {
    return <AlertTriangle size={16} className="shrink-0 text-red-500" />;
  }
  return <Circle size={16} className="shrink-0 text-slate-300" />;
};

export const FacilityReviewPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { rows } = useFacilityQueue();
  const {
    review,
    facility,
    isLoading,
    loadError,
    busyKey,
    decideSection,
  } = useFacilityDetail(facilityId ?? null);

  // Queue filters ride along; `section` is dropped on the way back so the queue reopens where it was left.
  const filtersOnly = (() => {
    const next = new URLSearchParams(searchParams);
    next.delete("section");
    return next.toString();
  })();
  const queueHref = `${ROUTES.ADMIN_PROPERTIES}${filtersOnly ? `?${filtersOnly}` : ""}`;
  // Walking the queue keeps the open tab, so one check can be judged down the whole list.
  const walkingQuery = searchParams.toString();
  const hrefOf = (id: string) =>
    `${ROUTES.adminPropertyPath(id)}${walkingQuery ? `?${walkingQuery}` : ""}`;

  const sections = facility?.sections ?? [];
  const wanted = searchParams.get("section");
  const current = sections.find((section) => section.section === wanted) ?? sections[0] ?? null;

  const openSection = (name: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("section", name);
    setSearchParams(next, { replace: true });
  };

  const position = rows.findIndex((row) => row.facility.facilityId === facilityId);
  const previous = position > 0 ? rows[position - 1] : null;
  const nextRow = position >= 0 ? rows[position + 1] ?? null : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!review || !facility) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          to={queueHref}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to the queue
        </Link>
        <Alert tone="error">{loadError ?? "This property could not be loaded."}</Alert>
      </div>
    );
  }

  const open = openSections(facility);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={queueHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to the queue
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {position >= 0 ? (
            <>
              <span>
                {position + 1} of {rows.length} in this queue
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft size={16} />}
                disabled={!previous}
                onClick={() => previous && navigate(hrefOf(previous.facility.facilityId))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!nextRow}
                onClick={() => nextRow && navigate(hrefOf(nextRow.facility.facilityId))}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </>
          ) : (
            <span>This property is outside the filters the queue is showing.</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-slate-900">
              <Building2 size={20} className="text-slate-400" />
              {facility.name}
              <ParkingStatusBadge status={facility.status} size="md" />
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {facility.address}, {facility.district}, {facility.province} ·{" "}
              {facility.slotCount} bays ·{" "}
              {open.length === 0
                ? "every section approved"
                : `${open.length} section${open.length === 1 ? "" : "s"} awaiting`}
            </p>
          </div>
          <div className="min-w-56 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left sm:text-right">
            <p className="text-sm font-medium text-slate-800">
              {review.providerName || "—"}
            </p>
            <p className="text-sm text-slate-500">{review.providerEmail}</p>
            <p className="text-sm text-slate-500">
              {[review.businessName, review.providerPhone]
                .filter(Boolean)
                .join(" · ") || "No company or phone on file"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
              NIC {review.providerVerificationStatus}
            </p>
          </div>
        </div>
      </div>

      {loadError && <Alert tone="error">{loadError}</Alert>}
      {facility.rejectionReason && (
        <Alert tone="error" title="An admin sent this property back">
          {facility.rejectionReason}
        </Alert>
      )}
      {facility.missingRequirements.length > 0 && (
        <Alert tone="warning">
          Still missing: {facility.missingRequirements.join("; ")}
        </Alert>
      )}

      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          The owner has never submitted this property, so there is nothing to decide yet.
        </p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Registration sections to approve"
            className="flex flex-wrap gap-1 border-b border-slate-200"
          >
            {sections.map((section) => {
              const isActive = section.section === current?.section;
              return (
                <button
                  key={section.section}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => openSection(section.section)}
                  className={`-mb-px flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {sectionIcon(section.status)}
                  {section.label}
                </button>
              );
            })}
          </div>

          {current && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="font-semibold text-slate-900">
                {current.label} — what the owner submitted
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{current.description}</p>

              <div className="mt-3">
                <ReviewSectionDetails review={review} section={current.section} />
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Your decision
                </h3>
                <div className="mt-2">
                  <SectionReviews
                    sections={[current]}
                    onDecide={decideSection}
                    busyKey={busyKey}
                  />
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default FacilityReviewPage;
