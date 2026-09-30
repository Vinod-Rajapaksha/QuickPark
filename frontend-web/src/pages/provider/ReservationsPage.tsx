import React from "react";
import { useNavigate } from "react-router-dom";
import { useProviderReservations } from "../../features/reservations/hooks/useProviderReservations";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import Badge from "../../components/common/Badge/Badge";
import { CalendarCheck, Loader2, AlertCircle, ChevronRight } from "lucide-react";

export const ProviderReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: reservations, isLoading, isError } = useProviderReservations();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="text-center p-8 border-red-200 bg-red-50">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-red-800">Error Loading Reservations</h2>
        <p className="text-red-600 mt-2">Could not load reservations from the server.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarCheck size={24} className="text-slate-400" />
            Reservations
          </h1>
          <p className="mt-1 text-slate-500">
            View all incoming and past reservations.
          </p>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden border-slate-200">
        <div className="divide-y divide-slate-100">
          {!reservations || reservations.length === 0 ? (
             <div className="p-8 text-center text-slate-500">No reservations found.</div>
          ) : (
            reservations.map((res) => {
              const isPendingApproval = res.isAgentBooking && res.status === 'PENDING' && !res.isApprovedByProvider;

              return (
                <div key={res.reservationId} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{res.driverName || 'Driver'}</span>
                      {isPendingApproval ? (
                        <Badge variant="warning">Requires Approval</Badge>
                      ) : (
                        <Badge variant={res.status === 'CONFIRMED' ? 'success' : 'default'}>
                          {res.status}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                      <span>{new Date(res.startTime).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>
                        {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    rightIcon={<ChevronRight size={16} />}
                    onClick={() => navigate(`/provider/reservations/approval/${res.reservationId}`)}
                  >
                    View Details
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProviderReservationsPage;
