export type ProviderVerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ProviderProfile {
  providerId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  nicNumber: string;
  businessName: string | null;
  address: string | null;
  verificationStatus: ProviderVerificationStatus;
  verificationRemarks: string | null;
  hasNicDocument: boolean;
  nicDocumentUrl: string | null;
  nicDocumentContentType: string | null;
  nicDocumentSize: number;
  nicSubmittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
