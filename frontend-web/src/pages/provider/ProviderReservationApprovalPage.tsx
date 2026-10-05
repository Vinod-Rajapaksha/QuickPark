import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  User,
  Car,
  Clock,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
} from "lucide-react";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import Badge from "../../components/common/Badge/Badge";
import Spinner from "../../components/common/Spinner/Spinner";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import { useToast } from "../../hooks/useToast";
import { ROUTES } from "../../app/routes/routeConstants";
import { useReservation } from "../../features/reservations/hooks/useReservation";
import {
  useApproveReservation,
  useRejectReservation,
  useSendReservationMessage,
} from "../../features/reservations/hooks/useProviderReservations";

export const ProviderReservationApprovalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [reason, setReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);

  const { data: reservation, isLoading, isError, error } = useReservation(id);
  const approveMutation = useApproveReservation();
  const rejectMutation = useRejectReservation();
  const messageMutation = useSendReservationMessage();

  const handleApprove = () => {
    if (!id) return;
    approveMutation.mutate(id, {
      onSuccess: () => {
        showToast(
          "Reservation approved successfully. The driver has been notified.",
          "success",
        );
      },
      onError: (err: unknown) => {
        const error = err as { response?: { data?: { message?: string } } };
        showToast(
          error?.response?.data?.message || "Failed to approve reservation",
          "error",
        );
      },
      onSettled: () => setConfirmAction(null),
    });
  };

  const handleReject = () => {
    if (!id) return;
    rejectMutation.mutate(
      { id, reason: reason || "Provider rejected the request." },
      {
        onSuccess: () => {
          showToast("Reservation rejected.", "success");
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          showToast(
            error?.response?.data?.message || "Failed to reject reservation",
            "error",
          );
        },
        onSettled: () => setConfirmAction(null),
      },
    );
  };

  const handleSendMessage = () => {
    if (!id || !reason) {
      showToast("Please enter a message.", "error");
      return;
    }
    messageMutation.mutate(
      { id, message: reason },
      {
        onSuccess: () => {
          showToast("Message sent to driver via AI Agent!", "success");
          setReason("");
        },
        onError: (err: unknown) => {
          const error = err as { response?: { data?: { message?: string } } };
          showToast(
            error?.response?.data?.message || "Failed to send message",
            "error",
          );
        },
      },
    );
  };

  const isPending =
    reservation?.status === "PENDING" && !reservation?.isApprovedByProvider;
  const isApproved =
    reservation?.isApprovedByProvider || reservation?.status === "CONFIRMED";
  const isRejected = reservation?.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarCheck size={24} className="text-slate-400" />
            Reservation Approval
          </h1>
          <p className="mt-1 text-slate-500">
            Review and manage incoming parking reservation requests.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : isError || !reservation ? (
        <div className="py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900">
            Error Loading Reservation
          </h1>
          <p className="mt-2 text-slate-600">
            {(error as Error)?.message ||
              "Reservation not found or you do not have permission."}
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => navigate(ROUTES.PROVIDER_RESERVATIONS)}
          >
            Back to Reservations
          </Button>
        </div>
      ) : (
        <>
          {!reservation.isAgentBooking && isPending && (
            <Card
              className="border-blue-200 bg-blue-50 text-blue-800"
              padding="md"
            >
              <div className="flex gap-3">
                <AlertCircle size={24} className="shrink-0 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Auto-Approval Notice
                  </h3>
                  <p className="text-sm mt-1">
                    This reservation was booked directly through the standard
                    app (not via AI Agent). You do not need to manually approve
                    it.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {isPending ? (
            <Card className="border-slate-200" padding="none">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Request Details
                  </h2>
                  <Badge variant="warning" dot>
                    Pending Approval
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Driver Name
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {reservation.driverName || "Unknown Driver"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                      <Car size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Vehicle
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {reservation.vehicleTypeName || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Requested Time
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {new Date(reservation.startTime).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}{" "}
                        -
                        {new Date(reservation.endTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Est. Revenue
                      </span>
                      <p className="font-semibold text-emerald-600 mt-0.5">
                        {reservation.providerAmount} LKR
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <MessageSquare size={16} className="text-slate-400" />
                    Message to Driver{" "}
                    <span className="text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-400 text-sm p-3 transition-colors resize-none border"
                    placeholder="E.g. Reason for rejection, or a question about their vehicle..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="primary"
                    className="flex-1 bg-emerald-600 border-transparent hover:bg-emerald-700 hover:border-transparent focus:ring-emerald-500"
                    leftIcon={<CheckCircle2 size={16} />}
                    onClick={() => setConfirmAction("approve")}
                    isLoading={approveMutation.isPending}
                    disabled={
                      approveMutation.isPending ||
                      rejectMutation.isPending ||
                      !reservation.isAgentBooking
                    }
                  >
                    Approve Request
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    leftIcon={<XCircle size={16} />}
                    onClick={() => setConfirmAction("reject")}
                    isLoading={rejectMutation.isPending}
                    disabled={
                      approveMutation.isPending || rejectMutation.isPending
                    }
                  >
                    Reject Request
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    leftIcon={<Send size={16} />}
                    onClick={handleSendMessage}
                    isLoading={messageMutation.isPending}
                    disabled={
                      !reason.trim() ||
                      approveMutation.isPending ||
                      rejectMutation.isPending
                    }
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`text-center border-slate-200 py-12 ${isApproved ? "bg-emerald-50" : isRejected ? "bg-red-50" : "bg-slate-50"}`}
                padding="md"
              >
                <div className="flex justify-center mb-4">
                  {isApproved ? (
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                      <CheckCircle2 size={48} />
                    </div>
                  ) : isRejected ? (
                    <div className="p-4 bg-red-100 text-red-600 rounded-full">
                      <XCircle size={48} />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-200 text-slate-600 rounded-full">
                      <AlertCircle size={48} />
                    </div>
                  )}
                </div>
                <h2
                  className={`text-2xl font-bold mb-2 ${isApproved ? "text-emerald-800" : isRejected ? "text-red-800" : "text-slate-800"}`}
                >
                  Reservation{" "}
                  {isApproved
                    ? "Approved"
                    : isRejected
                      ? "Rejected/Cancelled"
                      : "Processed"}
                </h2>
                <p
                  className={`text-sm ${isApproved ? "text-emerald-600" : isRejected ? "text-red-600" : "text-slate-600"} mb-6`}
                >
                  {isApproved
                    ? "The driver has been notified and the spot is now reserved."
                    : isRejected
                      ? "The request has been declined and the driver has been notified."
                      : "This reservation is in a non-pending state."}
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.PROVIDER_RESERVATIONS)}
                >
                  Back to Requests
                </Button>
              </Card>
            </motion.div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction === "approve" ? handleApprove : handleReject}
        title={
          confirmAction === "approve"
            ? "Approve Reservation"
            : "Reject Reservation"
        }
        description={
          confirmAction === "approve"
            ? "Are you sure you want to approve this reservation? The driver will be notified and asked to pay."
            : "Are you sure you want to reject this reservation? The driver will be notified."
        }
        confirmText={confirmAction === "approve" ? "Approve" : "Reject"}
        type={confirmAction === "approve" ? "info" : "danger"}
        isLoading={
          confirmAction === "approve"
            ? approveMutation.isPending
            : rejectMutation.isPending
        }
      />
    </div>
  );
};

export default ProviderReservationApprovalPage;
