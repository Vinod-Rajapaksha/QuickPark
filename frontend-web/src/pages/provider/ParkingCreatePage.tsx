import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import ParkingForm from "../../features/parking/components/ParkingForm";
import { useParkings } from "../../features/parking/hooks/useParkings";
import type { ParkingInput } from "../../features/parking/types/parkingTypes";
import { ROUTES } from "../../app/routes/routeConstants";

export const ParkingCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { create, actionError, isSaving } = useParkings();

  const handleCreate = async (input: ParkingInput) => {
    const created = await create(input);
    // A draft property is only the first step; the wizard continues with its location.
    if (created) navigate(ROUTES.facilitySetupPath(created.facilityId));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(ROUTES.FACILITIES)}
        >
          Back to properties
        </Button>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Building2 size={24} className="text-slate-400" />
          Register a property
        </h1>
        <p className="mt-1 text-slate-500">
          Start with the basic information. The location, documents, vehicle types and review
          steps follow once this is saved, and an admin approves each part before drivers can
          book it.
        </p>
      </div>

      <Card className="border-slate-200" padding="md">
        <ParkingForm
          isSubmitting={isSaving}
          serverError={actionError}
          submitLabel="Create property"
          onSubmit={handleCreate}
          onCancel={() => navigate(ROUTES.FACILITIES)}
        />
      </Card>
    </div>
  );
};

export default ParkingCreatePage;