import React, { useRef, useState } from "react";
import { Eye, Trash2, Upload } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Spinner from "../../../components/common/Spinner/Spinner";
import NicPreviewModal from "../../providers/components/NicPreviewModal";
import { formatBytes, formatDateTime } from "../../providers/utils/providerUtils";
import { facilityDocumentFileSchema } from "../schemas/parkingSchemas";
import type {
  DocumentRequirement,
  FacilityDocumentType,
  ParkingFacilityDocument,
} from "../types/parkingTypes";
import { documentProgress, documentTabsFor } from "../utils/parkingUtils";

interface FacilityDocumentTabsProps {
  requirements: DocumentRequirement[];
  documents: ParkingFacilityDocument[];
  isUploading: boolean;
  actionError: string | null;
  onUpload: (type: FacilityDocumentType, file: File) => Promise<boolean>;
  onRemove: (documentId: string) => Promise<boolean>;
}

export const FacilityDocumentTabs: React.FC<FacilityDocumentTabsProps> = ({
  requirements,
  documents,
  isUploading,
  actionError,
  onUpload,
  onRemove,
}) => {
  const tabs = documentTabsFor(requirements);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState<FacilityDocumentType | null>(
    tabs[0]?.type ?? null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] =
    useState<ParkingFacilityDocument | null>(null);

  if (tabs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        The document requirements could not be loaded. Refresh this page and try again.
      </p>
    );
  }

  const activeTab = tabs.find((tab) => tab.type === activeType) ?? tabs[0];
  const activeDocuments = documents.filter(
    (document) => document.type === activeTab.type,
  );
  const isFull =
    !activeTab.replacesExisting &&
    activeTab.maxAllowed !== null &&
    activeTab.count >= activeTab.maxAllowed;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!selectedFile) {
      setLocalError(`Please choose a JPG or PNG image of the ${activeTab.label.toLowerCase()}.`);
      return;
    }

    const parsed = facilityDocumentFileSchema.safeParse(selectedFile);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Invalid file.");
      return;
    }

    const uploaded = await onUpload(activeTab.type, selectedFile);
    if (uploaded) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Property documents"
        className="flex flex-wrap gap-1 border-b border-slate-200"
      >
        {tabs.map((tab) => {
          const isActive = tab.type === activeTab.type;

          return (
            <button
              key={tab.type}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveType(tab.type);
                setSelectedFile(null);
                setLocalError(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                  tab.satisfied
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
                {tab.minRequired > 0 ? `/${tab.minRequired}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <p className="text-sm text-slate-500">{activeTab.hint}</p>
        <p className="mt-1 text-xs text-slate-400">
          {documentProgress(activeTab)}
          {activeTab.replacesExisting && activeTab.count > 0
            ? " — uploading a new image replaces this one."
            : ""}
        </p>
      </div>

      {activeDocuments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Nothing uploaded in this tab yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {activeDocuments.map((document) => (
            <li
              key={document.documentId}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {document.fileName ?? "Untitled image"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatBytes(document.sizeBytes)} · {formatDateTime(document.uploadedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye size={16} />}
                  onClick={() => setPreviewDocument(document)}
                >
                  View
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete document"
                  onClick={() => void onRemove(document.documentId)}
                >
                  <Trash2 size={16} className="text-red-600" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 pt-5">
        {isFull ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {activeTab.label} is complete with {activeTab.count} image
            {activeTab.count === 1 ? "" : "s"}. Delete one to replace it.
          </p>
        ) : (
          <>
            <div>
              <label
                htmlFor={`document-file-${activeTab.type}`}
                className="block text-sm font-medium text-slate-700"
              >
                Upload to {activeTab.label}
              </label>
              <input
                id={`document-file-${activeTab.type}`}
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={isUploading}
                className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-slate-400">
                JPG or PNG only, up to 5 MB.
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
            {actionError && (
              <p className="text-sm text-red-600" role="alert">
                {actionError}
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
              {isUploading ? "Uploading…" : "Upload document"}
            </Button>

            {isUploading && <Spinner size="sm" />}
          </>
        )}
      </form>

      <NicPreviewModal
        open={previewDocument !== null}
        url={previewDocument?.url ?? null}
        title={`${activeTab.label} · ${previewDocument?.fileName ?? "document"}`}
        emptyMessage="This document could not be loaded."
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
};

export default FacilityDocumentTabs;
