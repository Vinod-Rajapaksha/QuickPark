import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import Spinner from "../../components/common/Spinner/Spinner";
import AllocationEditor from "../../features/parking/components/AllocationEditor";
import FacilityDocumentTabs from "../../features/parking/components/FacilityDocumentTabs";
import FacilityReviewStep from "../../features/parking/components/FacilityReviewStep";
import ParkingForm from "../../features/parking/components/ParkingForm";
import ParkingStatusBadge from "../../features/parking/components/ParkingStatusBadge";
import PropertyLocationTab from "../../features/parking/components/PropertyLocationTab";
import { parkingApi } from "../../features/parking/api/parkingApi";
import { useFacilityDocuments } from "../../features/parking/hooks/useFacilityDocuments";
import { useParkings } from "../../features/parking/hooks/useParkings";
import { useRegistrationOptions } from "../../features/parking/hooks/useRegistrationOptions";
import type {
  AllocationInput,
  CoordinateInput,
  ParkingFacility,
  ParkingInput,
} from "../../features/parking/types/parkingTypes";
import {
  detailsInputOf,
  formatLandArea,
  getApiErrorMessage,
} from "../../features/parking/utils/parkingUtils";

type WizardTab = "details" | "location" | "documents" | "layout" | "review";

const TABS: Array<{ id: WizardTab; label: string }> = [
  { id: "details", label: "Basic information" },
  { id: "location", label: "Property location" },
  { id: "documents", label: "Documents & photos" },
  { id: "layout", label: "Vehicle types & pricing" },
  { id: "review", label: "Review & submit" },
];

// <input type="time"> and the form schema both use HH:MM; the API sends HH:MM:SS.
const toFormTime = (value: string): string => value.slice(0, 5);

const detailsOf = (facility: ParkingFacility) => ({
  name: facility.name,
  address: facility.address,
  city: facility.city,
  province: facility.province,
  district: facility.district,
  landAreaPerches: facility.landAreaPerches,
  openingTime: toFormTime(facility.openingTime),
  closingTime: toFormTime(facility.closingTime),
  hasEvCharging: facility.hasEvCharging,
});

export const FacilitySetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { facilityId = "" } = useParams<{ facilityId: string }>();
  const [activeTab, setActiveTab] = useState<WizardTab>("details");
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    facilities,
    isLoading: isLoadingFacility,
    loadError,
    actionError,
    isSaving,
    update,
    refresh,
  } = useParkings();
  const {
    documents,
    isLoading: isLoadingDocuments,
    actionError: documentError,
    isUploading,
    upload,
    remove,
  } = useFacilityDocuments(facilityId);
  const { options, isLoading: isLoadingOptions } = useRegistrationOptions();

  const facility = facilities.find((item) => item.facilityId === facilityId);

  if (isLoadingFacility) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <p className="text-slate-600">{loadError ?? "This property is not available to your account."}</p>
        <Button variant="outline" onClick={() => navigate("/facilities")}>
          Back to properties
        </Button>
      </div>
    );
  }

  const isEditable = facility.isEditable;
  const tabDone = (id: WizardTab): boolean => {
    if (id === "details") return true;
    if (id === "location")
      return facility.latitude !== null && facility.longitude !== null;
    if (id === "documents") return facility.documentsComplete;
    if (id === "layout") return facility.allocations.length > 0;
    return (
      facility.status === "APPROVED" ||
      facility.status === "PENDING_APPROVAL" ||
      facility.readyForSubmission
    );
  };

  const handleSaveDetails = async (input: ParkingInput) => {
    // The details form has no coordinate fields, so the saved pin rides along instead of being wiped by the replace.
    await update(facility.facilityId, {
      ...input,
      latitude: facility.latitude,
      longitude: facility.longitude,
    });
  };

  const handleSaveLocation = async (coordinates: CoordinateInput) => {
    await update(facility.facilityId, { ...detailsInputOf(facility), ...coordinates });
  };

  const handleSaveAllocations = async (allocations: AllocationInput[]) => {
    setIsSavingLayout(true);
    setLayoutError(null);
    try {
      await parkingApi.saveAllocations(facility.facilityId, allocations);
      await refresh();
    } catch (err) {
      setLayoutError(getApiErrorMessage(err, "Failed to save this layout."));
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await parkingApi.submitForReview(facility.facilityId);
      await refresh();
      setActiveTab("review");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to submit this property."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/facilities")}
        >
          Back to properties
        </Button>
        <h1 className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">
          <Building2 size={24} className="text-slate-400" />
          {facility.name}
          <ParkingStatusBadge status={facility.status} />
        </h1>
        <p className="mt-1 text-slate-500">
          {facility.district}, {facility.province} Province ·{" "}
          {formatLandArea(facility.landAreaPerches)}
        </p>
      </div>

      {facility.status === "REJECTED" && facility.rejectionReason && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <Ban size={16} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">An admin rejected this property</p>
            <p className="mt-0.5 text-sm text-red-700">{facility.rejectionReason}</p>
            <p className="mt-1 text-xs text-red-600">
              Fix the issue in the tabs below, then submit it again.
            </p>
          </div>
        </div>
      )}

      {facility.status === "APPROVED" && (
        <p className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            This property is approved and live. Your prices and operating hours apply as soon
            as you save them. Changing the name, address, land area, location point, vehicle
            types or a slot count sends that part back to the admin queue, and drivers cannot
            book it until an admin approves it again.
          </span>
        </p>
      )}

      {!isEditable && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {facility.status === "PENDING_APPROVAL"
            ? "An admin is reviewing this property, so it is read-only here. You can change it again as soon as they have decided."
            : "This property is suspended and cannot be changed. Contact the platform admin."}
        </p>
      )}

      <div
        role="tablist"
        aria-label="Property registration steps"
        className="flex flex-wrap gap-1 border-b border-slate-200"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tabDone(tab.id) ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <Circle size={16} className="text-slate-300" />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "details" && (
        <Card className="border-slate-200" padding="md">
          <ParkingForm
            defaultValues={detailsOf(facility)}
            isSubmitting={isSaving}
            serverError={actionError}
            disabled={!isEditable}
            submitLabel={
              facility.status === "APPROVED" ? "Save & send for review" : "Save details"
            }
            onSubmit={handleSaveDetails}
            onCancel={() => navigate("/facilities")}
          />
        </Card>
      )}

      {activeTab === "location" && (
        <Card className="border-slate-200" padding="md">
          <PropertyLocationTab
            key={`${facility.facilityId}-${facility.latitude}-${facility.longitude}`}
            facility={facility}
            disabled={!isEditable}
            isSaving={isSaving}
            serverError={actionError}
            onSave={handleSaveLocation}
          />
        </Card>
      )}

      {activeTab === "documents" && (
        <Card className="border-slate-200" padding="md">
          {isLoadingDocuments ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : (
            <FacilityDocumentTabs
              requirements={facility.documentRequirements}
              documents={documents}
              isUploading={isUploading}
              actionError={documentError}
              onUpload={upload}
              onRemove={remove}
            />
          )}
        </Card>
      )}

      {activeTab === "layout" && (
        <Card className="border-slate-200" padding="md">
          {isLoadingOptions ? (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : (
            <AllocationEditor
              key={`${facility.facilityId}-${facility.updatedAt}-${facility.allocations.length}`}
              vehicleTypes={options.vehicleTypes}
              existing={facility.allocations}
              disabled={!isEditable}
              warnReApproval={facility.status === "APPROVED"}
              isSaving={isSavingLayout}
              serverError={layoutError}
              onSave={handleSaveAllocations}
            />
          )}
        </Card>
      )}

      {activeTab === "review" && (
        <Card className="border-slate-200" padding="md">
          <FacilityReviewStep
            facility={facility}
            isSubmitting={isSubmitting}
            serverError={submitError}
            onSubmit={() => void handleSubmit()}
          />
        </Card>
      )}
    </div>
  );
};

export default FacilitySetupPage;
