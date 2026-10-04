import React, { useState } from 'react';
import { Business, ReportItem, Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  ShieldAlert,
  Building2,
  Search,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Filter,
  Eye,
  Sliders,
} from 'lucide-react';

interface AdminPortalScreenProps {
  businesses: Business[];
  reports: ReportItem[];
  onBack: () => void;
  onApproveVerification: (businessId: string, level: 1 | 2 | 3) => void;
  onToggleSponsored: (businessId: string) => void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'action_taken') => void;
  lang?: Language;
}

export const AdminPortalScreen: React.FC<AdminPortalScreenProps> = ({
  businesses,
  reports,
  onBack,
  onApproveVerification,
  onToggleSponsored,
  onResolveReport,
  lang = 'en',
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports' | 'search_analytics'>('verifications');

  const popularSearches = [
    { term: 'Raj', count: 1420, topResult: 'Raj Patel & Raj Hardware' },
    { term: 'furniture', count: 980, topResult: 'ABC Furniture' },
    { term: 'mattress', count: 640, topResult: 'Synnera Mattress' },
    { term: 'AC repair', count: 430, topResult: 'ABC Services' },
    { term: 'plywood', count: 320, topResult: 'Rajkamal Timber' },
  ];

  const zeroResultSearches = [
    { term: 'drone repair rajkot', count: 42 },
    { term: 'organic milk farm delivery', count: 31 },
    { term: 'piano tuner near me', count: 18 },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-base leading-tight">Sampark Admin &amp; Moderation Console</h1>
            <p className="text-[11px] text-slate-400">Platform Verification, Safety, &amp; Search Governance</p>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-gray-200 bg-white text-xs font-semibold px-2">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'verifications'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 size={15} />
          <span>Businesses &amp; Verifications ({businesses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ShieldAlert size={15} />
          <span>Reports &amp; Moderation ({reports.filter((r) => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('search_analytics')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'search_analytics'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <TrendingUp size={15} />
          <span>Search Intelligence</span>
        </button>
      </div>

      <div className="p-4 flex-1 space-y-4">
        {/* TAB 1: BUSINESSES & VERIFICATION AUDIT */}
        {activeTab === 'verifications' && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Verification Governance</span>
              <span className="text-gray-500">
                Rule: Paid subscription does <strong>NOT</strong> grant verification badges.
              </span>
            </div>

            <div className="space-y-2.5">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={biz.logoUrl || biz.coverImageUrl}
                        alt={biz.name}
                        className="w-11 h-11 rounded-lg object-cover border border-gray-200"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 leading-tight">{biz.name}</h3>
                        <p className="text-xs text-gray-500">
                          {biz.category} · {biz.city} · {biz.phone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                        {biz.subscriptionTier} Plan
                      </span>
                      {biz.isSponsored && (
                        <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
                          ★ Sponsored Search Ad
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="p-2.5 bg-gray-50 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                    <VerificationBadge verification={biz.verification} lang={lang} size="sm" showDetails />

                    <div className="flex items-center gap-1.5">
                      {biz.verification.level < 3 && (
                        <button
                          onClick={() => onApproveVerification(biz.id, (biz.verification.level + 1) as any)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium text-[11px] transition-colors"
                        >
                          Upgrade to L{biz.verification.level + 1}
                        </button>
                      )}

                      <button
                        onClick={() => onToggleSponsored(biz.id)}
                        className={`px-2 py-1 rounded font-medium text-[11px] border transition-colors ${
                          biz.isSponsored
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        {biz.isSponsored ? 'Disable Sponsored Ad' : 'Enable Sponsored Ad'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: REPORTS & COMPLAINTS */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl text-gray-400 text-xs">
                No open moderation complaints or safety reports.
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-600" />
                        <span className="font-bold text-xs text-gray-900 capitalize">
                          Report Reason: {rep.reason.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded capitalize">
                        {rep.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600">
                      Target: <strong>{rep.targetName}</strong> ({rep.targetType})
                    </p>
                    {rep.notes && (
                      <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded italic">
                        "{rep.notes}"
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => onResolveReport(rep.id, 'dismiss')}
                        className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => onResolveReport(rep.id, 'action_taken')}
                        className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors"
                      >
                        Take Moderation Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SEARCH INTELLIGENCE */}
        {activeTab === 'search_analytics' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                Top Universal Search Queries
              </h3>
              <div className="space-y-2 text-xs">
                {popularSearches.map((ps, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50">
                    <div>
                      <span className="font-bold text-gray-900">"{ps.term}"</span>
                      <span className="text-[11px] text-gray-400 block">Top match: {ps.topResult}</span>
                    </div>
                    <span className="font-semibold text-emerald-800">{ps.count.toLocaleString()} searches</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800">
                Zero-Result Searches (Demand Gaps in Rajkot)
              </h3>
              <p className="text-[11px] text-gray-500">
                Users searched for these terms but no verified businesses or products match. Good for merchant onboarding.
              </p>
              <div className="space-y-2 text-xs">
                {zeroResultSearches.map((zr, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="font-medium text-gray-800">"{zr.term}"</span>
                    <span className="text-gray-500">{zr.count} failed searches</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
