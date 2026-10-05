import type { BadgeVariant } from "../../../components/common/Badge/Badge";
import type { ProviderVerificationStatus } from "../types/providerTypes";

export const STATUS_BADGE_VARIANT: Record<
  ProviderVerificationStatus,
  BadgeVariant
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

export const STATUS_LABEL: Record<ProviderVerificationStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const STATUS_HELP_TEXT: Record<ProviderVerificationStatus, string> = {
  PENDING:
    "Your NIC document has been received and is waiting for platform admin review.",
  APPROVED:
    "Your identity has been verified. You can now access all parking owner features.",
  REJECTED:
    "Your NIC document was rejected. Review the remarks and upload a clear JPG or PNG copy to resubmit.",
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error && typeof error === "object") {
    const anyErr = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    const serverMessage = anyErr.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage.length > 0) {
      return serverMessage;
    }
    if (typeof anyErr.message === "string" && anyErr.message.length > 0) {
      return anyErr.message;
    }
  }
  return fallback;
}
