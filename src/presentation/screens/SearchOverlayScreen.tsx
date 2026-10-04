import React from 'react';
import { UniversalSearchResults } from '../../domain/searchService';
import { Business, Product, Service, Language, Contact, Conversation } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import { User, Store, Package, Wrench, MessageSquare, ChevronRight, Phone, MapPin, Sparkles } from 'lucide-react';

interface SearchOverlayScreenProps {
  results: UniversalSearchResults;
  filter: 'all' | 'people' | 'businesses' | 'products' | 'services';
  onSelectPerson: (person: UniversalSearchResults['contactsAndChats'][0]) => void;
  onSelectBusiness: (business: Business) => void;
  onSelectProduct: (product: Product) => void;
  onSelectService: (service: Service) => void;
  lang?: Language;
}

export const SearchOverlayScreen: React.FC<SearchOverlayScreenProps> = ({
  results,
  filter,
  onSelectPerson,
  onSelectBusiness,
  onSelectProduct,
  onSelectService,
  lang = 'en',
}) => {
  const t = getTranslation(lang);
  const { contactsAndChats, businesses, products, services, totalCount } = results;

  const showPeople = (filter === 'all' || filter === 'people') && contactsAndChats.length > 0;
  const showBusinesses = (filter === 'all' || filter === 'businesses') && businesses.length > 0;
  const showProducts = (filter === 'all' || filter === 'products') && products.length > 0;
  const showServices = (filter === 'all' || filter === 'services') && services.length > 0;

  if (totalCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
          <Store size={28} />
        </div>
        <h3 className="font-semibold text-gray-700 text-sm mb-1">{t.noResults}</h3>
        <p className="text-xs text-gray-400 max-w-xs">
          Universal Search checks contacts, chats, verified shops, catalog products, and local services simultaneously.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/60 pb-16">
      {/* 1. CHATS & CONTACTS SECTION */}
      {showPeople && (
        <section className="mb-2 bg-white border-y border-gray-100 shadow-2xs">
          <div className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 bg-gray-50/70 border-b border-gray-100">
            <User size={12} className="text-emerald-700" />
            <span>{t.peopleAndChats}</span>
            <span className="ml-auto text-[10px] text-gray-400 font-normal">
              {contactsAndChats.length} found
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {contactsAndChats.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectPerson(item)}
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      item.avatarUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  {item.type === 'recent_chat' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm truncate">{item.name}</span>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {item.type === 'recent_chat'
                        ? t.recentChatTag
                        : item.type === 'contact'
                        ? t.contactTag
                        : t.previousChatTag}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                </div>

                <button
                  type="button"
                  className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-full"
                  title="Start Chat"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. BUSINESSES SECTION */}
      {showBusinesses && (
        <section className="mb-2 bg-white border-y border-gray-100 shadow-2xs">
          <div className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 bg-gray-50/70 border-b border-gray-100">
            <Store size={12} className="text-emerald-700" />
            <span>{t.businesses}</span>
            <span className="ml-auto text-[10px] text-gray-400 font-normal">
              {businesses.length} verified listings
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {businesses.map(({ business }) => (
              <div
                key={business.id}
                onClick={() => onSelectBusiness(business)}
                className="px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={business.logoUrl || business.coverImageUrl}
                    alt={business.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-gray-900 text-sm truncate">
                          {business.name}
                        </span>
                        {business.isSponsored && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-semibold px-1 rounded">
                            Sponsored
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-amber-500 font-semibold flex items-center shrink-0">
                        ★ {business.rating}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {business.category} · {business.city}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <VerificationBadge verification={business.verification} lang={lang} size="sm" />

                      {business.openForChat ? (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t.openForChat}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">{t.closedForChat}</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-gray-300 self-center shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. PRODUCTS SECTION */}
      {showProducts && (
        <section className="mb-2 bg-white border-y border-gray-100 shadow-2xs">
          <div className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 bg-gray-50/70 border-b border-gray-100">
            <Package size={12} className="text-emerald-700" />
            <span>{t.products}</span>
            <span className="ml-auto text-[10px] text-gray-400 font-normal">
              {products.length} catalog items
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {products.map(({ product, parentBusinessName }) => (
              <div
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 rounded-md object-cover border border-gray-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {product.name}
                    </span>
                    <span className="font-semibold text-emerald-800 text-xs shrink-0 ml-1">
                      {product.priceOnRequest ? t.priceOnRequest : `₹${product.price.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {parentBusinessName} · {product.location}
                  </p>
                </div>

                <button
                  type="button"
                  className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors shrink-0"
                >
                  {t.chatWithBusiness}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SERVICES SECTION */}
      {showServices && (
        <section className="mb-2 bg-white border-y border-gray-100 shadow-2xs">
          <div className="px-4 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 bg-gray-50/70 border-b border-gray-100">
            <Wrench size={12} className="text-emerald-700" />
            <span>{t.services}</span>
            <span className="ml-auto text-[10px] text-gray-400 font-normal">
              {services.length} services
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {services.map(({ service, parentBusinessName }) => (
              <div
                key={service.id}
                onClick={() => onSelectService(service)}
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Wrench size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {service.name}
                    </span>
                    <span className="font-semibold text-emerald-800 text-xs shrink-0 ml-1">
                      {t.startingFrom} ₹{service.startingPrice}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {parentBusinessName} · {service.serviceArea}
                  </p>
                </div>

                <button
                  type="button"
                  className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors shrink-0"
                >
                  {t.chatWithBusiness}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
