import React from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import ProviderCard from "../../features/providers/components/ProviderCard";
import { useProviders } from "../../features/providers/hooks/useProviders";

export const ProvidersPage: React.FC = () => {
  const {
    pending,
    isLoading,
    loadError,
    actionError,
    busyUserId,
    refresh,
    decide,
    getDocumentUrl,
  } = useProviders();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <ShieldCheck size={24} className="text-slate-400" />
            Provider Verifications
          </h1>
          <p className="text-slate-500 mt-1">
            Review submitted NIC documents and approve or reject parking owner
            verification requests.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={16} />}
          isLoading={isLoading}
          onClick={() => void refresh()}
        >
          Refresh
        </Button>
      </div>

      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : loadError ? (
        <div className="text-center py-16">
          <p className="text-slate-600">{loadError}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void refresh()}
          >
            Try again
          </Button>
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="font-medium text-slate-700">No pending verifications</p>
          <p className="mt-1 text-sm text-slate-500">
            New parking owner NIC submissions will appear here for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {pending.map((provider) => (
            <ProviderCard
              key={provider.providerId}
              provider={provider}
              busy={busyUserId === provider.userId}
              onDecide={decide}
              onGetDocumentUrl={getDocumentUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProvidersPage;
