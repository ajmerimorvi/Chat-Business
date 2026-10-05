import React from 'react';
import { Conversation, Language, User } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { UniversalSearchBar } from '../components/UniversalSearchBar';
import { VerificationBadge } from '../components/VerificationBadge';
import { Check, CheckCheck, MessageSquarePlus, Store, MoreVertical, Globe, ShieldCheck, Download, Mail, Sparkles } from 'lucide-react';

interface HomeScreenProps {
  conversations: Conversation[];
  currentUser: User;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchFilter: 'all' | 'people' | 'businesses' | 'products' | 'services';
  onFilterChange: (f: 'all' | 'people' | 'businesses' | 'products' | 'services') => void;
  onSelectConversation: (conv: Conversation) => void;
  onOpenNewChat: () => void;
  onOpenLanguageModal: () => void;
  onOpenMenuModal: () => void;
  onOpenApkModal?: () => void;
  onOpenAuthModal?: () => void;
  lang?: Language;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  conversations,
  currentUser,
  searchQuery,
  onSearchChange,
  searchFilter,
  onFilterChange,
  onSelectConversation,
  onOpenNewChat,
  onOpenLanguageModal,
  onOpenMenuModal,
  onOpenApkModal,
  onOpenAuthModal,
  lang = 'en',
}) => {
  const t = getTranslation(lang);

  const categories: Array<{
    label: string;
    query?: string;
    filter?: 'all' | 'people' | 'businesses' | 'products' | 'services';
  }> = [
    { label: 'All Verified', filter: 'businesses' },
    { label: 'Furniture & Decor', query: 'furniture' },
    { label: 'Hardware & Tools', query: 'hardware' },
    { label: 'Electronics', query: 'electronics' },
    { label: 'Home Services', query: 'repair' },
    { label: 'Groceries & Foods', query: 'grocery' },
  ];

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* WhatsApp-style Clean Top Bar */}
      <header className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center font-bold text-white text-base shadow-xs">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-semibold text-lg leading-tight tracking-tight">{t.appName}</h1>
              <span className="bg-emerald-700/80 text-emerald-200 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-emerald-200">
              {currentUser.email ? currentUser.email : 'Universal Search & Chat'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-100">
          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/80 rounded-lg transition-all flex items-center gap-1.5 text-xs px-2.5 font-bold text-white shadow-2xs cursor-pointer"
              title="Download APK / Install App"
            >
              <Download size={13} className="stroke-[2.5]" />
              <span className="text-[11px] font-semibold">APK</span>
            </button>
          )}

          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs px-2.5 font-medium border shadow-2xs ${
                currentUser.email
                  ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white font-bold'
              }`}
              title={currentUser.email ? `Account: ${currentUser.email}` : 'Sign In'}
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <Mail size={13} />
              )}
              <span className="text-[11px]">
                {currentUser.email ? 'Account' : 'Login'}
              </span>
            </button>
          )}

          <button
            onClick={onOpenLanguageModal}
            className="p-1.5 hover:bg-emerald-700/60 rounded-lg transition-colors flex items-center gap-1 text-xs text-white"
            title="Language / ભાષા / भाषा"
          >
            <Globe size={16} />
            <span className="uppercase font-bold text-[11px]">{lang}</span>
          </button>

          <button
            onClick={onOpenMenuModal}
            className="p-1.5 hover:bg-emerald-700/60 rounded-lg transition-colors text-white"
            title="App Menu & Settings"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Direct APK Download / Install Strip */}
      {onOpenApkModal && (
        <div className="bg-emerald-950 text-white px-3 py-1.5 flex items-center justify-between text-[11px] border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="bg-emerald-500 text-emerald-950 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">
              APK v1.0
            </span>
            <span className="text-emerald-200 truncate">
              Install Sampark on Android
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/Sampark.apk"
              download="Sampark.apk"
              className="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-0.5 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Download Sampark.apk directly"
            >
              <Download size={11} />
              <span>Download .apk</span>
            </a>
            <button
              onClick={onOpenApkModal}
              className="text-emerald-300 hover:text-white text-[11px] underline cursor-pointer"
            >
              Options
            </button>
          </div>
        </div>
      )}

      {/* Universal Search Bar */}
      <UniversalSearchBar
        query={searchQuery}
        onQueryChange={onSearchChange}
        activeFilter={searchFilter}
        onFilterChange={onFilterChange}
        lang={lang}
      />

      {/* Verified Category Quick Filter Bar */}
      {!searchQuery && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto text-xs text-gray-600 no-scrollbar shrink-0">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (cat.query) {
                  onSearchChange(cat.query);
                } else if (cat.filter) {
                  onFilterChange(cat.filter);
                }
              }}
              className="px-2.5 py-1 bg-white border border-gray-200 hover:border-emerald-600 hover:text-emerald-700 rounded-full transition-colors whitespace-nowrap text-[11px] font-medium shadow-2xs cursor-pointer"
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        <div className="px-4 py-2 bg-gray-50/60 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>{t.recentChats}</span>
          <span className="text-gray-400 font-normal">{conversations.length} active</span>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="text-xs text-gray-400">Tap the button below to start a chat with any contact or verified business.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isBusiness = conv.otherParticipant.isBusiness;
            const verification = conv.otherParticipant.verification;
            const isSentByMe = conv.lastMessage.senderId === currentUser.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      conv.otherParticipant.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conv.otherParticipant.name)}`
                    }
                    alt={conv.otherParticipant.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-2xs"
                  />
                  {isBusiness ? (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-700 text-white p-0.5 rounded-full border-2 border-white shadow-2xs" title="Verified Business">
                      <Store size={10} />
                    </span>
                  ) : (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>

                {/* Chat Meta & Snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {conv.otherParticipant.name}
                      </span>
                      {isBusiness && verification && (
                        <VerificationBadge verification={verification} lang={lang} size="sm" />
                      )}
                    </div>
                    <span className={`text-[11px] shrink-0 ${conv.unreadCount > 0 ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>
                      {conv.lastMessage.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                      {isSentByMe && (
                        conv.lastMessage.status === 'read' ? (
                          <span title="Read" className="text-[#53bdeb] shrink-0">
                            <CheckCheck size={14} strokeWidth={2.5} />
                          </span>
                        ) : conv.lastMessage.status === 'delivered' ? (
                          <span title="Delivered" className="text-gray-400 shrink-0">
                            <CheckCheck size={14} strokeWidth={1.8} />
                          </span>
                        ) : (
                          <span title="Sent" className="text-gray-400 shrink-0">
                            <Check size={13} strokeWidth={1.8} />
                          </span>
                        )
                      )}
                      <span className="truncate">{conv.lastMessage.text}</span>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (New Chat / Compose) */}
      <button
        onClick={onOpenNewChat}
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 z-20 cursor-pointer"
        title="Start new conversation"
      >
        <MessageSquarePlus size={24} />
      </button>
    </div>
  );
};
