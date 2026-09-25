import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Card from "../../../components/common/Card/Card";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import { Lock, KeyRound, ShieldAlert, CheckCircle2, XCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "../../../hooks/useToast";
import { passwordSchema, type PasswordFormValues } from "../schemas/profileSchemas";

export const ProfileSecurityTab: React.FC = () => {
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordVal = watch("newPassword", "");

  const requirements = [
    { label: "At least 8 characters long", met: newPasswordVal.length >= 8 },
    { label: "At least one uppercase letter (A-Z)", met: /[A-Z]/.test(newPasswordVal) },
    { label: "At least one lowercase letter (a-z)", met: /[a-z]/.test(newPasswordVal) },
    { label: "At least one number (0-9)", met: /[0-9]/.test(newPasswordVal) },
    { label: "At least one special character (!@#$%...)", met: /[^A-Za-z0-9]/.test(newPasswordVal) },
  ];

  const onSubmit = async (data: PasswordFormValues) => {
    setIsUpdating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log("Password updated", data);
      showToast("Password updated successfully", "success");
      reset();
    } catch {
      showToast("Failed to change password", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div>
          <h3 className="font-semibold text-slate-900">Security & Password</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage your password and secure your account credentials.
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Password Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••"
                  leftIcon={<Lock size={18} className="text-slate-400" />}
                  {...register("currentPassword")}
                  error={errors.currentPassword?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  leftIcon={<KeyRound size={18} className="text-slate-400" />}
                  {...register("newPassword")}
                  error={errors.newPassword?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  leftIcon={<KeyRound size={18} className="text-slate-400" />}
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isUpdating}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* Security Guidelines */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 space-y-6">
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" />
                Password Strength Checklist
              </h4>
              <ul className="space-y-2 text-xs">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-slate-300 flex-shrink-0" />
                    )}
                    <span className={req.met ? "text-emerald-700 font-medium" : "text-slate-500"}>
                      {req.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-3">
              <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <ShieldAlert size={16} className="text-blue-600" />
                Security Recommendations
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Never share your QuickPark credentials with anyone. We recommend changing your password periodically to maintain maximum protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileSecurityTab;
