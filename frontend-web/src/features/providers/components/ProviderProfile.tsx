import React from "react";
import { Building2, CreditCard, Mail, MapPin, Phone, User } from "lucide-react";
import Card from "../../../components/common/Card/Card";
import type { ProviderProfile } from "../types/providerTypes";

interface ProviderProfileCardProps {
  profile: ProviderProfile;
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <span className="mt-0.5 text-slate-400">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 break-words">
        {value && value.length > 0 ? value : "—"}
      </p>
    </div>
  </div>
);

export const ProviderProfileCard: React.FC<ProviderProfileCardProps> = ({
  profile,
}) => (
  <Card className="border-slate-200" padding="none">
    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
      <h3 className="font-semibold text-slate-900">Owner Information</h3>
    </div>
    <div className="px-6 py-2 divide-y divide-slate-100">
      <DetailRow
        icon={<User size={18} />}
        label="Full name"
        value={profile.fullName}
      />
      <DetailRow
        icon={<Mail size={18} />}
        label="Email"
        value={profile.email}
      />
      <DetailRow
        icon={<Phone size={18} />}
        label="Phone"
        value={profile.phone}
      />
      <DetailRow
        icon={<CreditCard size={18} />}
        label="NIC number"
        value={profile.nicNumber}
      />
      <DetailRow
        icon={<Building2 size={18} />}
        label="Business name"
        value={profile.businessName}
      />
      <DetailRow
        icon={<MapPin size={18} />}
        label="Address"
        value={profile.address}
      />
    </div>
  </Card>
);

export default ProviderProfileCard;
