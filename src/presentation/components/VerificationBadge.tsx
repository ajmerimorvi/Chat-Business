import React from 'react';
import { BusinessVerification, Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { Smartphone, MapPin, Building2, AlertCircle } from 'lucide-react';

interface VerificationBadgeProps {
  verification?: BusinessVerification;
  lang?: Language;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verification,
  lang = 'en',
  size = 'md',
  showDetails = false,
}) => {
  if (!verification || verification.level === 0) return null;

  const t = getTranslation(lang);
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;
  const textSize = size === 'sm' ? 'text-[11px]' : size === 'md' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {verification.mobileVerified && (
        <span
          className={`inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ${textSize}`}
          title="Owner mobile number authenticated via OTP"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <Smartphone size={iconSize} className="text-emerald-600" />
          {t.mobileVerified}
        </span>
      )}

      {verification.locationVerified && (
        <span
          className={`inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded ${textSize}`}
          title="Physical store GPS location verified on premises"
        >
          <MapPin size={iconSize} className="text-blue-600" />
          {t.locationVerified}
        </span>
      )}

      {verification.businessDocVerified && (
        <span
          className={`inline-flex items-center gap-1 font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded ${textSize}`}
          title="Government registration / GSTIN documents verified"
        >
          <Building2 size={iconSize} className="text-purple-600" />
          {t.businessVerified}
        </span>
      )}

      {verification.reverificationRequired && (
        <span
          className={`inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ${textSize}`}
          title="Periodic or risk-triggered re-verification required"
        >
          <AlertCircle size={iconSize} className="text-amber-600" />
          {t.reverificationNeeded}
        </span>
      )}

      {showDetails && verification.verifiedCoordinates && (
        <div className="w-full text-[11px] text-gray-500 mt-1">
          📍 Verified at: {verification.verifiedCoordinates.address} (GPS accuracy: ±{verification.verifiedCoordinates.accuracyMeters}m)
        </div>
      )}
    </div>
  );
};
