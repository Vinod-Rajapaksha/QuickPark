import React from "react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import ProviderProfileCard from "../../features/providers/components/ProviderProfile";
import ProviderVerification from "../../features/providers/components/ProviderVerification";
import { useProvider } from "../../features/providers/hooks/useProvider";

export const ProviderProfilePage: React.FC = () => {
  const { profile, isLoading, isUploading, error, refresh, uploadNic, getNicDocumentUrl } =
    useProvider();

  if (isLoading) {
    return <Spinner fullScreen size="xl" />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-xl font-semibold text-slate-900">
          Unable to load your provider profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {error ?? "Your provider profile is not available."}
        </p>
        <Button className="mt-6" variant="outline" onClick={() => void refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Parking Owner Profile
        </h1>
        <p className="text-slate-500 mt-1">
          Review your owner details and manage your identity verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ProviderProfileCard profile={profile} />
        <ProviderVerification
          profile={profile}
          isUploading={isUploading}
          onUpload={uploadNic}
          onGetDocumentUrl={getNicDocumentUrl}
        />
      </div>
    </div>
  );
};

export default ProviderProfilePage;
