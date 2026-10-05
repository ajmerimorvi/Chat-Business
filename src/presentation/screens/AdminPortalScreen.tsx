import React, { useState, useMemo, useEffect } from 'react';
import { Business, ReportItem, Language, BusinessImportRecord } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import { AddBusinessModal } from '../components/AddBusinessModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { BusinessDetailModal } from '../components/BusinessDetailModal';
import { ImportHistoryModal } from '../components/ImportHistoryModal';
import { firestoreChatService } from '../../services/firestoreChatService';
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
  Plus,
  Upload,
  History,
  Phone,
  MapPin,
  Tag,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AdminPortalScreenProps {
  businesses: Business[];
  reports: ReportItem[];
  onBack: () => void;
  onApproveVerification: (businessId: string, level: 1 | 2 | 3) => void;
  onToggleSponsored: (businessId: string) => void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'action_taken') => void;
  onAddBusiness?: (business: Business) => Promise<void>;
  onBulkImportBusinesses?: (businesses: Business[], importRecord: BusinessImportRecord) => Promise<void>;
  currentUserId?: string;
  currentUserName?: string;
  lang?: Language;
}

export type BusinessFilterType = 'all' | 'unverified' | 'pending' | 'verified' | 'rejected' | 'inactive';

export const AdminPortalScreen: React.FC<AdminPortalScreenProps> = ({
  businesses,
  reports,
  onBack,
  onApproveVerification,
  onToggleSponsored,
  onResolveReport,
  onAddBusiness,
  onBulkImportBusinesses,
  currentUserId,
  currentUserName,
  lang = 'en',
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'businesses' | 'reports' | 'search_analytics'>('businesses');

  // Business Database filter and search state
  const [filterType, setFilterType] = useState<BusinessFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBusinessForDetail, setSelectedBusinessForDetail] = useState<Business | null>(null);

  // Import history records
  const [importHistory, setImportHistory] = useState<BusinessImportRecord[]>([]);

  useEffect(() => {
    const unsub = firestoreChatService.subscribeImportHistory((records) => {
      setImportHistory(records);
    });
    return () => unsub();
  }, []);

  // Summary statistics
  const metrics = useMemo(() => {
    let verified = 0;
    let unverified = 0;
    let pending = 0;
    let rejected = 0;
    let inactive = 0;

    for (const b of businesses) {
      if (b.status === 'INACTIVE') {
        inactive++;
      }

      const vStatus = b.verificationStatus || (b.verification?.level > 0 ? 'VERIFIED' : 'UNVERIFIED');
      if (vStatus === 'VERIFIED') {
        verified++;
      } else if (vStatus === 'VERIFICATION_PENDING' || b.verification?.status === 'pending_verification') {
        pending++;
      } else if (vStatus === 'REJECTED') {
        rejected++;
      } else {
        unverified++;
      }
    }

    return {
      total: businesses.length,
      verified,
      unverified,
      pending,
      rejected,
      inactive,
    };
  }, [businesses]);

  // Filtered & Searched businesses
  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return businesses.filter((b) => {
      // 1. Status Filter
      const vStatus = b.verificationStatus || (b.verification?.level > 0 ? 'VERIFIED' : 'UNVERIFIED');
      const isInactive = b.status === 'INACTIVE';

      if (filterType === 'unverified' && (vStatus !== 'UNVERIFIED' || isInactive)) return false;
      if (filterType === 'pending' && (vStatus !== 'VERIFICATION_PENDING' && b.verification?.status !== 'pending_verification')) return false;
      if (filterType === 'verified' && (vStatus !== 'VERIFIED' || isInactive)) return false;
      if (filterType === 'rejected' && vStatus !== 'REJECTED') return false;
      if (filterType === 'inactive' && !isInactive) return false;

      // 2. Search Query (business name, mobile, contact person, city)
      if (query) {
        const nameMatch = (b.name || b.businessName || '').toLowerCase().includes(query);
        const mobileMatch = (b.phone || b.mobile || '').replace(/[^\d]/g, '').includes(query.replace(/[^\d]/g, ''));
        const contactMatch = (b.contactPerson || '').toLowerCase().includes(query);
        const cityMatch = (b.city || '').toLowerCase().includes(query);
        const categoryMatch = (b.category || '').toLowerCase().includes(query);

        if (!nameMatch && !mobileMatch && !contactMatch && !cityMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [businesses, filterType, searchQuery]);

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

  const getSourceDisplay = (src?: string) => {
    switch (src) {
      case 'CSV_IMPORT':
        return 'CSV Import';
      case 'EXCEL_IMPORT':
        return 'Excel Import';
      case 'SALES_TEAM':
        return 'Sales Team';
      case 'MANUAL':
      default:
        return 'Manual Entry';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-y-auto">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-base leading-tight">Sampark Admin &amp; Moderation Console</h1>
            <p className="text-[11px] text-slate-400">Enterprise Database, Batch Ingestion &amp; Verification Governance</p>
          </div>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex border-b border-gray-200 bg-white text-xs font-semibold px-2 sticky top-[68px] z-10 shadow-2xs">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'businesses'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 size={15} />
          <span>Businesses Database ({businesses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
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
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
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
        {/* TAB 1: BUSINESS DATABASE & VERIFICATION MANAGEMENT */}
        {activeTab === 'businesses' && (
          <div className="space-y-4">
            {/* Top Summary Metrics Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div
                onClick={() => setFilterType('all')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`text-[11px] block font-semibold ${filterType === 'all' ? 'text-slate-300' : 'text-gray-500'}`}>
                  Total Businesses
                </span>
                <span className="text-xl font-bold leading-tight">{metrics.total.toLocaleString()}</span>
              </div>

              <div
                onClick={() => setFilterType('unverified')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  filterType === 'unverified'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-amber-300'
                }`}
              >
                <span className={`text-[11px] block font-semibold ${filterType === 'unverified' ? 'text-amber-100' : 'text-amber-700'}`}>
                  Unverified
                </span>
                <span className="text-xl font-bold leading-tight">{metrics.unverified.toLocaleString()}</span>
              </div>

              <div
                onClick={() => setFilterType('pending')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  filterType === 'pending'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className={`text-[11px] block font-semibold ${filterType === 'pending' ? 'text-blue-100' : 'text-blue-700'}`}>
                  Pending Verif.
                </span>
                <span className="text-xl font-bold leading-tight">{metrics.pending.toLocaleString()}</span>
              </div>

              <div
                onClick={() => setFilterType('verified')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  filterType === 'verified'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-300'
                }`}
              >
                <span className={`text-[11px] block font-semibold ${filterType === 'verified' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  Verified
                </span>
                <span className="text-xl font-bold leading-tight">{metrics.verified.toLocaleString()}</span>
              </div>

              <div
                onClick={() => setFilterType('rejected')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  filterType === 'rejected'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-red-300'
                }`}
              >
                <span className={`text-[11px] block font-semibold ${filterType === 'rejected' ? 'text-red-100' : 'text-red-700'}`}>
                  Rejected
                </span>
                <span className="text-xl font-bold leading-tight">{metrics.rejected.toLocaleString()}</span>
              </div>

              <div
                onClick={() => setFilterType('inactive')}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  filterType === 'inactive'
                    ? 'bg-gray-700 text-white border-gray-700 shadow-sm'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`text-[11px] block font-semibold ${filterType === 'inactive' ? 'text-gray-300' : 'text-gray-500'}`}>
                  Inactive
                </span>
                <span className="text-xl font-bold leading-tight">{metrics.inactive.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Bar & Controls */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, mobile, contact person, city..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Add Business</span>
                  </button>

                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Upload size={15} />
                    <span>Import Businesses</span>
                  </button>

                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="p-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Import Audit History"
                  >
                    <History size={16} />
                  </button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                <span className="text-gray-400 text-[11px] font-normal mr-1">Filter:</span>
                {(
                  [
                    { id: 'all', label: 'All', count: metrics.total },
                    { id: 'unverified', label: 'Unverified', count: metrics.unverified },
                    { id: 'pending', label: 'Verification Pending', count: metrics.pending },
                    { id: 'verified', label: 'Verified', count: metrics.verified },
                    { id: 'rejected', label: 'Rejected', count: metrics.rejected },
                    { id: 'inactive', label: 'Inactive', count: metrics.inactive },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                      filterType === f.id
                        ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Business List: Responsive Data Display */}
            {filteredBusinesses.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-xs text-gray-400 space-y-2">
                <Building2 size={36} className="mx-auto text-gray-300" />
                <p className="font-semibold text-gray-700">No businesses match the active criteria.</p>
                <p className="text-[11px] text-gray-500">
                  Try adjusting the filter pills or clear the search query.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table View (Hidden on mobile) */}
                <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-3 px-3.5">Business Name</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Contact Person</th>
                        <th className="py-3 px-3">Mobile</th>
                        <th className="py-3 px-3">City</th>
                        <th className="py-3 px-3">Source</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBusinesses.map((biz) => {
                        const vStatus = biz.verificationStatus || (biz.verification?.level > 0 ? 'VERIFIED' : 'UNVERIFIED');
                        return (
                          <tr key={biz.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-3.5 font-medium text-gray-900">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={biz.logoUrl || biz.coverImageUrl}
                                  alt={biz.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-gray-900 block leading-tight">{biz.name}</span>
                                  <span className="text-[10px] text-gray-400 font-mono">ID: {biz.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-gray-600">
                              <span>{biz.category}</span>
                              {biz.subcategory && (
                                <span className="block text-[10px] text-gray-400">{biz.subcategory}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-gray-700 font-medium">
                              {biz.contactPerson || <span className="text-gray-400 italic">Not set</span>}
                            </td>
                            <td className="py-3 px-3 text-gray-800 font-mono text-[11px]">
                              {biz.phone || biz.mobile}
                            </td>
                            <td className="py-3 px-3 text-gray-600">{biz.city}</td>
                            <td className="py-3 px-3 text-gray-600 text-[11px]">
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                {getSourceDisplay(biz.source)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {vStatus === 'VERIFIED' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle size={11} /> L{biz.verification.level} Verified
                                </span>
                              ) : vStatus === 'VERIFICATION_PENDING' ? (
                                <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                  Pending
                                </span>
                              ) : vStatus === 'REJECTED' ? (
                                <span className="inline-flex items-center gap-1 text-red-700 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                  Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-800 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Unverified
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedBusinessForDetail(biz)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={15} />
                                </button>

                                {biz.verification.level < 3 && (
                                  <button
                                    onClick={() => onApproveVerification(biz.id, (biz.verification.level + 1) as any)}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium text-[10px] transition-colors"
                                  >
                                    Verify L{biz.verification.level + 1}
                                  </button>
                                )}

                                <button
                                  onClick={() => onToggleSponsored(biz.id)}
                                  className={`px-2 py-1 rounded font-medium text-[10px] border transition-colors ${
                                    biz.isSponsored
                                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                                      : 'bg-white border-gray-300 text-gray-600'
                                  }`}
                                  title="Toggle Sponsored Ad"
                                >
                                  {biz.isSponsored ? 'Ad ★' : 'Ad'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet Cards View */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
                  {filteredBusinesses.map((biz) => {
                    const vStatus = biz.verificationStatus || (biz.verification?.level > 0 ? 'VERIFIED' : 'UNVERIFIED');
                    return (
                      <div
                        key={biz.id}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={biz.logoUrl || biz.coverImageUrl}
                              alt={biz.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div>
                              <h3 className="font-bold text-sm text-gray-900 leading-tight">{biz.name}</h3>
                              <p className="text-[11px] text-gray-500">
                                {biz.category} · {biz.city}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {getSourceDisplay(biz.source)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-gray-50 p-2 rounded-lg">
                          <div>
                            <span className="text-gray-400 block text-[10px]">Contact Person:</span>
                            <strong className="text-gray-800">{biz.contactPerson || 'Not Set'}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px]">Mobile:</span>
                            <span className="font-mono text-gray-800">{biz.phone || biz.mobile}</span>
                          </div>
                        </div>

                        {/* Status and Action Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          {vStatus === 'VERIFIED' ? (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle size={13} /> L{biz.verification.level} Verified
                            </span>
                          ) : (
                            <span className="text-amber-800 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded">
                              Unverified
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedBusinessForDetail(biz)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium text-[11px]"
                            >
                              Details
                            </button>

                            {biz.verification.level < 3 && (
                              <button
                                onClick={() => onApproveVerification(biz.id, (biz.verification.level + 1) as any)}
                                className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium text-[11px]"
                              >
                                Upgrade L{biz.verification.level + 1}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

      {/* Modals */}
      <AddBusinessModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={async (newBiz) => {
          if (onAddBusiness) {
            await onAddBusiness(newBiz);
          } else {
            await firestoreChatService.saveBusiness(newBiz);
          }
        }}
        currentUserId={currentUserId || 'admin_user'}
      />

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingBusinesses={businesses}
        onImportConfirm={async (entities, record) => {
          if (onBulkImportBusinesses) {
            await onBulkImportBusinesses(entities, record);
          } else {
            await firestoreChatService.bulkSaveBusinesses(entities, record);
          }
        }}
        currentUserId={currentUserId || 'admin_user'}
        currentUserName={currentUserName || 'Platform Administrator'}
      />

      <ImportHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        importHistory={importHistory}
      />

      <BusinessDetailModal
        business={selectedBusinessForDetail}
        onClose={() => setSelectedBusinessForDetail(null)}
        onUpgradeVerification={onApproveVerification}
      />
    </div>
  );
};
