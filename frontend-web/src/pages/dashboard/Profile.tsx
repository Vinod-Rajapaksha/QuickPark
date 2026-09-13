import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, User as UserIcon, Mail, Phone, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number is too short")
    .max(15, "Phone number is too long"),
  nic: z.string().min(10, "NIC is too short"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      nic: user?.nic || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Profile updated", data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Personal Information
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your personal details and how they are displayed across
          QuickPark.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="md:col-span-1">
          <Card className="flex flex-col items-center text-center p-6 border-slate-200">
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-4xl shadow-sm border-4 border-white">
                {(
                  user.fullName?.charAt(0) ||
                  user.email?.charAt(0) ||
                  "U"
                ).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-slate-200 text-slate-600 hover:text-blue-600 shadow-sm transition-colors group">
                <Camera
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {user.fullName}
            </h2>
            <p className="text-slate-500 text-sm mb-4">{user.email}</p>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold capitalize">
              <ShieldCheck size={14} className="mr-1.5" />
              {user.role.replace("_", " ").toLowerCase()}
            </span>
          </Card>
        </div>

        {/* Profile Details Form */}
        <div className="md:col-span-2">
          <Card className="border-slate-200 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Profile Details</h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    disabled={!isEditing}
                    leftIcon={<UserIcon size={18} />}
                    {...register("fullName")}
                    error={errors.fullName?.message}
                  />

                  {/* Email */}
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    disabled={!isEditing}
                    leftIcon={<Mail size={18} />}
                    {...register("email")}
                    error={errors.email?.message}
                  />

                  {/* Phone Number */}
                  <Input
                    label="Phone Number"
                    placeholder="+94 77 123 4567"
                    disabled={!isEditing}
                    leftIcon={<Phone size={18} />}
                    {...register("phone")}
                    error={errors.phone?.message}
                  />

                  {/* NIC */}
                  <Input
                    label="NIC / Passport"
                    placeholder="200012345678"
                    disabled={!isEditing}
                    leftIcon={<CreditCard size={18} />}
                    {...register("nic")}
                    error={errors.nic?.message}
                  />
                </div>

                {isEditing && (
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCancel}
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
