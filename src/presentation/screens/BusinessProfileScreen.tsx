import React from 'react';
import { Business, Product, Service, Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  Star,
  Share2,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Package,
  Wrench,
  Navigation,
} from 'lucide-react';

interface BusinessProfileScreenProps {
  business: Business;
  products: Product[];
  services: Service[];
  onBack: () => void;
  onStartChat: (initialText?: string, product?: Product, service?: Service) => void;
  onSelectProduct: (product: Product) => void;
  onSelectService: (service: Service) => void;
  lang?: Language;
}

export const BusinessProfileScreen: React.FC<BusinessProfileScreenProps> = ({
  business,
  products,
  services,
  onBack,
  onStartChat,
  onSelectProduct,
  onSelectService,
  lang = 'en',
}) => {
  const t = getTranslation(lang);

  const businessProducts = products.filter((p) => p.businessId === business.id);
  const businessServices = services.filter((s) => s.businessId === business.id);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Top App Bar & Cover */}
      <div className="relative h-48 bg-gray-200 shrink-0">
        <img
          src={business.coverImageUrl}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        <button
          onClick={onBack}
          className="absolute top-3 left-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-xs"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: business.name,
                text: `${business.name} on Sampark`,
                url: window.location.href,
              });
            }
          }}
          className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-xs"
          title="Share Business"
        >
          <Share2 size={18} />
        </button>

        {/* Business Logo Overlap */}
        <div className="absolute -bottom-6 left-4">
          <img
            src={business.logoUrl || business.coverImageUrl}
            alt={business.name}
            className="w-16 h-16 rounded-xl object-cover border-3 border-white shadow-md bg-white"
          />
        </div>
      </div>

      {/* Profile Header Details */}
      <div className="px-4 pt-8 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{business.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {business.category} · {business.subcategory}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md text-amber-800 text-xs font-bold shrink-0">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            <span>{business.rating}</span>
            <span className="text-[10px] text-amber-600 font-normal">({business.reviewCount})</span>
          </div>
        </div>

        {/* Verification Badges (Core differentiator) */}
        <div className="mt-2.5">
          <VerificationBadge verification={business.verification} lang={lang} size="md" showDetails />
        </div>

        {/* Status, Location & Timings */}
        <div className="mt-3 flex flex-col gap-1.5 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <span className="truncate">{business.address}, {business.city}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <span>
                {business.businessHours.days} · {business.businessHours.openTime} - {business.businessHours.closeTime}
              </span>
            </div>

            {business.openForChat ? (
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t.openForChat}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">{t.closedForChat}</span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onStartChat()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
          >
            <MessageSquare size={18} />
            <span>{t.chatWithBusiness}</span>
          </button>

          <a
            href={`tel:${business.phone}`}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold text-sm rounded-xl transition-colors"
          >
            <Phone size={18} />
            <span>{t.callBusiness}</span>
          </a>
        </div>
      </div>

      {/* Products Section */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Package size={16} className="text-emerald-700" />
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{t.products}</h2>
          </div>
          <span className="text-xs text-gray-400">{businessProducts.length} items</span>
        </div>

        {businessProducts.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No products listed currently.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {businessProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group border border-gray-200 rounded-xl overflow-hidden hover:border-emerald-600 transition-all cursor-pointer flex flex-col bg-white shadow-2xs"
              >
                <div className="h-28 bg-gray-100 relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {product.available ? (
                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium shadow-2xs">
                      Available
                    </span>
                  ) : (
                    <span className="absolute top-1.5 right-1.5 text-[9px] bg-gray-600 text-white px-1.5 py-0.5 rounded font-medium">
                      Sold out
                    </span>
                  )}
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="font-bold text-sm text-emerald-800 mt-0.5">
                      {product.priceOnRequest ? t.priceOnRequest : `₹${product.price.toLocaleString('en-IN')}`}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartChat(`I am interested in ${product.name}.`, product);
                    }}
                    className="mt-2 w-full py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageSquare size={12} />
                    <span>Inquire</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services Section */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Wrench size={16} className="text-emerald-700" />
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{t.services}</h2>
          </div>
          <span className="text-xs text-gray-400">{businessServices.length} services</span>
        </div>

        {businessServices.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No services listed currently.</p>
        ) : (
          <div className="space-y-2">
            {businessServices.map((service) => (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className="p-3 border border-gray-200 rounded-xl hover:border-emerald-600 transition-all cursor-pointer bg-white shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs text-gray-900 truncate">{service.name}</h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{service.description}</p>
                  <p className="text-xs font-bold text-emerald-800 mt-1">
                    {t.startingFrom} ₹{service.startingPrice}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartChat(`I would like to inquire about ${service.name}.`, undefined, service);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg shrink-0 flex items-center gap-1"
                >
                  <MessageSquare size={13} />
                  <span>Ask</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="px-4 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-2">About</h2>
        <p className="text-xs text-gray-600 leading-relaxed">{business.description}</p>
      </div>

      {/* Business Hours Details */}
      <div className="px-4 py-4 mb-8">
        <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-2">Business Hours</h2>
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 space-y-1">
          <div className="flex justify-between font-medium">
            <span>{business.businessHours.days}</span>
            <span>{business.businessHours.openTime} - {business.businessHours.closeTime}</span>
          </div>
          <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-200">
            {business.responseMetrics.text} · {business.responseMetrics.responseRatePct}% response rate
          </div>
        </div>
      </div>
    </div>
  );
};
