import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  DollarSign,
  UserCog,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import { ROUTES } from "../../app/routes/routeConstants";
import { useQuery } from "@tanstack/react-query";
import { useUsers } from "../../features/users/hooks/useUsers";
import { useProviders } from "../../features/providers/hooks/useProviders";
import { parkingApi } from "../../features/parking/api/parkingApi";
import { reportApi } from "../../features/reports/api/reportApi";
import Badge from "../../components/common/Badge/Badge";
import type { User } from "../../types/user";
import type { ProviderProfile } from "../../features/providers/types/providerTypes";

interface UsersResponse {
  total: number;
  data: User[];
  page: number;
  limit: number;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: usersPayload } = useUsers();
  const { pending } = useProviders();

  const { data: properties } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: () => parkingApi.getFacilitiesForReview(),
  });

  const { data: revenue } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => reportApi.getPlatformRevenue(),
  });

  const totalUsers = (usersPayload as UsersResponse | undefined)?.total || 0;
  const recentUsers = (usersPayload as UsersResponse | undefined)?.data || [];

  const totalProperties = properties?.length || 0;
  const pendingApprovals = pending?.length || 0;
  const monthlyRevenue = revenue?.totalRevenue || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <LayoutDashboard size={24} className="text-slate-400" />
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of the platform's key metrics and activities.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => navigate(ROUTES.ADMIN_USERS)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
            onClick={() => navigate(ROUTES.ADMIN_PROPERTIES)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Properties</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalProperties.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
            onClick={() => navigate(ROUTES.ADMIN_PROVIDER_APPROVALS)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {pendingApprovals.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
            onClick={() => navigate(ROUTES.ADMIN_COMMISSION)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {monthlyRevenue.toLocaleString()}{" "}
                  <span className="text-sm text-slate-500 font-normal">
                    LKR
                  </span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(ROUTES.ADMIN_PROVIDER_APPROVALS)}
                leftIcon={<UserCheck size={16} />}
              >
                Review Approvals
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
                leftIcon={<UserCog size={16} />}
              >
                Manage Users
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.ADMIN_PROPERTIES)}
                leftIcon={<Building2 size={16} />}
              >
                Manage Properties
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(ROUTES.ADMIN_RESERVATIONS)}
                leftIcon={<Calendar size={16} />}
              >
                View Reservations
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Recently Registered Users
              </h2>
              <button
                onClick={() => navigate(ROUTES.ADMIN_USERS)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>
            <Card className="border-slate-200" padding="none">
              {recentUsers.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentUsers.slice(0, 5).map((user: User) => (
                    <div
                      key={user.id}
                      className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(ROUTES.ADMIN_USERS)}
                    >
                      <div className="h-10 w-10 shrink-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Badge variant={user.isActive ? "success" : "error"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Users size={24} className="mx-auto text-slate-300 mb-2" />
                  No recent users found.
                </div>
              )}
            </Card>
          </div>

          {/* Pending Provider Approvals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Providers Awaiting Approval
              </h2>
              <button
                onClick={() => navigate(ROUTES.ADMIN_PROVIDER_APPROVALS)}
                className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Review queue <ArrowRight size={14} />
              </button>
            </div>
            <Card className="border-slate-200" padding="none">
              {pending && pending.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {pending.slice(0, 5).map((provider: ProviderProfile) => (
                    <div
                      key={provider.userId}
                      className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(ROUTES.ADMIN_PROVIDER_APPROVALS)}
                    >
                      <div className="mt-1 shrink-0 p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <ShieldAlert size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {provider.businessName ||
                            provider.fullName ||
                            "Unknown Business"}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          Identity Verification required
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-slate-400">
                        <Clock size={12} />
                        Pending
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2
                    size={24}
                    className="mx-auto text-emerald-400 mb-2"
                  />
                  No pending approvals! You are all caught up.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
