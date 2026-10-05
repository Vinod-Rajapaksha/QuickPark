import React from "react";
import Badge from "../../../components/common/Badge/Badge";
import type { ProviderVerificationStatus } from "../types/providerTypes";
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from "../utils/providerUtils";

interface ProviderStatusBadgeProps {
  status: ProviderVerificationStatus;
  size?: "sm" | "md";
}

export const ProviderStatusBadge: React.FC<ProviderStatusBadgeProps> = ({
  status,
  size = "sm",
}) => (
  <Badge variant={STATUS_BADGE_VARIANT[status]} size={size} dot>
    {STATUS_LABEL[status]}
  </Badge>
);

export default ProviderStatusBadge;
