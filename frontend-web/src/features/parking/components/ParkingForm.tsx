import React from "react";

interface ParkingFormProps {
  defaultValues?: unknown;
  isSubmitting?: boolean;
  serverError?: string | null;
  disabled?: boolean;
  submitLabel?: string;
  onSubmit?: (...args: never[]) => unknown;
  onCancel?: (...args: never[]) => unknown;
}

// Placeholder written so the property setup screen can load; the owning team builds the detail form.
const ParkingForm: React.FC<ParkingFormProps> = () => (
  <p className="text-sm text-slate-500">Property details form is not implemented yet.</p>
);

export default ParkingForm;
