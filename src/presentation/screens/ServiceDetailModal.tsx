import React from 'react';
import { Service, Business, Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import { ArrowLeft, MessageSquare, Store, Check, MapPin, Wrench } from 'lucide-react';

interface ServiceDetailModalProps {
  service: Service;
  business?: Business;
  onBack: () => void;
  onChatAboutService: (service: Service) => void;
  onViewBusiness: (businessId: string) => void;
  lang?: Language;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  business,
  onBack,
  onChatAboutService,
  onViewBusiness,
  lang = 'en',
}) => {
  const t = getTranslation(lang);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-emerald-800 text-white flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-emerald-700/60 rounded-full transition-colors"
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-base leading-tight truncate">Service Details</h1>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                {service.category}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{service.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 uppercase block">{t.startingFrom}</span>
              <span className="text-lg font-bold text-emerald-800">
                ₹{service.startingPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Provider Card */}
          <div
            onClick={() => onViewBusiness(service.businessId)}
            className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Store size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 leading-tight">
                  {service.businessName}
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

          {/* Service Specs */}
          <div className="mt-4 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={15} className="text-emerald-700" />
              <span>Service Area: <strong>{service.serviceArea}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <Check size={15} />
              <span>{service.available ? 'Doorstep technicians available today' : 'Available on appointment'}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-1">
              Scope of Service
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">{service.description}</p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-8 pt-3 border-t border-gray-100">
          <button
            onClick={() => onChatAboutService(service)}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare size={18} />
            <span>{t.askAboutService}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
