import React, { useEffect, useState } from "react";
import { Users, Plus, Shield, CheckCircle2, XCircle } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import { useStaff } from "../../features/parking-staff/hooks/useStaff";
import { useParkings } from "../../features/parking/hooks/useParkings";
import { CreateStaffModal } from "../../features/parking-staff/components/CreateStaffModal";
import { EditStaffModal } from "../../features/parking-staff/components/EditStaffModal";
import type { StaffResponse } from "../../features/parking-staff/types/staffTypes";

const StaffManagementPage: React.FC = () => {
  const {
    staffList,
    isLoading,
    fetchStaff,
    createStaff,
    updateStaff,
    updateStaffStatus,
  } = useStaff();
  const { facilities } = useParkings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffResponse | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Users size={24} className="text-slate-400" />
            Staff Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your staff accounts and their facility assignments.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          rightIcon={<Plus size={18} />}
        >
          Add Staff Member
        </Button>
      </div>

      {isLoading && staffList.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            No Staff Members Found
          </h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            You haven't added any staff members yet. Staff members can help you
            manage your parking facilities, check vehicles in and out, and view
            daily reservations.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            Add Your First Staff Member
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-500 font-medium">
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Facility</th>
                  <th className="p-4">Role / Title</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">
                        {staff.fullName}
                      </div>
                      <div className="text-sm text-slate-500">
                        {staff.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 font-medium">
                        {staff.facilityName}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-slate-400" />
                        <span className="text-slate-800">{staff.type}</span>
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {staff.position}
                      </div>
                    </td>
                    <td className="p-4">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <XCircle size={14} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStaff(staff)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStaffStatus(staff.id, !staff.isActive)
                        }
                      >
                        {staff.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createStaff}
        facilities={facilities}
      />

      <EditStaffModal
        isOpen={editingStaff !== null}
        onClose={() => setEditingStaff(null)}
        onSubmit={updateStaff}
        staff={editingStaff}
      />
    </div>
  );
};

export default StaffManagementPage;
