import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Info } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import ParkingForm from "../../features/parking/components/ParkingForm";
import { useParkings } from "../../features/parking/hooks/useParkings";
import type { ParkingInput } from "../../features/parking/types/parkingTypes";

export const ParkingCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { actionError, isSaving, create } = useParkings();

  const handleSubmit = async (input: ParkingInput) => {
    const created = await create(input);
    if (created) navigate(`/facilities/${created.facilityId}/setup`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate("/facilities")}
          disabled={isSaving}
        >
          Back to properties
        </Button>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Building2 size={24} className="text-slate-400" />
          Register Parking Property
        </h1>
        <p className="mt-1 text-slate-500">
          Property details are reviewed by an admin before the property becomes
          visible to drivers.
        </p>
      </div>

      <Card className="border-slate-200" padding="md">
        <p className="mb-6 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
          Step 1 of 4 — province and district must match. The next screen keeps the rest of
          the registration in tabs: documents and property photos, vehicle types with slot
          counts and pricing, then a review step before you submit.
        </p>

        <ParkingForm
          isSubmitting={isSaving}
          serverError={actionError}
          submitLabel="Save details and upload documents"
          onSubmit={handleSubmit}
          onCancel={() => navigate("/facilities")}
        />
      </Card>
    </div>
  );
};

export default ParkingCreatePage;
