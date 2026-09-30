import React, { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { X, QrCode, Download, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import Button from "../../../components/common/Button/Button";
import { qrTokenApi } from "../api/qrTokenApi";

interface QrCodeDisplayProps {
  reservationId: string;
  title?: string;
  description?: string;
  onClose: () => void;
}

const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({
  reservationId,
  title = "Booking QR Code",
  description = "Scan this code at the gate to check in.",
  onClose,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        const data = await qrTokenApi.getReservationToken(reservationId);
        if (isMounted) {
          setToken(data.token);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          const axiosError = err as AxiosError<{ message?: string }>;
          setError(
            axiosError.response?.data?.message ||
              "Failed to generate QR token.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchToken();
    return () => {
      isMounted = false;
    };
  }, [reservationId]);

  const handleDownload = () => {
    if (!qrWrapperRef.current) return;
    const svg = qrWrapperRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QuickPark-Reservation-${reservationId.slice(0, 8)}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-in fade-in zoom-in-95 rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <QrCode className="text-primary-600" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-xl border-4 border-slate-100 bg-white p-4 relative min-h-[200px] min-w-[200px] flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="animate-spin text-primary-500" size={40} />
            ) : error ? (
              <p className="text-sm text-red-500 text-center">{error}</p>
            ) : token ? (
              <div ref={qrWrapperRef}>
                <QRCode value={token} size={200} />
              </div>
            ) : null}
          </div>

          <p className="text-center text-sm text-slate-500">{description}</p>

          <div className="mt-4 flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDownload}
              disabled={!token || isLoading}
              leftIcon={<Download size={16} />}
            >
              Save Image
            </Button>
            <Button variant="primary" className="flex-1" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrCodeDisplay;
