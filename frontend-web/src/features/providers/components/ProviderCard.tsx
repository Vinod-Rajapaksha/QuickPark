import React, { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import type { ProviderProfile } from "../types/providerTypes";
import { formatBytes, formatDateTime } from "../utils/providerUtils";
import NicPreviewModal from "./NicPreviewModal";
import ProviderStatusBadge from "./ProviderStatusBadge";

interface ProviderCardProps {
  provider: ProviderProfile;
  busy: boolean;
  onDecide: (
    userId: string,
    status: "APPROVED" | "REJECTED",
    remarks?: string,
  ) => Promise<boolean>;
  onGetDocumentUrl: (userId: string) => Promise<string | null>;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  busy,
  onDecide,
  onGetDocumentUrl,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleViewDocument = async () => {
    if (previewUrl) {
      setIsPreviewOpen(true);
      return;
    }

    setIsLoadingPreview(true);
    setLocalError(null);
    const url = await onGetDocumentUrl(provider.userId);
    setIsLoadingPreview(false);

    if (!url) {
      setLocalError("This provider has not uploaded a NIC document yet.");
      return;
    }

    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleApprove = async () => {
    setLocalError(null);
    await onDecide(provider.userId, "APPROVED", remarks.trim() || undefined);
  };

  const handleReject = async () => {
    const trimmed = remarks.trim();
    if (trimmed.length === 0) {
      setLocalError("Remarks are required when rejecting a verification.");
      return;
    }
    setLocalError(null);
    const ok = await onDecide(provider.userId, "REJECTED", trimmed);
    if (ok) {
      setRejecting(false);
      setRemarks("");
    }
  };

  return (
    <Card className="border-slate-200" padding="none">
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {provider.fullName}
          </h3>
          <p className="text-sm text-slate-500 truncate">{provider.email}</p>
        </div>
        <ProviderStatusBadge status={provider.verificationStatus} />
      </div>

      <div className="p-6 space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Phone
            </dt>
            <dd className="mt-1 text-slate-700">{provider.phone}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              NIC number
            </dt>
            <dd className="mt-1 text-slate-700">{provider.nicNumber}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Submitted at
            </dt>
            <dd className="mt-1 text-slate-700">
              {formatDateTime(provider.nicSubmittedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Document
            </dt>
            <dd className="mt-1 text-slate-700">
              {provider.nicDocumentContentType ?? "—"} ·{" "}
              {formatBytes(provider.nicDocumentSize)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Eye size={16} />}
            isLoading={isLoadingPreview}
            onClick={handleViewDocument}
          >
            View NIC
          </Button>

          {!rejecting && (
            <>
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Check size={16} />}
                isLoading={busy}
                onClick={handleApprove}
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<X size={16} />}
                disabled={busy}
                onClick={() => {
                  setLocalError(null);
                  setRejecting(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </div>

        {rejecting && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <label
              htmlFor={`remarks-${provider.userId}`}
              className="block text-sm font-medium text-slate-700"
            >
              Rejection remarks (required)
            </label>
            <textarea
              id={`remarks-${provider.userId}`}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={3}
              disabled={busy}
              placeholder="Explain why this NIC document is being rejected."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={busy}
                onClick={handleReject}
              >
                Confirm rejection
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setRejecting(false);
                  setLocalError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {localError && (
          <p className="text-sm text-red-600" role="alert">
            {localError}
          </p>
        )}
      </div>

      <NicPreviewModal
        open={isPreviewOpen}
        url={previewUrl}
        title={`NIC document · ${provider.fullName}`}
        onClose={() => setIsPreviewOpen(false)}
      />
    </Card>
  );
};

export default ProviderCard;
