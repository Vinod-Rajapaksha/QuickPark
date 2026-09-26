import React, { useState } from "react";
import { Check, X } from "lucide-react";
import Badge from "../../../components/common/Badge/Badge";
import Button from "../../../components/common/Button/Button";
import ConfirmDialog from "../../../components/common/ConfirmDialog/ConfirmDialog";
import Input from "../../../components/common/Input/Input";
import type {
  FacilitySectionName,
  FacilitySectionReview,
} from "../types/parkingTypes";
import {
  SECTION_STATUS_BADGE_VARIANT,
  SECTION_STATUS_LABEL,
} from "../utils/parkingUtils";

interface SectionReviewsProps {
  sections: FacilitySectionReview[];
  // Absent for the owner, who reads the verdicts; present for the admin who sets them.
  onDecide?: (
    section: FacilitySectionName,
    decision: "APPROVED" | "REJECTED",
    remarks?: string,
  ) => void | Promise<unknown>;
  busyKey?: string | null;
}

export const SectionReviews: React.FC<SectionReviewsProps> = ({
  sections,
  onDecide,
  busyKey = null,
}) => {
  const [remarksBySection, setRemarksBySection] = useState<Record<string, string>>({});
  // A rejection leaves the driver listings and notifies the owner, so the click is confirmed first.
  const [confirming, setConfirming] = useState<FacilitySectionReview | null>(null);

  if (sections.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Nothing has been sent to the admin yet, so no section has been judged.
      </p>
    );
  }

  const confirmRejection = async () => {
    if (!confirming) return;
    const section = confirming;
    const remark = (remarksBySection[section.section] ?? "").trim();
    setConfirming(null);
    await onDecide?.(section.section, "REJECTED", remark);
  };

  const confirmingRemark = confirming
    ? (remarksBySection[confirming.section] ?? "").trim()
    : "";

  return (
    <>
      <ul className="space-y-3">
        {sections.map((section) => {
          const busy = busyKey === `section:${section.section}`;
          const remarks = remarksBySection[section.section] ?? "";
          // Already approved: only a rejection still needs saying.
          const deciding = onDecide !== undefined;

          return (
            <li
              key={section.section}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-900">{section.label}</p>
                <Badge variant={SECTION_STATUS_BADGE_VARIANT[section.status]} dot>
                  {SECTION_STATUS_LABEL[section.status]}
                </Badge>
                {section.reviewedAt && (
                  <span className="text-xs text-slate-400">
                    {new Date(section.reviewedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">{section.description}</p>

              {section.missingRequirements.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm text-amber-700">
                  {section.missingRequirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}

              {section.remarks && (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Admin: {section.remarks}
                </p>
              )}

              {deciding && (
                <div className="mt-3 space-y-2">
                  <Input
                    label="Remarks (needed to reject)"
                    value={remarks}
                    maxLength={500}
                    placeholder="What the owner must change, if you are sending it back."
                    onChange={(event) =>
                      setRemarksBySection((current) => ({
                        ...current,
                        [section.section]: event.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      leftIcon={<Check size={16} />}
                      isLoading={busy}
                      disabled={busy || section.status === "APPROVED"}
                      onClick={() => void onDecide?.(section.section, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      leftIcon={<X size={16} />}
                      isLoading={busy}
                      disabled={busy || remarks.trim() === ""}
                      onClick={() => setConfirming(section)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        isOpen={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => void confirmRejection()}
        type="danger"
        title={`Reject ${confirming?.label ?? "this section"}?`}
        description={
          confirmingRemark
            ? `The owner is told to fix this section and sees your remark: “${confirmingRemark}”. The property stays out of the driver listings until every section is approved.`
            : "The owner is told to fix this section. The property stays out of the driver listings until every section is approved."
        }
        confirmText="Reject and notify the owner"
        cancelText="Keep reviewing"
      />
    </>
  );
};

export default SectionReviews;
