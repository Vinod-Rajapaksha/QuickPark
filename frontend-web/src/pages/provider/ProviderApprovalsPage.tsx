import React from "react";
import { useNavigate } from "react-router-dom";
import { useProviderReservations } from "../../features/reservations/hooks/useProviderReservations";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import Badge from "../../components/common/Badge/Badge";
import { CheckSquare, Loader2, AlertCircle, ChevronRight } from "lucide-react";

export const ProviderApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: reservations, isLoading, isError } = useProviderReservations();

  if (isError) {
    return (
      <Card className="text-center p-8 border-red-200 bg-red-50">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-red-800">
          Error Loading Approvals
        </h2>
        <p className="text-red-600 mt-2">
          Could not load reservations from the server.
        </p>
      </Card>
    );
  }

  const pendingApprovals =
    reservations?.filter(
      (res) =>
        res.isAgentBooking &&
        res.status === "PENDING" &&
        !res.isApprovedByProvider,
    ) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CheckSquare size={24} className="text-slate-400" />
            AI Agent Approvals
          </h1>
          <p className="mt-1 text-slate-500">
            Review and approve reservations made by the AI Agent.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <Card padding="none" className="overflow-hidden border-slate-200">
          <div className="divide-y divide-slate-100">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No pending approvals found.
              </div>
            ) : (
              pendingApprovals.map((res) => (
                <div
                  key={res.reservationId}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        {res.driverName || "Driver"}
                      </span>
                      <Badge variant="warning">Requires Approval</Badge>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                      <span>
                        {new Date(res.startTime).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(res.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -
                        {new Date(res.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    rightIcon={<ChevronRight size={16} />}
                    onClick={() =>
                      navigate(
                        `/provider/reservations/approval/${res.reservationId}`,
                      )
                    }
                  >
                    Review Request
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProviderApprovalsPage;
