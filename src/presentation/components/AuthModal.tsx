import React, { useState } from 'react';
import { User } from '../../domain/types';
import { loginWithGoogle, logoutUser } from '../../services/authService';
import {
  X,
  Mail,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Sparkles,
  Smartphone,
  Globe,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChange: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle();
      if (res.success && res.user) {
        onUserChange(res.user);
        onClose();
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onUserChange({
        id: 'usr_guest',
        name: 'Guest User',
        phoneNumber: '+91 98250 88990',
        bio: 'Browsing Sampark Web',
        language: currentUser.language || 'en',
        role: 'customer',
        ownedBusinessIds: [],
        staffAtBusinessIds: [],
        blockedUserIds: [],
        blockedBusinessIds: [],
        authProvider: 'guest',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  };

  const isGoogleAuth = currentUser.authProvider === 'google' || !!currentUser.email;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gmail / Google Authentication</h2>
              <p className="text-xs text-emerald-100">WhatsApp Web style sync &amp; multi-device login</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {isGoogleAuth ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3.5">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-700 text-white font-bold text-xl flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-gray-900 truncate">{currentUser.name}</span>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                      Gmail Verified
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium truncate">{currentUser.email}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">UID: {currentUser.id.slice(0, 14)}...</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
                  <Globe size={16} className="text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-semibold block text-gray-800">Browser Sync</span>
                    <span className="text-[10px] text-gray-500">Active (Live Firestore)</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
                  <Smartphone size={16} className="text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-semibold block text-gray-800">Mobile Link</span>
                    <span className="text-[10px] text-gray-500">{currentUser.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Mail size={14} />
                  <span>Switch Account</span>
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated state */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-gray-900 text-sm">Sign in with your Google / Gmail account</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Log in across any browser, access your verified chats, and sync business inquiries just like WhatsApp Web.
                </p>
              </div>

              {/* Official Google Login Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 border border-gray-300 bg-white hover:bg-gray-50 active:scale-98 text-gray-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-sm"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin text-emerald-700" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{loading ? 'Connecting to Google...' : 'Continue with Google / Gmail'}</span>
              </button>

              {/* Benefits */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Real-time cloud sync across phone &amp; laptop</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Instant quotation generation &amp; CRM lead saving</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Secured by Google OAuth &amp; Firebase Firestore</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>Official Google OAuth 2.0 Identity Provider</span>
          </div>
        </div>
      </div>
    </div>
  );
};
