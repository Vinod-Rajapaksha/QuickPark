import React from "react";
import Card from "../../../components/common/Card/Card";
import Button from "../../../components/common/Button/Button";
import { Camera, ShieldCheck, Mail, Calendar, Key, CheckCircle2 } from "lucide-react";
import type { User } from "../../../features/auth/types/authTypes";

interface ProfileHeaderProps {
  user: User;
  onAvatarClick?: () => void;
  onEditClick?: () => void;
  isEditing?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onAvatarClick,
  onEditClick,
  isEditing = false,
}) => {
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PARKING_OWNER':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PARKING_STAFF':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <Card className="p-6 border-slate-200 shadow-sm bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-md border-4 border-white transition-transform group-hover:scale-105">
            {(user.fullName?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase()}
          </div>
          <button
            onClick={onAvatarClick}
            type="button"
            className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 shadow-md hover:shadow-lg transition-all transform hover:scale-110"
            title="Change Avatar"
          >
            <Camera size={16} />
          </button>
        </div>

        {/* User Quick Overview */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {user.fullName}
                <CheckCircle2 size={18} className="text-blue-500" />
              </h2>
              <p className="text-slate-500 text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Mail size={14} className="text-slate-400" />
                {user.email}
              </p>
            </div>

            {onEditClick && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEditClick}
                className="self-center sm:self-start shadow-sm"
              >
                Edit Profile
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeStyle(
                user.role
              )}`}
            >
              <ShieldCheck size={13} className="mr-1.5" />
              {user.role.replace("_", " ")}
            </span>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <Key size={13} className="mr-1.5 text-slate-400" />
              ID: {user.id ? `${user.id.slice(0, 8)}...` : 'N/A'}
            </span>

            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
              <Calendar size={13} className="mr-1.5 text-slate-400" />
              Verified Account
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileHeader;
