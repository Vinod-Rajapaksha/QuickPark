import React, { useState } from "react";
import type { CreateStaffRequest } from "../types/staffTypes";
import { StaffType } from "../types/staffTypes";
import { X } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffRequest) => Promise<boolean>;
  facilities: { facilityId: string; name: string }[];
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  facilities,
}) => {
  const [formData, setFormData] = useState<CreateStaffRequest>({
    facilityId: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
    nic: "",
    type: StaffType.STANDARD,
    position: "Attendant",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await onSubmit(formData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Add Staff Member</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Facility
            </label>
            <select
              name="facilityId"
              value={formData.facilityId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a facility</option>
              {facilities && facilities.length > 0 ? (
                facilities.map((f) => (
                  <option key={f.facilityId} value={f.facilityId}>
                    {f.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No facilities found - Create one first
                </option>
              )}
            </select>
          </div>

          <Input
            label="Full Name"
            name="fullName"
            placeholder="e.g. John Doe"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="e.g. john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Input
            label="Phone Number"
            name="phone"
            placeholder="e.g. +94771234567"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Input
            label="NIC"
            name="nic"
            placeholder="e.g. 199012345678"
            value={formData.nic}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Staff Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(StaffType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Position / Title"
            name="position"
            placeholder="e.g. Attendant, Security"
            value={formData.position}
            onChange={handleChange}
            required
          />

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !formData.facilityId}
            >
              {isSubmitting ? "Creating..." : "Create Staff"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
