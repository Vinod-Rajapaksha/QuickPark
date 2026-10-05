import React, { useRef, useState } from "react";
import { Eye, ShieldCheck, Upload } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import Spinner from "../../../components/common/Spinner/Spinner";
import type { ProviderProfile } from "../types/providerTypes";
import { nicFileSchema } from "../schemas/providerSchemas";
import {
  formatBytes,
  formatDateTime,
  getApiErrorMessage,
  STATUS_HELP_TEXT,
} from "../utils/providerUtils";
import NicPreviewModal from "./NicPreviewModal";
import ProviderStatusBadge from "./ProviderStatusBadge";

interface ProviderVerificationProps {
  profile: ProviderProfile;
  isUploading: boolean;
  onUpload: (file: File) => Promise<unknown>;
  onGetDocumentUrl: () => Promise<string | null>;
}

export const ProviderVerification: React.FC<ProviderVerificationProps> = ({
  profile,
  isUploading,
  onUpload,
  onGetDocumentUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const isApproved = profile.verificationStatus === "APPROVED";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    setUploadError(null);
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setUploadError(null);
    setPreviewUrl(null);
    setIsPreviewOpen(false);

    if (!selectedFile) {
      setLocalError("Please choose a JPG or PNG image of your NIC.");
      return;
    }

    const parsed = nicFileSchema.safeParse(selectedFile);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Invalid file.");
      return;
    }

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(getApiErrorMessage(err, "NIC upload failed."));
    }
  };

  const handleViewDocument = async () => {
    if (previewUrl) {
      setIsPreviewOpen(true);
      return;
    }

    setIsLoadingPreview(true);
    setUploadError(null);
    const url = await onGetDocumentUrl();
    setIsLoadingPreview(false);

    if (!url) {
      setUploadError("Could not load your NIC document. Please try again.");
      return;
    }

    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <Card className="border-slate-200" padding="none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <ShieldCheck size={18} className="text-slate-400" />
            NIC Verification
          </h3>
          <ProviderStatusBadge status={profile.verificationStatus} />
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-600">
            {profile.hasNicDocument
              ? STATUS_HELP_TEXT[profile.verificationStatus]
              : "You have not uploaded your NIC yet. Upload a clear JPG or PNG copy below to start the verification process."}
          </p>

          {profile.verificationRemarks && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Admin remarks
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {profile.verificationRemarks}
              </p>
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Submitted at
              </dt>
              <dd className="mt-1 text-slate-700">
                {formatDateTime(profile.nicSubmittedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">
                Verified at
              </dt>
              <dd className="mt-1 text-slate-700">
                {formatDateTime(profile.verifiedAt)}
              </dd>
            </div>
            {profile.hasNicDocument && (
              <>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Document type
                  </dt>
                  <dd className="mt-1 text-slate-700">
                    {profile.nicDocumentContentType ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Document size
                  </dt>
                  <dd className="mt-1 text-slate-700">
                    {formatBytes(profile.nicDocumentSize)}
                  </dd>
                </div>
              </>
            )}
          </dl>

          {profile.hasNicDocument && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Eye size={16} />}
              isLoading={isLoadingPreview}
              onClick={handleViewDocument}
            >
              View uploaded NIC
            </Button>
          )}

          {!isApproved && (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 border-t border-slate-100 pt-5"
            >
              <div>
                <label
                  htmlFor="nic-file"
                  className="block text-sm font-medium text-slate-700"
                >
                  {profile.hasNicDocument
                    ? "Replace NIC document"
                    : "Upload NIC document"}
                </label>
                <input
                  id="nic-file"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-slate-400">
                  JPG or PNG only, up to 5 MB. Uploading resets your status to
                  pending review.
                </p>
              </div>

              {selectedFile && (
                <p className="text-xs text-slate-500">
                  Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
                </p>
              )}

              {localError && (
                <p className="text-sm text-red-600" role="alert">
                  {localError}
                </p>
              )}
              {uploadError && (
                <p className="text-sm text-red-600" role="alert">
                  {uploadError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Upload size={16} />}
                isLoading={isUploading}
                disabled={!selectedFile}
              >
                {isUploading ? "Uploading…" : "Submit for verification"}
              </Button>
            </form>
          )}

          {isUploading && <Spinner size="sm" />}
        </div>
      </Card>

      <NicPreviewModal
        open={isPreviewOpen}
        url={previewUrl}
        title="Uploaded NIC document"
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
};

export default ProviderVerification;
