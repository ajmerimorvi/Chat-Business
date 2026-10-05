import React, { useState } from 'react';
import { Business } from '../../domain/types';
import { MASTER_CATEGORIES, getSubcategoriesForCategory } from '../../domain/categories';
import { normalizeIndianMobile, isValidPincode } from '../../domain/businessImportService';
import { X, Building2, User, Phone, MapPin, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (business: Business) => Promise<void>;
  currentUserId: string;
}

export const AddBusinessModal: React.FC<AddBusinessModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUserId,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(MASTER_CATEGORIES[0].name);
  const [subCategory, setSubCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Rajkot');
  const [state, setState] = useState('Gujarat');
  const [pincode, setPincode] = useState('');
  const [remarks, setRemarks] = useState('');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableSubcategories = getSubcategoriesForCategory(category);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const subcats = getSubcategoriesForCategory(newCat);
    setSubCategory(subcats[0] || '');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business Name is required';
    }
    if (!category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!contactPerson.trim()) {
      newErrors.contactPerson = 'Contact Person is required';
    }
    if (!address.trim()) {
      newErrors.address = 'Physical Address is required';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required';
    }

    const mobileNorm = normalizeIndianMobile(mobile);
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!mobileNorm.valid) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number';
    }

    if (whatsapp.trim() && !sameAsMobile) {
      const waNorm = normalizeIndianMobile(whatsapp);
      if (!waNorm.valid) {
        newErrors.whatsapp = 'Enter a valid 10-digit WhatsApp number';
      }
    }

    if (pincode.trim() && !isValidPincode(pincode)) {
      newErrors.pincode = 'Enter a valid 6-digit PIN code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const mobileNorm = normalizeIndianMobile(mobile);
      const waNorm = sameAsMobile
        ? mobileNorm
        : whatsapp.trim()
        ? normalizeIndianMobile(whatsapp)
        : mobileNorm;

      const businessId = `biz_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();

      const newBusiness: Business = {
        id: businessId,
        businessId,
        ownerId: currentUserId || 'admin_user',
        name: businessName.trim(),
        businessName: businessName.trim(),
        category: category.trim(),
        subcategory: subCategory.trim() || 'General',
        businessType: 'physical_store',
        description: remarks.trim() || `${category} enterprise located in ${city.trim()}`,
        phone: mobileNorm.formatted,
        mobile: mobileNorm.formatted,
        whatsapp: waNorm.formatted,
        contactPerson: contactPerson.trim(),
        address: address.trim(),
        area: area.trim(),
        city: city.trim(),
        state: state.trim() || 'Gujarat',
        pincode: pincode.trim(),
        remarks: remarks.trim(),
        lat: 22.3039,
        lng: 70.8022,
        coverImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
        logoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(businessName.trim())}`,
        rating: 5.0,
        reviewCount: 0,
        openForChat: true,
        businessHours: {
          days: 'Mon - Sat',
          openTime: '09:00',
          closeTime: '20:00',
          isOpenToday: true,
        },
        responseMetrics: {
          avgResponseMinutes: 15,
          responseRatePct: 95,
          text: 'Usually replies within 15 min',
        },
        // MANDATORY SECURITY RULE: Always set to UNVERIFIED!
        verificationStatus: 'UNVERIFIED',
        status: 'ACTIVE',
        source: 'MANUAL',
        createdBy: currentUserId || 'admin_user',
        createdAt: nowIso,
        updatedAt: nowIso,
        verification: {
          level: 0,
          status: 'UNVERIFIED',
          mobileVerified: false,
          locationVerified: false,
          businessDocVerified: false,
          reverificationRequired: false,
          lastVerifiedDate: nowIso.split('T')[0],
        },
        subscriptionTier: 'free',
        activeConversationsCount: 0,
        maxActiveConversations: 10,
        searchKeywords: [
          businessName.trim().toLowerCase(),
          category.trim().toLowerCase(),
          city.trim().toLowerCase(),
          contactPerson.trim().toLowerCase(),
        ],
      };

      await onSave(newBusiness);
      setSuccessMessage('Business added successfully. Verification is pending.');

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to add business. Please retry.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 size={20} className="text-emerald-300" />
            <div>
              <h2 className="font-bold text-base leading-tight">+ Add New Business</h2>
              <p className="text-[11px] text-emerald-200">
                Database Entry · Status: <span className="font-semibold text-amber-200">UNVERIFIED</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-emerald-700/60 rounded-full text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle size={15} className="text-amber-700 shrink-0" />
          <span>
            <strong>Note:</strong> Adding a business registers it as <strong>UNVERIFIED</strong>. Verification trust badges are earned strictly through physical/field and OTP validation workflows.
          </span>
        </div>

        {/* Form Body */}
        {successMessage ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-bold text-base text-gray-900">{successMessage}</h3>
            <p className="text-xs text-gray-500">Record saved to canonical database.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {errors.form && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                {errors.form}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1">
                Enterprise Details
              </h3>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Patel Handcrafted Furniture"
                  className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                    errors.businessName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                  }`}
                />
                {errors.businessName && <p className="text-[11px] text-red-600 mt-0.5">{errors.businessName}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    {MASTER_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Sub Category (Optional)</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="">General / None</option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Person & Numbers */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1">
                Contact &amp; Mobile
              </h3>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-2.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rajesh Patel (Owner / Manager)"
                    className={`w-full pl-8 p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      errors.contactPerson ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.contactPerson && <p className="text-[11px] text-red-600 mt-0.5">{errors.contactPerson}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-2.5 top-3 text-gray-400" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 98251 23456"
                      className={`w-full pl-8 p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                        errors.mobile ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.mobile && <p className="text-[11px] text-red-600 mt-0.5">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    disabled={sameAsMobile}
                    value={sameAsMobile ? mobile : whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as mobile"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="sameAsMobile"
                      checked={sameAsMobile}
                      onChange={(e) => setSameAsMobile(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="sameAsMobile" className="text-[11px] text-gray-600 cursor-pointer">
                      Same as mobile number
                    </label>
                  </div>
                  {errors.whatsapp && <p className="text-[11px] text-red-600 mt-0.5">{errors.whatsapp}</p>}
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1">
                Physical Location
              </h3>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Street Address / Plot / Shop <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-2.5 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop 12, Samrat Industrial Area, Gondal Road"
                    className={`w-full pl-8 p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      errors.address ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.address && <p className="text-[11px] text-red-600 mt-0.5">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Gondal Road"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Rajkot"
                    className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      errors.city ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Gujarat"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="360004"
                    className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                      errors.pincode ? 'border-red-500 bg-red-50/30' : 'border-gray-300'
                    }`}
                  />
                  {errors.pincode && <p className="text-[11px] text-red-600 mt-0.5">{errors.pincode}</p>}
                </div>
              </div>
            </div>

            {/* Remarks / Admin Notes */}
            <div className="pt-2">
              <label className="block font-semibold text-gray-700 mb-1">Remarks / Internal Notes (Optional)</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Lead source: Merchant walk-in. Potential catalog sponsor."
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save as Unverified Business'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
