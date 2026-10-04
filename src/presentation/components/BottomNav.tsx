import React from 'react';
import { MessageSquare, Phone, Store, UserCircle, RefreshCw } from 'lucide-react';
import { Language } from '../../domain/types';
import { getTranslation } from '../i18n/translations';

export type NavTab = 'chats' | 'calls' | 'business' | 'updates' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadChatsCount?: number;
  openInquiriesCount?: number;
  lang?: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  unreadChatsCount = 0,
  openInquiriesCount = 0,
  lang = 'en',
}) => {
  const t = getTranslation(lang);

  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number }> = [
    {
      id: 'chats',
      label: t.chats,
      icon: <MessageSquare size={20} />,
      badge: unreadChatsCount,
    },
    {
      id: 'calls',
      label: t.calls,
      icon: <Phone size={20} />,
    },
    {
      id: 'business',
      label: t.businessTools,
      icon: <Store size={20} />,
      badge: openInquiriesCount,
    },
    {
      id: 'updates',
      label: t.updates,
      icon: <RefreshCw size={20} />,
    },
    {
      id: 'profile',
      label: t.profile,
      icon: <UserCircle size={20} />,
    },
  ];

  return (
    <nav className="w-full bg-white border-t border-gray-200 py-1.5 px-2 flex justify-around items-center select-none shrink-0 z-30">
      {tabs.map((tab) => {
        const active = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
              active ? 'text-emerald-700 font-semibold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
