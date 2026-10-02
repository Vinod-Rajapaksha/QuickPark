import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import { ROUTES } from "../../app/routes/routeConstants";
import { useProvider } from "../../features/providers/hooks/useProvider";
import ProviderProfileCard from "../../features/providers/components/ProviderProfile";
import ProviderVerification from "../../features/providers/components/ProviderVerification";
import Spinner from "../../components/common/Spinner/Spinner";
import { useParkings } from "../../features/parking/hooks/useParkings";
import { useProviderReservations } from "../../features/reservations/hooks/useProviderReservations";

export const ProviderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    isLoading,
    isUploading,
    error,
    refresh,
    uploadNic,
    getNicDocumentUrl,
  } = useProvider();
  const { facilities } = useParkings();
  const { data: reservations } = useProviderReservations();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <LayoutDashboard size={24} className="text-slate-400" />
          Dashboard
        </h1>
        <p className="text-slate-500">
          Manage your provider profile and verification status.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error || !profile ? (
        <div className="py-16 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Unable to load your dashboard
          </h1>
          <p className="mt-2 text-slate-600">
            {error || "Failed to load provider profile."}
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => void refresh()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              className="border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => navigate(ROUTES.FACILITIES)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Properties
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {facilities.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
              onClick={() => navigate(ROUTES.PROVIDER_RESERVATIONS)}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Reservations
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {reservations?.length || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${profile.verificationStatus === "APPROVED" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                >
                  {profile.verificationStatus === "APPROVED" ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <ShieldAlert size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Account Status
                  </p>
                  <p
                    className={`text-lg font-bold ${profile.verificationStatus === "APPROVED" ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    {profile.verificationStatus}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.FACILITIES)}
              rightIcon={<ArrowRight size={16} />}
            >
              Manage Properties
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.PROVIDER_RESERVATIONS)}
              rightIcon={<ArrowRight size={16} />}
            >
              View Reservations
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.PROVIDER_STAFF)}
              rightIcon={<ArrowRight size={16} />}
            >
              Manage Staff
            </Button>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Profile & Verification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProviderProfileCard profile={profile} />
              <ProviderVerification
                profile={profile}
                isUploading={isUploading}
                onUpload={uploadNic}
                onGetDocumentUrl={getNicDocumentUrl}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboardPage;
