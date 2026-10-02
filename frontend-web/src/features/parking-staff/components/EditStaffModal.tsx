import React, { useState } from "react";
import type { StaffResponse, UpdateStaffRequest } from "../types/staffTypes";
import { StaffType } from "../types/staffTypes";
import { X } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, data: UpdateStaffRequest) => Promise<boolean>;
  staff: StaffResponse | null;
}

export const EditStaffModal: React.FC<EditStaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  staff,
}) => {
  const [formData, setFormData] = useState<UpdateStaffRequest>({
    fullName: "",
    phone: "",
    nic: "",
    password: "",
    type: StaffType.STANDARD,
    position: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevStaffId, setPrevStaffId] = useState<string | undefined>(staff?.id);

  if (staff?.id !== prevStaffId) {
    setPrevStaffId(staff?.id);
    if (staff) {
      setFormData({
        fullName: staff.fullName,
        phone: staff.phone,
        nic: staff.nic,
        password: "",
        type: staff.type,
        position: staff.position,
      });
    }
  }

  if (!isOpen || !staff) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await onSubmit(staff.id, formData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">
            Edit Staff Member
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
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
            value={staff.email}
            onChange={() => {}}
            disabled
          />
          <Input
            label="New Password (Optional)"
            type="password"
            name="password"
            placeholder="Leave blank to keep current password"
            value={formData.password}
            onChange={handleChange}
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
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
