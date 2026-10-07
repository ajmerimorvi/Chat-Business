import React, { useState } from 'react';
import { User } from '../../domain/types';
import { loginWithGoogle, logoutUser } from '../../services/authService';
import { GoogleIcon } from './GoogleIcon';
import {
  X,
  Mail,
  CheckCircle2,
  ShieldCheck,
  LogOut,
  Smartphone,
  Globe,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Crown,
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
      setError(err?.message || 'Google sign-in failed. Please try again.');
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
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white p-2 shadow-md flex items-center justify-center shrink-0">
              <GoogleIcon size={24} />
            </div>
            <div className="min-w-0 pr-8">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate">Google Authentication</h2>
                <span className="text-[10px] bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 font-bold px-1.5 py-0.5 rounded">
                  Primary
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 truncate">
                Mobile &amp; desktop synchronized access
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication issue:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {isGoogleAuth ? (
            /* Logged In with Google */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3.5">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-700 text-white font-bold text-xl flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-gray-900 truncate">
                      {currentUser.name}
                    </span>
                    {currentUser.role === 'admin' ? (
                      <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <Crown size={10} />
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                        Google Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium truncate mt-0.5">
                    {currentUser.email}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    ID: {currentUser.id.slice(0, 16)}...
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
                  <Globe size={16} className="text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold block text-gray-800 truncate">Cloud Sync</span>
                    <span className="text-[10px] text-emerald-700 font-medium truncate">
                      Active (Firestore)
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
                  <Smartphone size={16} className="text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold block text-gray-800 truncate">Linked Device</span>
                    <span className="text-[10px] text-gray-500 truncate">
                      {currentUser.phoneNumber || 'Web Session'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onClose}
                  className="w-full sm:flex-1 min-h-[44px] py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <CheckCircle2 size={15} />
                  <span>Continue Browsing</span>
                </button>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full sm:w-auto min-h-[44px] py-2.5 px-3 bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Switch to another Google account"
                >
                  <GoogleIcon size={14} />
                  <span>Switch</span>
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full sm:w-auto min-h-[44px] py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Sign out of current account"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated State - Primary Google Sign-In */
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <h3 className="font-bold text-gray-900 text-sm">
                  Sign in with your Google / Gmail account
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Fast, password-free login. Seamlessly sync your chats, verified business inquiries, and merchant tools across all your devices.
                </p>
              </div>

              {/* Primary Google Login Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full min-h-[48px] py-3 px-4 border border-gray-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/40 active:scale-98 text-gray-900 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin text-emerald-700" />
                ) : (
                  <GoogleIcon size={20} />
                )}
                <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Benefits overview */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Automatic live cloud sync between phone &amp; laptop</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Instant access to verified Rajkot merchants &amp; quotations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                  <span>Zero passwords to remember — secured by Google OAuth</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-gray-500">
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
                >
                  Explore as guest first
                </button>
                <span className="text-[11px] text-gray-400">Firebase Auth · Firestore</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>Official Google OAuth 2.0 &amp; Firebase Hosting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

