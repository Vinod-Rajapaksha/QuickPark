import React, { useState } from "react";
import Modal from "../../../components/common/Modal/Modal";
import Button from "../../../components/common/Button/Button";
import CustomSelect from "../../../components/common/Select/Select";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
} from "../../../types/user";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
  initialData?: User | null;
  isLoading?: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  nic?: string;
  password?: string;
  role?: string;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nic: "",
    password: "",
    role: "DRIVER",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setFormData({
          fullName: initialData.fullName,
          email: initialData.email,
          phone: initialData.phone,
          nic: initialData.nic,
          password: "",
          role: initialData.role,
        });
      } else {
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          nic: "",
          password: "",
          role: "DRIVER",
        });
      }
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required.";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Full Name must be at least 3 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    const phoneRegex = /^[+]?[0-9]{9,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "Invalid phone number format.";
    }

    if (!formData.nic.trim()) {
      newErrors.nic = "NIC number is required.";
    }

    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = "Password is required.";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters.";
      }

      if (!formData.role) {
        newErrors.role = "Role is required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      const updateData: UpdateUserRequest = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        nic: formData.nic.trim(),
      };
      onSubmit(updateData);
    } else {
      onSubmit({
        ...formData,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        nic: formData.nic.trim(),
      } as CreateUserRequest);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit User" : "Add New User"}
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Add User"}
          </Button>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-shadow ${
              errors.fullName
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            }`}
            placeholder="Nimal Perera"
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-shadow ${
              errors.email
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            }`}
            placeholder="nimal@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-shadow ${
                errors.phone
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              }`}
              placeholder="+94 77 123 4567"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIC
            </label>
            <input
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-shadow ${
                errors.nic
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              }`}
              placeholder="NIC Number"
            />
            {errors.nic && (
              <p className="mt-1 text-xs text-red-500">{errors.nic}</p>
            )}
          </div>
        </div>

        {!isEdit && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-shadow ${
                  errors.password
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <CustomSelect
                options={[
                  { value: "PLATFORM_ADMIN", label: "Platform Admin" },
                  { value: "PARKING_OWNER", label: "Parking Provider" },
                  { value: "PARKING_STAFF", label: "Parking Staff" },
                  { value: "DRIVER", label: "Driver" },
                ]}
                value={formData.role}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, role: val }));
                  if (errors.role)
                    setErrors((prev) => ({ ...prev, role: undefined }));
                }}
                error={errors.role}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default UserFormModal;
