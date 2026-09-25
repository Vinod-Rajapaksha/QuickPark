import React from "react";
import { LayoutDashboard } from "lucide-react";

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <LayoutDashboard size={24} className="text-slate-400" />
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of the platform's key metrics and activities.
          </p>
        </div>
      </div>
      
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="font-medium text-slate-700">Dashboard content coming soon</p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
