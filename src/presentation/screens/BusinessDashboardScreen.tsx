import React, { useState } from 'react';
import { Business, Inquiry, Product, Service, StaffMember, Language, InquiryStatus } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  Store,
  ShieldCheck,
  Package,
  Wrench,
  Users,
  CheckCircle,
  Clock,
  Plus,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Layers,
} from 'lucide-react';

interface BusinessDashboardScreenProps {
  business: Business;
  inquiries: Inquiry[];
  products: Product[];
  services: Service[];
  staff: StaffMember[];
  onOpenVerificationWizard: () => void;
  onToggleOpenForChat: (open: boolean) => void;
  onSelectInquiry: (inquiry: Inquiry) => void;
  onAssignStaff: (inquiryId: string, staffId: string) => void;
  onAddProduct: (prod: Partial<Product>) => void;
  onAddService: (srv: Partial<Service>) => void;
  lang?: Language;
}

export const BusinessDashboardScreen: React.FC<BusinessDashboardScreenProps> = ({
  business,
  inquiries,
  products,
  services,
  staff,
  onOpenVerificationWizard,
  onToggleOpenForChat,
  onSelectInquiry,
  onAssignStaff,
  onAddProduct,
  onAddService,
  lang = 'en',
}) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'catalog' | 'staff' | 'settings'>('inquiries');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | InquiryStatus>('all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(business.category);
  const [newProdDesc, setNewProdDesc] = useState('');

  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryFilter === 'all') return true;
    return inq.status === inquiryFilter;
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    onAddProduct({
      name: newProdName.trim(),
      price: parseFloat(newProdPrice) || 0,
      category: newProdCategory,
      description: newProdDesc,
      available: true,
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
      location: business.city,
    });
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setShowAddProductModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-16">
      {/* Top Banner */}
      <div className="bg-emerald-900 text-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={business.logoUrl || business.coverImageUrl}
              alt={business.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-700 bg-white shrink-0"
            />
            <div className="truncate">
              <h1 className="text-base font-bold leading-tight truncate">{business.name}</h1>
              <p className="text-xs text-emerald-200 truncate">
                {business.category} · {business.city}
              </p>
            </div>
          </div>

          {/* Open For Chat Toggle */}
          <button
            onClick={() => onToggleOpenForChat(!business.openForChat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
              business.openForChat
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400'
                : 'bg-red-500/20 text-red-200 border border-red-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                business.openForChat ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{business.openForChat ? t.openForChat : t.closedForChat}</span>
          </button>
        </div>

        {/* Verification Status Card */}
        <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-300" />
              <span className="text-xs font-semibold text-white">Trust &amp; Verification</span>
            </div>
            <div className="mt-1">
              <VerificationBadge verification={business.verification} lang={lang} size="sm" />
            </div>
          </div>

          <button
            onClick={onOpenVerificationWizard}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-2xs"
          >
            Manage Verification
          </button>
        </div>

        {/* Free Plan Conversation Limit Indicator (Per Prompt Section 15 & 17) */}
        <div className="mt-3 p-2.5 bg-black/20 rounded-lg text-xs">
          <div className="flex justify-between text-emerald-100 font-medium mb-1">
            <span>{t.conversationsLimitUsed}:</span>
            <span>
              {business.activeConversationsCount} / {business.maxActiveConversations}{' '}
              ({business.subscriptionTier.toUpperCase()})
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                business.activeConversationsCount >= business.maxActiveConversations
                  ? 'bg-red-400'
                  : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (business.activeConversationsCount / business.maxActiveConversations) * 100
                )}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-emerald-300 mt-1">{t.freePlanLimitNote}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white text-xs font-semibold">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            activeTab === 'inquiries'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Inquiries ({inquiries.length})
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Catalog ({products.length + services.length})
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Team &amp; Staff ({staff.length})
        </button>
      </div>

      {/* TAB 1: INQUIRIES PIPELINE */}
      {activeTab === 'inquiries' && (
        <div className="p-3 space-y-3">
          {/* Inquiry Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {(['all', 'new', 'contacted', 'quotation_sent', 'converted', 'closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setInquiryFilter(st)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap capitalize font-medium transition-colors ${
                  inquiryFilter === st
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filteredInquiries.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-gray-400 text-xs">
              No inquiries found in this stage.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInquiries.map((inq) => (
                <div
                  key={inq.id}
                  onClick={() => onSelectInquiry(inq)}
                  className="bg-white border border-gray-200 hover:border-emerald-600 rounded-xl p-3.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-1 mb-1">
                    <span className="font-bold text-gray-900 text-sm truncate">
                      {inq.customerName}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                      {inq.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-emerald-700 truncate">
                    {inq.entityTitle}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    "{inq.requirementNote}"
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-gray-400" />
                      <span>Assigned: <strong>{inq.assignedStaffName || 'Unassigned'}</strong></span>
                    </div>

                    {/* Quick Staff Assign Selector */}
                    <select
                      value={inq.assignedStaffId || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onAssignStaff(inq.id, e.target.value)}
                      className="text-[11px] bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-gray-700"
                    >
                      <option value="">Assign staff...</option>
                      {staff.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATALOG MANAGER */}
      {activeTab === 'catalog' && (
        <div className="p-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Products &amp; Services
            </h2>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>Add Item</span>
            </button>
          </div>

          {/* Products List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Package size={14} className="text-emerald-700" />
              <span>Products ({products.length})</span>
            </h3>

            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-3"
              >
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-gray-900 truncate">{prod.name}</h4>
                  <p className="text-xs font-bold text-emerald-800">
                    {prod.priceOnRequest ? 'Price on request' : `₹${prod.price.toLocaleString('en-IN')}`}
                  </p>
                  <span className="text-[10px] text-gray-400">{prod.category}</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ))}
          </div>

          {/* Services List */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
              <Wrench size={14} className="text-emerald-700" />
              <span>Services ({services.length})</span>
            </h3>

            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Wrench size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-gray-900 truncate">{srv.name}</h4>
                  <p className="text-xs font-bold text-emerald-800">
                    From ₹{srv.startingPrice.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] text-gray-400">{srv.serviceArea}</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEAM & STAFF */}
      {activeTab === 'staff' && (
        <div className="p-3 space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            <p className="font-semibold">Shared Business Inbox &amp; Staff Assignment</p>
            <p className="text-[11px] mt-0.5 text-blue-800">
              When a customer inquires, the business owner can route conversations to dedicated sales or support staff.
            </p>
          </div>

          <div className="space-y-2">
            {staff.map((st) => (
              <div
                key={st.id}
                className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-gray-900">{st.name}</h4>
                    <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-medium capitalize">
                      {st.role}
                    </span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">{st.phoneNumber}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 block">
                    {st.assignedCount} Inquiries
                  </span>
                  <span className="text-[10px] text-gray-400">Assigned</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Add New Product to Catalog</h3>

            <form onSubmit={handleSaveProduct} className="space-y-2.5 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-0.5">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Office Desk"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-0.5">Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 14500"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-0.5">Category</label>
                <input
                  type="text"
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-medium text-gray-700 block mb-0.5">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Specs, warranty, materials..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
