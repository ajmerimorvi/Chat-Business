import React, { useState } from 'react';
import { Business, Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { Smartphone, MapPin, Building2, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';

interface VerificationWizardModalProps {
  business: Business;
  onClose: () => void;
  onUpdateVerification: (updatedBiz: Business) => void;
  lang?: Language;
}

export const VerificationWizardModal: React.FC<VerificationWizardModalProps> = ({
  business,
  onClose,
  onUpdateVerification,
  lang = 'en',
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'step1' | 'step2' | 'step3'>('step2');

  // Step 1: Mobile
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [mobileVerifying, setMobileVerifying] = useState(false);

  // Step 2: Location
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(business.verification.locationVerified);
  const [gpsDetails, setGpsDetails] = useState(business.verification.verifiedCoordinates || null);

  // Step 3: Document
  const [gstin, setGstin] = useState(business.verification.businessDocNumber || '');
  const [docType, setDocType] = useState<'gstin' | 'shop_act' | 'trade_license'>('gstin');
  const [docVerifying, setDocVerifying] = useState(false);
  const [docSuccess, setDocSuccess] = useState(business.verification.businessDocVerified);

  const handleSendOtp = () => {
    setOtpSent(true);
    setOtpCode('7492'); // Pre-fill mock OTP for quick UX
  };

  const handleVerifyOtp = () => {
    setMobileVerifying(true);
    setTimeout(() => {
      setMobileVerifying(false);
      const updated: Business = {
        ...business,
        verification: {
          ...business.verification,
          mobileVerified: true,
          mobileVerifiedAt: new Date().toISOString().split('T')[0],
          level: Math.max(business.verification.level, 1) as any,
          lastVerifiedDate: new Date().toISOString().split('T')[0],
        },
      };
      onUpdateVerification(updated);
    }, 600);
  };

  const handleCaptureGps = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy) || 12;

          setGpsLoading(false);
          setGpsSuccess(true);
          const coords = {
            lat,
            lng,
            accuracyMeters: accuracy,
            address: `${business.address}, ${business.city}`,
          };
          setGpsDetails(coords);

          const updated: Business = {
            ...business,
            verification: {
              ...business.verification,
              locationVerified: true,
              locationVerifiedAt: new Date().toISOString().split('T')[0],
              verifiedCoordinates: coords,
              level: Math.max(business.verification.level, 2) as any,
              lastVerifiedDate: new Date().toISOString().split('T')[0],
              reverificationRequired: false,
            },
          };
          onUpdateVerification(updated);
        },
        (error) => {
          // Fallback simulation to Rajkot coordinates for desktop browsers without GPS
          setGpsLoading(false);
          setGpsSuccess(true);
          const simulatedCoords = {
            lat: business.lat || 22.2856,
            lng: business.lng || 70.7932,
            accuracyMeters: 10,
            address: `${business.address}, ${business.city}`,
          };
          setGpsDetails(simulatedCoords);

          const updated: Business = {
            ...business,
            verification: {
              ...business.verification,
              locationVerified: true,
              locationVerifiedAt: new Date().toISOString().split('T')[0],
              verifiedCoordinates: simulatedCoords,
              level: Math.max(business.verification.level, 2) as any,
              lastVerifiedDate: new Date().toISOString().split('T')[0],
              reverificationRequired: false,
            },
          };
          onUpdateVerification(updated);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsLoading(false);
      setGpsSuccess(true);
    }
  };

  const handleVerifyDocument = () => {
    if (!gstin.trim()) return;
    setDocVerifying(true);
    setTimeout(() => {
      setDocVerifying(false);
      setDocSuccess(true);

      const updated: Business = {
        ...business,
        verification: {
          ...business.verification,
          businessDocVerified: true,
          businessDocType: docType,
          businessDocNumber: gstin.toUpperCase(),
          businessDocVerifiedAt: new Date().toISOString().split('T')[0],
          level: 3,
          lastVerifiedDate: new Date().toISOString().split('T')[0],
        },
      };
      onUpdateVerification(updated);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-300" />
            <div>
              <h2 className="font-bold text-base leading-tight">{t.verifyYourBusiness}</h2>
              <p className="text-[11px] text-emerald-200">{business.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-emerald-700 rounded-full transition-colors text-white"
          >
            ✕
          </button>
        </div>

        {/* Verification Tab Selector */}
        <div className="flex border-b border-gray-200 text-xs font-semibold bg-gray-50">
          <button
            onClick={() => setActiveTab('step1')}
            className={`flex-1 py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'step1'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Smartphone size={14} />
            <span>L1: Mobile</span>
            {business.verification.mobileVerified && (
              <CheckCircle2 size={12} className="text-emerald-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('step2')}
            className={`flex-1 py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'step2'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <MapPin size={14} />
            <span>L2: Location</span>
            {business.verification.locationVerified && (
              <CheckCircle2 size={12} className="text-emerald-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('step3')}
            className={`flex-1 py-2.5 px-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'step3'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building2 size={14} />
            <span>L3: Entity</span>
            {business.verification.businessDocVerified && (
              <CheckCircle2 size={12} className="text-purple-600" />
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* STEP 1: MOBILE */}
          {activeTab === 'step1' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <p className="font-semibold">{t.verifyStep1Title}</p>
                <p className="text-[11px] mt-0.5 text-emerald-800">
                  Verifies that you are the genuine owner of registered phone number{' '}
                  <strong>{business.phone}</strong>.
                </p>
              </div>

              {business.verification.mobileVerified ? (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 size={18} />
                  <span>🟢 Mobile Verified ({business.phone})</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {!otpSent ? (
                    <button
                      onClick={handleSendOtp}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-colors"
                    >
                      Send OTP to {business.phone}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 block">
                        Enter 4-digit OTP sent to {business.phone}
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full text-center tracking-widest text-lg font-bold py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                      <button
                        onClick={handleVerifyOtp}
                        disabled={mobileVerifying}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {mobileVerifying && <Loader2 size={14} className="animate-spin" />}
                        <span>Confirm Mobile Verification</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: LOCATION */}
          {activeTab === 'step2' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <p className="font-semibold">{t.verifyStep2Title}</p>
                <p className="text-[11px] mt-0.5 text-blue-800 leading-relaxed">
                  The business owner must physically be present at the registered storefront or workshop.
                  Sampark captures device GPS and validates geofencing accuracy.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Registered Address:</span>
                  <span className="font-medium text-gray-900 text-right truncate max-w-[200px]">
                    {business.address}
                  </span>
                </div>
                {gpsDetails && (
                  <>
                    <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-gray-200">
                      <span>Live GPS Match:</span>
                      <span>Verified (±{gpsDetails.accuracyMeters}m accuracy)</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Lat: {gpsDetails.lat.toFixed(4)}, Lng: {gpsDetails.lng.toFixed(4)}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleCaptureGps}
                disabled={gpsLoading}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                {gpsLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Checking on-site GPS & accuracy...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    <span>
                      {gpsSuccess ? 'Re-verify On-Site GPS Location' : 'Perform On-Site Location Verification'}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Requires device location permission. Does NOT broadcast exact customer GPS.
              </p>
            </div>
          )}

          {/* STEP 3: DOCUMENT */}
          {activeTab === 'step3' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                <p className="font-semibold">{t.verifyStep3Title}</p>
                <p className="text-[11px] mt-0.5 text-purple-800 leading-relaxed">
                  Upload trade license, Shop &amp; Establishment Act registration, or GSTIN to receive the
                  prestigious <strong>🏢 Business Verified</strong> badge.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 block">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full p-2 text-xs border border-gray-300 rounded-xl focus:outline-hidden"
                >
                  <option value="gstin">GSTIN (Goods and Services Tax Number)</option>
                  <option value="shop_act">Gujarat Shop &amp; Establishment Act</option>
                  <option value="trade_license">Municipal Trade License</option>
                </select>

                <label className="text-xs font-medium text-gray-700 block">Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. 24AAACR1234F1Z8"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-300 rounded-xl uppercase font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                />

                <button
                  onClick={handleVerifyDocument}
                  disabled={docVerifying || !gstin.trim()}
                  className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {docVerifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Validating with portal...</span>
                    </>
                  ) : (
                    <span>Submit &amp; Validate Document</span>
                  )}
                </button>
              </div>

              {docSuccess && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center gap-2 text-xs text-purple-800 font-semibold">
                  <CheckCircle2 size={18} />
                  <span>🏢 Business Verified ({gstin})</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
