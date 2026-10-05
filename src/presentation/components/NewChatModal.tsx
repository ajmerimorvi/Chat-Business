import React, { useState } from 'react';
import { Business, Contact } from '../../domain/types';
import { Store, User as UserIcon, Phone, MessageSquarePlus, X, Search, ShieldCheck } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  businesses: Business[];
  onStartChatWithContact: (contact: {
    id: string;
    name: string;
    avatarUrl?: string;
    phoneNumber: string;
    isBusiness?: boolean;
    businessId?: string;
  }, initialMessage?: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  contacts,
  businesses,
  onStartChatWithContact,
}) => {
  const [tab, setTab] = useState<'contacts' | 'direct' | 'businesses'>('contacts');
  const [search, setSearch] = useState('');
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directMessage, setDirectMessage] = useState('Hello!');

  if (!isOpen) return null;

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phoneNumber.includes(search)
  );

  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartDirect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone.trim() || !directName.trim()) return;

    onStartChatWithContact(
      {
        id: `user_${Date.now()}`,
        name: directName.trim(),
        phoneNumber: directPhone.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(directName)}`,
      },
      directMessage
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={20} />
            <h2 className="font-semibold text-base">New Conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-emerald-700/60 rounded-full transition-colors text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold">
          <button
            onClick={() => setTab('contacts')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              tab === 'contacts'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Saved Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setTab('direct')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              tab === 'direct'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Type Number
          </button>
          <button
            onClick={() => setTab('businesses')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              tab === 'businesses'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Verified Stores ({businesses.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'contacts' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="divide-y divide-gray-100">
                {filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onStartChatWithContact({
                        id: c.id,
                        name: c.name,
                        phoneNumber: c.phoneNumber,
                        avatarUrl: c.avatarUrl,
                      });
                      onClose();
                    }}
                    className="flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <img
                      src={c.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.name)}`}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone size={11} /> {c.phoneNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'direct' && (
            <form onSubmit={handleStartDirect} className="space-y-3 text-xs">
              <p className="text-gray-600 text-xs leading-relaxed">
                Chat directly with any mobile number in India or internationally:
              </p>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Mobile Number (with country code)</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98250 12345"
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">First Message</label>
                <input
                  type="text"
                  placeholder="Hello!"
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                Start Direct Conversation
              </button>
            </form>
          )}

          {tab === 'businesses' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stores, goods, or services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="divide-y divide-gray-100">
                {filteredBusinesses.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => {
                      onStartChatWithContact(
                        {
                          id: b.id,
                          name: b.name,
                          phoneNumber: b.phone,
                          avatarUrl: b.logoUrl,
                          isBusiness: true,
                          businessId: b.id,
                        },
                        `Hello ${b.name}, I am connecting with your store via Sampark.`
                      );
                      onClose();
                    }}
                    className="flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <img
                      src={b.logoUrl}
                      alt={b.name}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-gray-900 truncate">{b.name}</p>
                        <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {b.category} · {b.city}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
