import React from 'react';
import { Business } from '../../domain/types';
import { VerificationBadge } from './VerificationBadge';
import {
  X,
  Building2,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Tag,
  Info,
} from 'lucide-react';

interface BusinessDetailModalProps {
  business: Business | null;
  onClose: () => void;
  onUpgradeVerification?: (businessId: string, level: 1 | 2 | 3) => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  onClose,
  onUpgradeVerification,
}) => {
  if (!business) return null;

  const getSourceLabel = (src?: string) => {
    switch (src) {
      case 'CSV_IMPORT':
        return 'CSV Import';
      case 'EXCEL_IMPORT':
        return 'Excel Import';
      case 'SALES_TEAM':
        return 'Sales Team Entry';
      case 'MANUAL':
      default:
        return 'Manual Entry';
    }
  };

  const verStatus = business.verificationStatus || (business.verification?.level > 0 ? 'VERIFIED' : 'UNVERIFIED');
  const dbStatus = business.status || 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-600">
              {business.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">{business.name}</h2>
              <p className="text-[11px] text-slate-400">
                ID: <span className="font-mono">{business.id}</span> · {business.city}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Pill Strip */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-semibold text-[11px]">Database Status:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                dbStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {dbStatus}
            </span>

            <span className="text-gray-300">|</span>

            <span className="text-gray-500 font-semibold text-[11px]">Verification Status:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                verStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : verStatus === 'VERIFICATION_PENDING'
                  ? 'bg-blue-100 text-blue-800'
                  : verStatus === 'REJECTED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {verStatus}
            </span>
          </div>

          <div className="text-[11px] text-gray-500">
            Source: <strong className="text-gray-800">{getSourceLabel(business.source)}</strong>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Unverified Notice when applicable */}
          {verStatus === 'UNVERIFIED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
              <ShieldAlert size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Business is Unverified</strong>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  This enterprise was imported or created as an initial directory entry. It does not carry Sampark verified trust badges until physical location, active mobile OTP, and document checks have passed.
                </p>
              </div>
            </div>
          )}

          {verStatus === 'VERIFIED' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-700" />
                <span className="font-bold text-emerald-900">Sampark Verified Business</span>
              </div>
              <VerificationBadge verification={business.verification} size="sm" showDetails />
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category & Contact */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-emerald-700" /> Enterprise &amp; Category
              </h3>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Name:</span>
                  <span className="font-semibold text-gray-900 text-right">{business.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-medium text-gray-800">{business.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sub Category:</span>
                  <span className="text-gray-700">{business.subcategory || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Type:</span>
                  <span className="text-gray-700 capitalize">{business.businessType?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact Person:</span>
                  <span className="font-semibold text-gray-900">{business.contactPerson || 'Not Specified'}</span>
                </div>
              </div>
            </div>

            {/* Communication & Phone */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <Phone size={13} className="text-emerald-700" /> Numbers &amp; Communication
              </h3>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mobile Phone:</span>
                  <span className="font-mono font-semibold text-gray-900">{business.phone || business.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">WhatsApp:</span>
                  <span className="font-mono text-gray-800">{business.whatsapp || business.phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-700">{business.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Open for Chat:</span>
                  <span className={business.openForChat ? 'text-emerald-700 font-semibold' : 'text-gray-500'}>
                    {business.openForChat ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Physical Location */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 md:col-span-2">
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-700" /> Physical Address &amp; Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500 block">Address:</span>
                  <span className="font-medium text-gray-900">{business.address}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Area / Locality:</span>
                  <span className="text-gray-800">{business.area || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">City &amp; State:</span>
                  <span className="font-medium text-gray-800">
                    {business.city}, {business.state || 'Gujarat'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">PIN Code:</span>
                  <span className="font-mono text-gray-800">{business.pincode || '—'}</span>
                </div>
              </div>
            </div>

            {/* Audit & Ingestion Metadata */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 md:col-span-2">
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-200 pb-1.5 flex items-center gap-1.5">
                <Info size={13} className="text-emerald-700" /> Ingestion &amp; Audit Trail
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500 block">Source:</span>
                  <span className="font-semibold text-gray-800">{getSourceLabel(business.source)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Import ID:</span>
                  <span className="font-mono text-gray-700">{business.importId || 'Direct'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Created Date:</span>
                  <span className="text-gray-700">
                    {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : 'Baseline'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Updated Date:</span>
                  <span className="text-gray-700">
                    {business.updatedAt ? new Date(business.updatedAt).toLocaleDateString() : 'Baseline'}
                  </span>
                </div>
              </div>

              {business.remarks && (
                <div className="pt-2 border-t border-gray-200 text-[11px]">
                  <span className="text-gray-500 font-semibold block mb-0.5">Admin Remarks:</span>
                  <p className="text-gray-700 bg-white p-2 rounded border border-gray-200 italic">
                    "{business.remarks}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
          <div className="text-[11px] text-gray-500">
            {verStatus === 'UNVERIFIED'
              ? 'Verification is pending future OTP / GPS inspection workflow.'
              : `Verified at Level ${business.verification.level}`}
          </div>

          <div className="flex items-center gap-2">
            {onUpgradeVerification && business.verification?.level < 3 && (
              <button
                type="button"
                onClick={() => onUpgradeVerification(business.id, (business.verification.level + 1) as any)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium text-xs transition-colors"
              >
                Approve Verification Level {business.verification.level + 1}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
