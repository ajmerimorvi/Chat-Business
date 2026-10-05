import React from 'react';
import { Conversation, Language, User } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { UniversalSearchBar } from '../components/UniversalSearchBar';
import { VerificationBadge } from '../components/VerificationBadge';
import { Check, CheckCheck, MessageSquarePlus, Store, MoreVertical, Globe, ShieldCheck, Download, Mail } from 'lucide-react';

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
  onOpenPersonaModal: () => void;
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
  onOpenPersonaModal,
  onOpenApkModal,
  onOpenAuthModal,
  lang = 'en',
}) => {
  const t = getTranslation(lang);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* WhatsApp-style Clean Top Bar */}
      <header className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center font-bold text-white text-base">
            S
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight tracking-tight">{t.appName}</h1>
            <p className="text-[11px] text-emerald-200">Universal Search &amp; Verified Chat</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-100">
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs px-2 font-medium border shadow-2xs ${
                currentUser.email
                  ? 'bg-emerald-700/90 hover:bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white'
              }`}
              title={currentUser.email ? `Gmail: ${currentUser.email}` : 'Sign In with Gmail'}
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
              ) : (
                <Mail size={13} />
              )}
              <span className="text-[11px] font-bold">
                {currentUser.email ? 'Gmail' : 'Login'}
              </span>
            </button>
          )}

          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="p-1.5 bg-emerald-700/80 hover:bg-emerald-600 rounded-lg transition-colors flex items-center gap-1 text-xs px-2 font-medium border border-emerald-500 shadow-2xs"
              title="Download Android APK"
            >
              <Download size={14} />
              <span className="text-[11px] font-bold">APK</span>
            </button>
          )}

          <button
            onClick={onOpenLanguageModal}
            className="p-2 hover:bg-emerald-700/60 rounded-full transition-colors flex items-center gap-1 text-xs"
            title="Change Language"
          >
            <Globe size={18} />
            <span className="uppercase font-semibold text-[11px]">{lang}</span>
          </button>

          <button
            onClick={onOpenPersonaModal}
            className="p-2 hover:bg-emerald-700/60 rounded-full transition-colors"
            title="Switch User / Business Persona"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Universal Search Bar (The Core Feature) */}
      <UniversalSearchBar
        query={searchQuery}
        onQueryChange={onSearchChange}
        activeFilter={searchFilter}
        onFilterChange={onFilterChange}
        lang={lang}
      />

      {/* Quick Search Shortcut Prompts (Subtle helper chips for testing) */}
      {!searchQuery && (
        <div className="px-3 py-1.5 bg-gray-50/80 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] text-gray-500 no-scrollbar">
          <span className="text-gray-400 font-medium shrink-0">Try search:</span>
          {['Raj', 'Raj Hardware', 'furniture', 'mattress', 'AC repair'].map((term) => (
            <button
              key={term}
              onClick={() => onSearchChange(term)}
              className="px-2 py-0.5 bg-white border border-gray-200 rounded-md hover:border-emerald-500 hover:text-emerald-700 transition-colors whitespace-nowrap"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        <div className="px-4 py-2 bg-gray-50/50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>{t.recentChats}</span>
          <span className="text-gray-400 font-normal">{conversations.length} conversations</span>
        </div>

        {conversations.map((conv) => {
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
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
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
                      <CheckCheck size={14} className="text-emerald-600 shrink-0" />
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
        })}
      </div>

      {/* Floating Action Button (New Chat / Compose) */}
      <button
        onClick={onOpenNewChat}
        className="absolute bottom-4 right-4 w-13 h-13 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95 z-10"
        title="Start new conversation"
      >
        <MessageSquarePlus size={22} />
      </button>
    </div>
  );
};
