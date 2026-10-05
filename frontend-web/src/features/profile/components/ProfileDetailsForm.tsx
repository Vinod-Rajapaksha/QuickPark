import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import Input from "../../../components/common/Input/Input";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import { User as UserIcon, Mail, Phone, CreditCard, Lock } from "lucide-react";
import type { ProfileFormValues } from "../schemas/profileSchemas";

interface ProfileDetailsFormProps {
  isEditing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel: () => void;
  onStartEditing: () => void;
}

export const ProfileDetailsForm: React.FC<ProfileDetailsFormProps> = ({
  isEditing,
  isSaving,
  isDirty,
  register,
  errors,
  onSubmit,
  onCancel,
  onStartEditing,
}) => {
  return (
    <Card className="border-slate-200 shadow-sm p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div>
          <h3 className="font-semibold text-slate-900">Personal Details</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Update your personal identification and contact information.
          </p>
        </div>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={onStartEditing}>
            Edit
          </Button>
        )}
      </div>

      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <Input
              label="Full Name"
              placeholder="Nimal Perera"
              disabled={!isEditing}
              leftIcon={<UserIcon size={18} className="text-slate-400" />}
              {...register("fullName")}
              error={errors.fullName?.message}
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="nimal@example.com"
              disabled={!isEditing}
              leftIcon={<Mail size={18} className="text-slate-400" />}
              {...register("email")}
              error={errors.email?.message}
            />

            {/* Phone Number */}
            <Input
              label="Phone Number"
              placeholder="+94 77 123 4567"
              disabled={!isEditing}
              leftIcon={<Phone size={18} className="text-slate-400" />}
              {...register("phone")}
              error={errors.phone?.message}
            />

            {/* NIC */}
            <Input
              label="NIC / Passport"
              placeholder="200012345678"
              disabled={!isEditing}
              leftIcon={<CreditCard size={18} className="text-slate-400" />}
              {...register("nic")}
              error={errors.nic?.message}
            />
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100">
              <Lock size={14} className="text-slate-400 flex-shrink-0" />
              <span>Click <strong>"Edit Profile"</strong> to make changes to your profile details.</span>
            </div>
          )}

          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                disabled={!isDirty}
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default ProfileDetailsForm;
