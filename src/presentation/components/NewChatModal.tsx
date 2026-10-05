import React, { useState, useRef } from 'react';
import { Business, Contact } from '../../domain/types';
import {
  Store,
  User as UserIcon,
  Phone,
  MessageSquarePlus,
  X,
  Search,
  ShieldCheck,
  Smartphone,
  Upload,
  UserPlus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  businesses: Business[];
  onAddContacts?: (newContacts: Contact[]) => void;
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
  onAddContacts,
  onStartChatWithContact,
}) => {
  const [tab, setTab] = useState<'contacts' | 'direct' | 'businesses'>('contacts');
  const [search, setSearch] = useState('');
  const [directName, setDirectName] = useState('');
  const [directPhone, setDirectPhone] = useState('');
  const [directMessage, setDirectMessage] = useState('Hello!');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Check if browser supports the native Contact Picker API (Chrome on Android)
  const isContactPickerSupported = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

  const handleDeviceContactSync = async () => {
    try {
      if (!isContactPickerSupported) {
        setSyncStatus('Direct device API not supported by this browser. Use "Import .VCF File" below to import from phone.');
        return;
      }

      setSyncStatus('Opening phone contact book...');
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const rawContacts = await (navigator as any).contacts.select(props, opts);

      if (rawContacts && rawContacts.length > 0) {
        const formatted: Contact[] = rawContacts
          .filter((c: any) => (c.name?.[0] || c.tel?.[0]))
          .map((c: any) => {
            const rawName = c.name?.[0] || 'Unknown';
            const rawTel = (c.tel?.[0] || '').replace(/[^\d+]/g, '').trim();
            return {
              id: `cnt_device_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: rawName,
              phoneNumber: rawTel.startsWith('+') ? rawTel : `+91 ${rawTel}`,
              avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rawName)}`,
              hasApp: true,
            };
          });

        if (formatted.length > 0) {
          onAddContacts?.(formatted);
          setSyncStatus(`Successfully imported ${formatted.length} contact(s) from phone!`);
        }
      } else {
        setSyncStatus(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSyncStatus('Contact access cancelled or denied.');
      } else {
        setSyncStatus(null);
      }
    }
  };

  const handleVcfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsedContacts: Contact[] = [];
      const cards = text.split(/BEGIN:VCARD/i);

      for (const card of cards) {
        if (!card.trim()) continue;
        let name = '';
        let phone = '';
        const lines = card.split(/\r\n|\r|\n/);

        for (const line of lines) {
          const upper = line.toUpperCase();
          if (upper.startsWith('FN:') || upper.startsWith('FN;')) {
            name = line.substring(line.indexOf(':') + 1).trim();
          } else if (!name && (upper.startsWith('N:') || upper.startsWith('N;'))) {
            const parts = line.substring(line.indexOf(':') + 1).split(';');
            name = parts.filter(Boolean).reverse().join(' ').trim();
          }
          if (upper.startsWith('TEL:') || upper.startsWith('TEL;')) {
            phone = line.substring(line.indexOf(':') + 1).replace(/[^\d+]/g, '').trim();
          }
        }

        if (name && phone) {
          parsedContacts.push({
            id: `cnt_vcf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name,
            phoneNumber: phone.startsWith('+') ? phone : `+91 ${phone}`,
            avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            hasApp: true,
          });
        }
      }

      if (parsedContacts.length > 0) {
        onAddContacts?.(parsedContacts);
        setSyncStatus(`Successfully imported ${parsedContacts.length} contact(s) from .vcf!`);
      } else {
        setSyncStatus('No valid contacts found in the file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: Contact = {
      id: `cnt_custom_${Date.now()}`,
      name: newContactName.trim(),
      phoneNumber: newContactPhone.trim().startsWith('+') ? newContactPhone.trim() : `+91 ${newContactPhone.trim()}`,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newContactName.trim())}`,
      hasApp: true,
    };

    onAddContacts?.([newContact]);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContactForm(false);
    setSyncStatus(`Added "${newContact.name}" to contacts!`);
  };

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
            Contacts ({contacts.length})
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
            Stores ({businesses.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'contacts' && (
            <div className="space-y-3">
              {/* Actual Sync Actions Bar */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-emerald-700" />
                    Actual Contact Sync
                  </span>
                  <button
                    onClick={() => setShowAddContactForm(!showAddContactForm)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={12} />
                    {showAddContactForm ? 'Close' : 'Add One'}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleDeviceContactSync}
                    className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Select contacts directly from your phone address book (Android Chrome)"
                  >
                    <Smartphone size={13} />
                    <span>Sync Phone Contacts</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.vcard"
                    onChange={handleVcfFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-1.5 px-2.5 bg-white hover:bg-gray-50 border border-emerald-300 text-emerald-800 font-semibold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                    title="Export contacts as .vcf from Contacts app and import here"
                  >
                    <Upload size={13} />
                    <span>Import .VCF</span>
                  </button>
                </div>

                {syncStatus && (
                  <div className="text-[11px] font-medium text-emerald-800 flex items-center gap-1.5 bg-white/80 p-1.5 rounded border border-emerald-200">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>{syncStatus}</span>
                  </div>
                )}
              </div>

              {/* Add Single Contact Form */}
              {showAddContactForm && (
                <form onSubmit={handleCreateContact} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                  <h4 className="font-semibold text-gray-800 text-xs">Add New Contact</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Phone (+91 9825...)"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    Save to Contacts
                  </button>
                </form>
              )}

              {/* Search Bar */}
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

              {/* Contact List */}
              <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No contacts found matching &ldquo;{search}&rdquo;</p>
                ) : (
                  filteredContacts.map((c) => (
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
                        <p className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                          <Phone size={11} /> {c.phoneNumber}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'direct' && (
            <form onSubmit={handleStartDirect} className="space-y-3 text-xs">
              <p className="text-gray-600 text-xs leading-relaxed">
                Chat directly with any mobile number in India or internationally without saving to contacts first:
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
                className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
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

              <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
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
