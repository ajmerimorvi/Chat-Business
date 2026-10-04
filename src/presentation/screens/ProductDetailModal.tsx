import React from 'react';
import { Product, Business, Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import { ArrowLeft, MessageSquare, Store, Check, MapPin, Tag } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  business?: Business;
  onBack: () => void;
  onChatAboutProduct: (product: Product) => void;
  onViewBusiness: (businessId: string) => void;
  lang?: Language;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  business,
  onBack,
  onChatAboutProduct,
  onViewBusiness,
  lang = 'en',
}) => {
  const t = getTranslation(lang);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Top Header */}
      <div className="relative h-64 bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onBack}
          className="absolute top-3 left-3 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-xs"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h1>
            <span className="text-base font-bold text-emerald-800 shrink-0">
              {product.priceOnRequest ? t.priceOnRequest : `₹${product.price.toLocaleString('en-IN')}`}
            </span>
          </div>

          {/* Business association banner */}
          <div
            onClick={() => onViewBusiness(product.businessId)}
            className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                <Store size={18} />
              </div>
              <div>
                <p className="font-semibold text-xs text-gray-900 leading-tight">
                  {product.businessName}
                </p>
                {business && (
                  <div className="mt-0.5">
                    <VerificationBadge verification={business.verification} lang={lang} size="sm" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-emerald-700 font-medium">View Shop</span>
          </div>

          {/* Product Specs */}
          <div className="mt-4 space-y-2 text-xs text-gray-600">
            {product.sku && (
              <div className="flex items-center gap-2 text-gray-500">
                <Tag size={14} />
                <span>SKU: {product.sku}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin size={14} />
              <span>Location: {product.location}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <Check size={14} />
              <span>{product.available ? 'In Stock & Ready for Delivery' : 'Available on backorder'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-1">
              Description
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-8 pt-3 border-t border-gray-100">
          <button
            onClick={() => onChatAboutProduct(product)}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} />
            <span>{t.chatAboutProduct}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
