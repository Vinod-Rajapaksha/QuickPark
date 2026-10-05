import React, { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import {
  QrCode,
  CheckCircle,
  User,
  Clock,
  MapPin,
  Car,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import { AxiosError } from "axios";
import { axiosClient } from "../../services/api/axiosClient";
import { reservationApi } from "../../features/reservations/api/reservationApi";
import type { Reservation } from "../../features/reservations/types/reservationTypes";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import { toast } from "react-hot-toast";

const QRScannerPage: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    reservation?: Reservation;
  } | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    action: "check-in" | "check-out" | null;
  }>({ isOpen: false, action: null });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanResult) return;

    const timer = setTimeout(() => {
      if (!document.getElementById("qr-reader")) return;

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_CAMERA,
            Html5QrcodeScanType.SCAN_TYPE_FILE,
          ],
        },
        /* verbose= */ false,
      );
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        if (scannerRef.current) {
          scannerRef.current.clear();
          setScanResult(decodedText);
        }
      };

      const onScanFailure = () => {};

      scanner.render(onScanSuccess, onScanFailure);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanResult]);

  useEffect(() => {
    if (!scanResult) return;

    const validateToken = async () => {
      setIsValidating(true);
      try {
        const response = await axiosClient.post("/Tokens/scan", {
          token: scanResult,
        });
        const reservationId = response.data.reservationId;

        const reservation = await reservationApi.getById(reservationId);

        let statusMsg = "Booking Verified";
        if (reservation.status === "CONFIRMED") {
          statusMsg = "Valid Booking Found";
        } else if (reservation.status === "CHECKED_IN") {
          statusMsg = "Ready for Check-Out";
        } else if (reservation.status === "CHECKED_OUT") {
          statusMsg = "Already Checked Out";
        } else if (reservation.status === "CANCELLED") {
          statusMsg = "Booking Cancelled";
        }

        setValidationResult({
          success: true,
          message: statusMsg,
          reservation,
        });
        toast.success("Valid QR Code!");
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        setValidationResult({
          success: false,
          message:
            axiosError.response?.data?.message ||
            "Invalid or expired QR token.",
        });
        toast.error("Invalid QR Code");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [scanResult]);

  const resetScanner = () => {
    setScanResult(null);
    setValidationResult(null);
  };

  const handleAction = async () => {
    if (!validationResult?.reservation || !confirmConfig.action) return;
    const action = confirmConfig.action;

    try {
      const { reservationId } = validationResult.reservation;
      await axiosClient.post(`/reservations/${reservationId}/${action}`);
      toast.success(
        action === "check-in" ? "Check-in successful!" : "Check-out successful!"
      );
      setConfirmConfig({ isOpen: false, action: null });
      resetScanner();
    } catch (err) {
      console.error("Failed to perform reservation action:", err);
      toast.error(`Failed to ${action}. Please try again.`);
      setConfirmConfig({ isOpen: false, action: null });
    }
  };

  const openConfirmDialog = (action: "check-in" | "check-out") => {
    setConfirmConfig({ isOpen: true, action });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-black tracking-tight text-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shadow-inner">
            <QrCode size={28} />
          </div>
          Gate Scanner
        </h1>
        <p className="mt-3 text-slate-500">
          Scan the driver's QR token to instantly verify their booking.
        </p>
      </div>

      <Card
        padding="none"
        className="overflow-hidden border-0 shadow-2xl shadow-slate-200/50 rounded-3xl"
      >
        {!scanResult ? (
          <div className="relative bg-slate-900 overflow-hidden min-h-[500px] flex flex-col w-full">
            <style>
              {`
                #qr-reader { width: 100% !important; border: none !important; display: flex; flex-direction: column; }
                #qr-reader__scan_region { background: #0f172a !important; min-height: 300px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
                #qr-reader__scan_region video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; }
                #qr-reader__scan_region img { opacity: 0.3 !important; margin: auto !important; }
                #qr-reader__dashboard { padding: 20px !important; background: #1e293b !important; color: white !important; border-top: 1px solid #334155; width: 100% !important; z-index: 20; position: relative; }
                #qr-reader__dashboard_section_csr span { color: #94a3b8 !important; font-family: ui-sans-serif, system-ui, sans-serif !important; display: block; margin-bottom: 8px; font-size: 14px; }
                #qr-reader__dashboard_section_csr select { width: 100% !important; color: white !important; background: #334155 !important; border: 1px solid #475569 !important; border-radius: 8px !important; padding: 8px 12px !important; margin-bottom: 12px !important; font-family: ui-sans-serif, system-ui, sans-serif !important; }
                #qr-reader__dashboard_section_csr button, #qr-reader__dashboard_section_swaplink { width: 100% !important; background: #3b82f6 !important; border: none !important; border-radius: 8px !important; color: white !important; padding: 10px 16px !important; font-weight: 500 !important; cursor: pointer; text-decoration: none !important; display: block; margin: 0 auto 8px auto !important; transition: background 0.2s; }
                #qr-reader__dashboard_section_csr button:hover, #qr-reader__dashboard_section_swaplink:hover { background: #2563eb !important; }
                #html5-qrcode-anchor-scan-type-change { color: #60a5fa !important; text-decoration: none !important; display: block; margin-top: 16px; font-weight: 500; text-align: center; }
                #html5-qrcode-anchor-scan-type-change:hover { color: #93c5fd !important; }
                #qr-reader__dashboard input[type="file"] { color: white; margin-top: 12px; width: 100%; font-size: 14px; }
                img[alt="Info icon"] { display: none !important; }
                #qr-reader__dashboard_section_fs { display: none !important; }
              `}
            </style>
            <div id="qr-reader" className="w-full"></div>

            <div className="pointer-events-none absolute inset-0 z-10 hidden border-4 border-primary-500/30 sm:block">
              <div className="absolute left-0 top-0 h-1 w-full animate-[scan_2s_ease-in-out_infinite] bg-primary-500 shadow-[0_0_20px_4px_rgba(59,130,246,0.5)]"></div>
            </div>
          </div>
        ) : isValidating ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border-4 border-primary-100"></div>
              <div className="absolute inset-2 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
              <QrCode size={24} className="text-primary-600" />
            </div>
            <p className="mt-6 text-lg font-medium text-slate-600 animate-pulse">
              Decrypting and validating token...
            </p>
          </div>
        ) : validationResult ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white">
            {validationResult.success ? (
              <div className="flex h-20 w-20 animate-in zoom-in items-center justify-center rounded-full bg-green-100 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                <CheckCircle size={40} className="text-green-600" />
              </div>
            ) : (
              <div className="flex h-20 w-20 animate-in zoom-in items-center justify-center rounded-full bg-red-100 shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                <ShieldAlert size={40} className="text-red-600" />
              </div>
            )}

            <h3
              className={`mt-6 text-3xl font-black tracking-tight ${validationResult.success ? "text-green-600" : "text-red-600"}`}
            >
              {validationResult.message}
            </h3>

            {!validationResult.success && (
              <p className="mt-2 text-slate-500">
                The scanned QR code is either invalid, expired, or doesn't
                belong to this facility.
              </p>
            )}

            {validationResult.success && validationResult.reservation && (
              <div className="mt-8 w-full max-w-md space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Driver
                    </p>
                    <p className="font-semibold text-slate-900">
                      {validationResult.reservation.driverName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {validationResult.reservation.driverPhone || "No Phone"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Car size={14} />
                      <span className="text-xs font-semibold uppercase">
                        Vehicle Type
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">
                      {validationResult.reservation.vehicleTypeName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin size={14} />
                      <span className="text-xs font-semibold uppercase">
                        Slot Assigned
                      </span>
                    </div>
                    <div className="inline-flex items-center rounded-md bg-slate-200 px-2.5 py-0.5 text-sm font-bold text-slate-800">
                      {validationResult.reservation.slotNumber || "TBD"}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} />
                    <span className="text-xs font-semibold uppercase">
                      Booking Period
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100">
                    <div className="text-sm font-medium text-slate-700">
                      {formatDate(validationResult.reservation.startTime)}
                    </div>
                    <div className="h-0.5 w-4 bg-slate-300"></div>
                    <div className="text-sm font-medium text-slate-700">
                      {formatDate(validationResult.reservation.endTime)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard size={14} />
                    <span className="text-xs font-semibold uppercase">
                      Payment
                    </span>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 font-bold border border-emerald-100">
                    LKR {validationResult.reservation.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {validationResult.success && validationResult.reservation && (
              <div className="mt-6 flex flex-col items-center gap-4">
                {validationResult.reservation.status !== "CONFIRMED" && validationResult.reservation.status !== "CHECKED_IN" && (
                  <div className="text-center text-sm font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
                    No actions available for status: {validationResult.reservation.status.replace("_", " ")}
                  </div>
                )}
                
                <div className="flex w-full max-w-md gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetScanner}
                  >
                    Scan Another
                  </Button>
                  
                  {validationResult.reservation.status === "CONFIRMED" && (
                    <Button
                      variant="primary"
                      className="flex-1 shadow-md shadow-primary-500/20 bg-blue-600 hover:bg-blue-700"
                      onClick={() => openConfirmDialog("check-in")}
                    >
                      Check In Driver
                    </Button>
                  )}
                  
                  {validationResult.reservation.status === "CHECKED_IN" && (
                    <Button
                      variant="primary"
                      className="flex-1 shadow-md shadow-orange-500/20 bg-orange-600 hover:bg-orange-700"
                      onClick={() => openConfirmDialog("check-out")}
                    >
                      Check Out Driver
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Card>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
      
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={`Confirm ${confirmConfig.action === "check-in" ? "Check-In" : "Check-Out"}`}
        description={`Are you sure you want to ${confirmConfig.action === "check-in" ? "check in" : "check out"} this driver?`}
        confirmText="Confirm"
        cancelText="Cancel"
        type={confirmConfig.action === "check-in" ? "info" : "warning"}
        onConfirm={handleAction}
        onClose={() => setConfirmConfig({ isOpen: false, action: null })}
      />
    </div>
  );
};

export default QRScannerPage;
