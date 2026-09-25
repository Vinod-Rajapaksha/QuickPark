import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserIcon, Shield, Key } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import ProfileHeader from "../../features/profile/components/ProfileHeader";
import ProfileDetailsForm from "../../features/profile/components/ProfileDetailsForm";
import ProfileSecurityTab from "../../features/profile/components/ProfileSecurityTab";
import { profileSchema, type ProfileFormValues } from "../../features/profile/schemas/profileSchemas";

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "security">("details");
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log("Profile updated", data);
      showToast("Profile updated successfully", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      showToast("Failed to update profile", "error");
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <UserIcon size={24} className="text-slate-400" />
            My Profile
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your personal profile details, account security, and preferences.
          </p>
        </div>
      </div>

      {/* Header Component */}
      <ProfileHeader
        user={user}
        onEditClick={() => {
          setActiveTab("details");
          setIsEditing(true);
        }}
        isEditing={isEditing}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 -mb-px ${
            activeTab === "details"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Shield size={16} />
          Personal Details
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setActiveTab("security");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 -mb-px ${
            activeTab === "security"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Key size={16} />
          Security & Password
        </button>
      </div>

      {/* Tab Content Components */}
      {activeTab === "details" && (
        <ProfileDetailsForm
          isEditing={isEditing}
          isSaving={isSaving}
          isDirty={isDirty}
          register={register}
          errors={errors}
          onSubmit={handleSubmit(onSubmit)}
          onCancel={handleCancel}
          onStartEditing={() => setIsEditing(true)}
        />
      )}

      {activeTab === "security" && <ProfileSecurityTab />}
    </div>
  );
};

export default Profile;
