import React from 'react';
import { User, Business, Language } from '../../domain/types';
import {
  UserCheck,
  Store,
  ShieldCheck,
  Settings,
  Globe,
  Download,
  Mail,
  LogOut,
  X,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';

interface AppMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentBusiness?: Business;
  lang: Language;
  onOpenBusinessDashboard: () => void;
  onOpenVerificationWizard: () => void;
  onOpenAdminPortal: () => void;
  onOpenLanguageModal: () => void;
  onOpenApkModal: () => void;
  onOpenAuthModal: () => void;
  onSignOut?: () => void;
}

export const AppMenuModal: React.FC<AppMenuModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentBusiness,
  lang,
  onOpenBusinessDashboard,
  onOpenVerificationWizard,
  onOpenAdminPortal,
  onOpenLanguageModal,
  onOpenApkModal,
  onOpenAuthModal,
  onSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* User Card Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 bg-white"
            />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{currentUser.name}</h3>
              <p className="text-xs text-emerald-200 truncate">
                {currentUser.email || currentUser.phoneNumber || 'Active Account'}
              </p>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-300">
                <CheckCircle size={10} className="text-emerald-300" />
                <span>Google Verified</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-emerald-700/60 rounded-full text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-3 divide-y divide-gray-100 text-xs text-gray-700">
          <div className="py-1.5 space-y-1">
            <button
              onClick={() => {
                onClose();
                onOpenBusinessDashboard();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Store size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">My Store &amp; Catalog</p>
                <p className="text-[11px] text-gray-500">Manage products, services &amp; orders</p>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenVerificationWizard();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Get Verified Green Badge</p>
                <p className="text-[11px] text-gray-500">GST, Physical GPS &amp; Trade License</p>
              </div>
            </button>
          </div>

          <div className="py-1.5 space-y-1">
            <button
              onClick={() => {
                onClose();
                onOpenLanguageModal();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                <Globe size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Language / ભાષા / भाषा</p>
                <p className="text-[11px] text-gray-500 uppercase">{lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'ગુજરાતી'}</p>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenApkModal();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Download size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Install Mobile App / APK</p>
                <p className="text-[11px] text-gray-500">Save to Android home screen</p>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenAdminPortal();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Settings size={16} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Admin &amp; Moderation</p>
                <p className="text-[11px] text-gray-500">Business approval desk</p>
              </div>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-emerald-50 border border-gray-300 hover:border-emerald-500 text-gray-900 font-bold rounded-xl transition-all shadow-xs cursor-pointer text-xs"
            >
              <GoogleIcon size={16} />
              <span>{currentUser.email ? `Google: ${currentUser.email}` : 'Sign in with Google (Primary)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
