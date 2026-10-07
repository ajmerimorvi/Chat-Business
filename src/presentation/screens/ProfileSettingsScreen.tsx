import React from 'react';
import { User, Language, Business } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import {
  UserCircle,
  Globe,
  Shield,
  Store,
  Sliders,
  ChevronRight,
  Phone,
  Bell,
  Lock,
  HelpCircle,
  Check,
  Smartphone,
  Download,
  Mail,
  LogIn,
} from 'lucide-react';
import { GoogleIcon } from '../components/GoogleIcon';

interface ProfileSettingsScreenProps {
  currentUser: User;
  currentBusiness?: Business;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAdminPortal: () => void;
  onOpenBusinessDashboard: () => void;
  onOpenApkModal?: () => void;
  onOpenAuthModal?: () => void;
  langStrings?: any;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  currentUser,
  currentBusiness,
  lang,
  onLanguageChange,
  onOpenAdminPortal,
  onOpenBusinessDashboard,
  onOpenApkModal,
  onOpenAuthModal,
}) => {
  const t = getTranslation(lang);

  const languages: Array<{ code: Language; name: string; nativeName: string }> = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-16">
      {/* Top Banner */}
      <div className="bg-emerald-800 text-white p-4 shadow-xs">
        <h1 className="font-bold text-lg">{t.profile}</h1>
      </div>

      {/* User Card */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4">
        <img
          src={
            currentUser.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          }
          alt={currentUser.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 leading-tight">{currentUser.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{currentUser.phoneNumber}</p>
          {currentUser.email ? (
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
              <Mail size={12} />
              <span className="truncate">{currentUser.email}</span>
            </p>
          ) : (
            <p className="text-xs text-emerald-800 italic mt-1 line-clamp-1">{currentUser.bio}</p>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Google / Gmail Authentication Card */}
        {onOpenAuthModal && (
          <div
            onClick={onOpenAuthModal}
            className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-teal-50/80 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-xs">
                <GoogleIcon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs text-gray-900">
                    {currentUser.email ? 'Connected Google Account' : 'Sign In with Google (Primary)'}
                  </h3>
                  {currentUser.email ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Linked
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                      1-Click
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {currentUser.email
                    ? currentUser.email
                    : 'Sync chats, contacts, & quotations across devices like WhatsApp Web'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        )}
        {/* Language Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
            <Globe size={16} className="text-emerald-700" />
            <span>{t.language}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => onLanguageChange(l.code)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors flex flex-col items-center justify-center ${
                  lang === l.code
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{l.nativeName}</span>
                <span className="text-[10px] text-gray-400 font-normal">{l.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Android App & APK Download Card */}
        {onOpenApkModal && (
          <div
            onClick={onOpenApkModal}
            className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-xl p-4 shadow-sm cursor-pointer hover:opacity-95 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Android App &amp; APK</h3>
                  <span className="text-[10px] bg-emerald-400 text-emerald-950 font-bold px-1.5 py-0.5 rounded">Download</span>
                </div>
                <p className="text-xs text-emerald-100">
                  Direct phone install, 1-click cloud APK builder, or project ZIP
                </p>
              </div>
            </div>
            <Download size={18} className="text-emerald-200" />
          </div>
        )}

        {/* Business Tools CTA */}
        {currentBusiness && (
          <div
            onClick={onOpenBusinessDashboard}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-2xs cursor-pointer hover:bg-emerald-100/70 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                <Store size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-950">{currentBusiness.name} Dashboard</h3>
                <p className="text-xs text-emerald-800">
                  Manage inquiries, catalog, business hours &amp; staff
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-emerald-700" />
          </div>
        )}

        {/* Admin Portal Gateway */}
        <div
          onClick={onOpenAdminPortal}
          className="bg-slate-900 text-white rounded-xl p-4 shadow-2xs cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t.adminPortal}</h3>
              <p className="text-xs text-slate-300">
                Verification requests, moderation, safety &amp; search stats
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>

        {/* Privacy & Account Settings */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-2xs text-xs text-gray-700">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock size={16} className="text-gray-400" />
              <span>Privacy &amp; Phone Number Visibility</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">Hidden from Public</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-gray-400" />
              <span>Notifications &amp; Sounds</span>
            </div>
            <span className="text-[11px] text-gray-500">Enabled</span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield size={16} className="text-gray-400" />
              <span>Security &amp; Encryption</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">E2E Protected</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center pt-2">
          Sampark v1.0.0 (Rajkot Release) · Search → Discover → Chat
        </p>
      </div>
    </div>
  );
};
