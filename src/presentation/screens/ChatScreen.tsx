import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message, Business, Product, Service, User, Language, Inquiry, InquiryStatus } from '../../domain/types';
import { getTranslation } from '../i18n/translations';
import { VerificationBadge } from '../components/VerificationBadge';
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  FileText,
  MapPin,
  Check,
  CheckCheck,
  Info,
  Package,
  Wrench,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  Store,
  Clock,
  ExternalLink,
  Square,
  X,
  Volume2,
} from 'lucide-react';

interface ChatScreenProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  currentBusiness?: Business;
  inquiry?: Inquiry;
  onSendMessage: (msg: Partial<Message>) => void;
  onUpdateInquiryStatus?: (inquiryId: string, newStatus: InquiryStatus) => void;
  onBack: () => void;
  onOpenBusinessProfile?: (businessId: string) => void;
  onOpenProductDetail?: (product: Product) => void;
  onBlockUser?: (targetId: string) => void;
  onReport?: (targetType: 'user' | 'business' | 'message', targetId: string) => void;
  lang?: Language;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversation,
  messages,
  currentUser,
  currentBusiness,
  inquiry,
  onSendMessage,
  onUpdateInquiryStatus,
  onBack,
  onOpenBusinessProfile,
  onOpenProductDetail,
  onBlockUser,
  onReport,
  lang = 'en',
}) => {
  const t = getTranslation(lang);
  const [inputText, setInputText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  
  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quotation form state
  const [quoteItem, setQuoteItem] = useState(inquiry?.entityTitle || 'Custom Order');
  const [quoteQty, setQuoteQty] = useState(1);
  const [quotePrice, setQuotePrice] = useState(12500);
  const [quoteGst, setQuoteGst] = useState(18);

  const isBusinessChat = conversation.type === 'business' || conversation.otherParticipant.isBusiness;
  const isMeBusinessOwner = currentBusiness && currentBusiness.id === conversation.businessId;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      type: 'text',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });
    setInputText('');
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onSendMessage({
        conversationId: conversation.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        type: 'image',
        mediaUrl: dataUrl,
        text: file.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      });
      setShowAttachments(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartVoiceRecord = () => {
    setIsRecordingVoice(true);
  };

  const handleCancelVoiceRecord = () => {
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const handleFinishVoiceRecord = () => {
    const duration = Math.max(recordingSeconds, 2);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);

    const minutes = Math.floor(duration / 60);
    const secs = duration % 60;
    const timeFormatted = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;

    onSendMessage({
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      type: 'audio',
      durationSeconds: duration,
      text: `Voice message (${timeFormatted})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });
  };

  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onSendMessage({
            conversationId: conversation.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            type: 'location',
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              label: 'Current Shared Location (GPS)',
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
          });
          setShowAttachments(false);
        },
        () => {
          // Fallback location if permission denied
          onSendMessage({
            conversationId: conversation.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            type: 'location',
            location: {
              lat: 22.3039,
              lng: 70.8022,
              label: 'Gondal Road, Near Samrat Chowk, Rajkot',
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
          });
          setShowAttachments(false);
        }
      );
    } else {
      setShowAttachments(false);
    }
  };

  const handleSendQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = quoteQty * quotePrice;
    const gstAmt = (subtotal * quoteGst) / 100;
    const grandTotal = subtotal + gstAmt;

    const quotationData = {
      quotationNumber: `QT-${Date.now().toString().slice(-4)}`,
      itemName: quoteItem,
      quantity: quoteQty,
      unitPrice: quotePrice,
      gstRatePct: quoteGst,
      totalAmount: grandTotal,
      status: 'sent' as const,
      validUntil: '7 days from issue',
    };

    onSendMessage({
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      type: 'quotation',
      text: `Formal Quotation: ${quoteItem} - ₹${grandTotal.toLocaleString('en-IN')}`,
      quotation: quotationData,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });

    if (inquiry && onUpdateInquiryStatus) {
      onUpdateInquiryStatus(inquiry.id, 'quotation_sent');
    }

    setShowQuotationModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
      {/* Hidden file input for real photo attachments */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageFileSelect}
      />

      {/* Top Bar */}
      <header className="bg-emerald-800 text-white px-3 py-2.5 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-emerald-700/60 rounded-full transition-colors shrink-0"
            title="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>

          <div
            onClick={() => {
              if (conversation.businessId && onOpenBusinessProfile) {
                onOpenBusinessProfile(conversation.businessId);
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-95 truncate"
          >
            <img
              src={
                conversation.otherParticipant.avatarUrl ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conversation.otherParticipant.name)}`
              }
              alt={conversation.otherParticipant.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600 shrink-0"
            />

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm leading-tight truncate">
                  {conversation.otherParticipant.name}
                </span>
                {isBusinessChat && conversation.otherParticipant.verification && (
                  <VerificationBadge verification={conversation.otherParticipant.verification} lang={lang} size="sm" />
                )}
              </div>
              <div className="text-[11px] text-emerald-200 flex items-center gap-1 truncate">
                {isBusinessChat ? (
                  conversation.otherParticipant.openForChat ? (
                    <span className="flex items-center gap-1 text-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {t.openForChat}
                    </span>
                  ) : (
                    <span>{t.closedForChat}</span>
                  )
                ) : (
                  <span>online</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {conversation.otherParticipant.phoneNumber && (
            <a
              href={`tel:${conversation.otherParticipant.phoneNumber}`}
              className="p-2 hover:bg-emerald-700/60 rounded-full transition-colors text-white"
              title="Call Phone Number"
            >
              <Phone size={18} />
            </a>
          )}

          {isMeBusinessOwner && (
            <button
              onClick={() => setShowQuotationModal(true)}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1 text-white border border-emerald-500 shadow-2xs"
            >
              <FileText size={13} />
              <span className="hidden sm:inline">Send Quote</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-emerald-700/60 rounded-full transition-colors text-white"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-48 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-1.5 text-xs z-50 animate-in fade-in duration-100">
                {conversation.businessId && onOpenBusinessProfile && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenBusinessProfile(conversation.businessId!);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Store size={14} className="text-emerald-700" />
                    <span>View Business Profile</span>
                  </button>
                )}
                {onBlockUser && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onBlockUser(conversation.otherParticipant.id);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                  >
                    <ShieldAlert size={14} />
                    <span>Block Contact</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Security Notice */}
        <div className="flex justify-center">
          <div className="bg-[#ffeecd] text-[#54656f] text-[11px] px-3 py-1.5 rounded-lg shadow-2xs text-center max-w-sm border border-[#ffe099]">
            🔒 Messages and calls are verified. Verified merchants display government-backed GST &amp; location credentials.
          </div>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] sm:max-w-md rounded-2xl p-3 shadow-2xs text-sm relative ${
                  isMe
                    ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none'
                    : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                }`}
              >
                {!isMe && (
                  <p className="text-[11px] font-bold text-emerald-800 mb-1">
                    {msg.senderName}
                  </p>
                )}

                {/* Text */}
                {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                {/* Image */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mt-1.5 rounded-xl overflow-hidden border border-black/10">
                    <img
                      src={msg.mediaUrl}
                      alt="Attachment"
                      className="max-h-60 w-full object-cover"
                    />
                  </div>
                )}

                {/* Voice Note */}
                {msg.type === 'audio' && (
                  <div className="flex items-center gap-2.5 mt-1 bg-black/5 p-2 rounded-xl">
                    <button className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                      <Volume2 size={16} />
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 bg-emerald-600 rounded-full w-full" />
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        Voice note · {msg.durationSeconds || 12}s
                      </span>
                    </div>
                  </div>
                )}

                {/* Location */}
                {msg.type === 'location' && msg.location && (
                  <div className="mt-1.5 bg-black/5 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <MapPin size={14} />
                      <span>{msg.location.label || 'Shared Location'}</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                    >
                      <ExternalLink size={12} /> Open in Google Maps
                    </a>
                  </div>
                )}

                {/* Quotation Card */}
                {msg.type === 'quotation' && msg.quotation && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b pb-1.5 border-gray-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                        Formal Quotation #{msg.quotation.quotationNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">Valid 7 Days</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{msg.quotation.itemName}</p>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Qty: {msg.quotation.quantity} × ₹{msg.quotation.unitPrice.toLocaleString('en-IN')}</span>
                      <span>GST: {msg.quotation.gstRatePct}%</span>
                    </div>
                    <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between font-bold text-emerald-900 text-sm">
                      <span>Total (incl. GST):</span>
                      <span className="text-base text-emerald-700">₹{msg.quotation.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {/* Timestamp & Status */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400 select-none">
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    msg.status === 'read' ? (
                      <span title="Read" className="flex items-center text-[#53bdeb]">
                        <CheckCheck size={14} strokeWidth={2.5} />
                      </span>
                    ) : msg.status === 'delivered' ? (
                      <span title="Delivered" className="flex items-center text-gray-400">
                        <CheckCheck size={14} strokeWidth={1.8} />
                      </span>
                    ) : (
                      <span title="Sent" className="flex items-center text-gray-400">
                        <Check size={13} strokeWidth={1.8} />
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Menu Overlay */}
      {showAttachments && (
        <div className="bg-white border-t border-gray-200 p-3 flex items-center gap-4 justify-around text-xs shrink-0 animate-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-gray-700 hover:text-emerald-800 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <ImageIcon size={20} />
            </div>
            <span className="font-medium">Photos</span>
          </button>

          <button
            type="button"
            onClick={handleSendLocation}
            className="flex flex-col items-center gap-1 text-gray-700 hover:text-emerald-800 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <MapPin size={20} />
            </div>
            <span className="font-medium">Location</span>
          </button>

          {isMeBusinessOwner && (
            <button
              type="button"
              onClick={() => {
                setShowAttachments(false);
                setShowQuotationModal(true);
              }}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-emerald-800 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                <FileText size={20} />
              </div>
              <span className="font-medium">Quotation</span>
            </button>
          )}
        </div>
      )}

      {/* Live Voice Recording Bar */}
      {isRecordingVoice ? (
        <div className="bg-[#f0f2f5] p-2.5 flex items-center justify-between shrink-0 border-t border-gray-200 animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-red-700 font-bold text-xs">
              Recording 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelVoiceRecord}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <X size={14} /> Cancel
            </button>
            <button
              type="button"
              onClick={handleFinishVoiceRecord}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Send size={14} /> Send Note
            </button>
          </div>
        </div>
      ) : (
        /* Regular Input Bar */
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-1.5 shrink-0 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowAttachments(!showAttachments)}
            className={`p-2 rounded-full transition-colors ${
              showAttachments ? 'bg-gray-300 text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Attach Image or Location"
          >
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t.typeMessage}
            className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-900 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />

          {inputText.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs transition-colors shrink-0 cursor-pointer"
              title="Send"
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartVoiceRecord}
              className="w-10 h-10 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs transition-all shrink-0 cursor-pointer"
              title="Record Voice Note"
            >
              <Mic size={18} />
            </button>
          )}
        </div>
      )}

      {/* Quotation Creation Modal */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Issue Formal Business Quotation</h3>
            <form onSubmit={handleSendQuotation} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Item / Service Name</label>
                <input
                  type="text"
                  required
                  value={quoteItem}
                  onChange={(e) => setQuoteItem(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quoteQty}
                    onChange={(e) => setQuoteQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">GST Rate (%)</label>
                <select
                  value={quoteGst}
                  onChange={(e) => setQuoteGst(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18% (Standard)</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="flex-1 py-2 bg-gray-100 rounded-lg font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Send Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
