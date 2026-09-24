import React from "react";

interface CommissionCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// One section of the configuration page. The three editors below all sit inside it so the
// admin reads the same heading/columns treatment for pricing, bays and vehicle types.
export const CommissionCard: React.FC<CommissionCardProps> = ({
  title,
  description,
  icon,
  children,
}) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-start gap-2">
      {icon && <span className="mt-0.5 text-slate-400">{icon}</span>}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
    </div>
    {children}
  </section>
);

export default CommissionCard;
