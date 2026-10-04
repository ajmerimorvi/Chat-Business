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
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBusinessChat = conversation.type === 'business' || conversation.otherParticipant.isBusiness;
  const isMeBusinessOwner = currentBusiness && currentBusiness.id === conversation.businessId;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendQuickReply = (text: string) => {
    onSendMessage({
      conversationId: conversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      type: 'text',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    });
    setShowQuickReplies(false);
  };

  const handleSendLocation = () => {
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
  };

  const handleSendVoiceSim = () => {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setIsRecordingVoice(false);
      onSendMessage({
        conversationId: conversation.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        type: 'audio',
        durationSeconds: 14,
        text: 'Voice message (0:14)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      });
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] relative">
      {/* Top Bar */}
      <header className="bg-emerald-800 text-white px-2 py-2 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-1 min-w-0">
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
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
              }
              alt={conversation.otherParticipant.name}
              className="w-9 h-9 rounded-full object-cover border border-emerald-600 shrink-0"
            />

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm leading-tight truncate">
                  {conversation.otherParticipant.name}
                </span>
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
              className="p-2 hover:bg-emerald-700/60 rounded-full text-white transition-colors"
              title="Call"
            >
              <Phone size={18} />
            </a>
          )}

          {isBusinessChat && conversation.businessId && onOpenBusinessProfile && (
            <button
              onClick={() => onOpenBusinessProfile(conversation.businessId!)}
              className="p-2 hover:bg-emerald-700/60 rounded-full text-white transition-colors"
              title="View Business Profile"
            >
              <Info size={18} />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-emerald-700/60 rounded-full text-white transition-colors"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-sm text-gray-700 z-50">
                {isBusinessChat && conversation.businessId && onOpenBusinessProfile && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenBusinessProfile(conversation.businessId!);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Store size={15} className="text-gray-500" />
                    Business Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (onBlockUser) onBlockUser(conversation.otherParticipant.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                >
                  <ShieldAlert size={15} />
                  Block Contact
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (onReport) onReport(isBusinessChat ? 'business' : 'user', conversation.otherParticipant.id);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 flex items-center gap-2"
                >
                  <ShieldAlert size={15} />
                  Report
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Structured Inquiry Header (if chat is an active inquiry) */}
      {inquiry && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center justify-between text-xs text-amber-900 shadow-2xs shrink-0">
          <div className="min-w-0 pr-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">
              {t.inquiryTitle}
            </span>
            <span className="font-semibold truncate block">{inquiry.entityTitle}</span>
            <span className="text-[11px] text-amber-800 line-clamp-1">{inquiry.requirementNote}</span>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-[10px] bg-amber-200/80 text-amber-900 font-semibold px-2 py-0.5 rounded capitalize">
              {inquiry.status.replace('_', ' ')}
            </span>

            {/* If business owner, allow status transition */}
            {isMeBusinessOwner && onUpdateInquiryStatus && (
              <select
                value={inquiry.status}
                onChange={(e) => onUpdateInquiryStatus(inquiry.id, e.target.value as InquiryStatus)}
                className="text-[11px] bg-white border border-amber-300 rounded px-1.5 py-0.5 text-gray-700 focus:outline-hidden"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="quotation_sent">Quotation Sent</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* Verified Business Banner Info in Chat */}
      {isBusinessChat && conversation.otherParticipant.verification && (
        <div className="bg-white/95 border-b border-gray-100 px-3 py-1.5 flex items-center justify-between text-xs text-gray-600 shadow-2xs">
          <VerificationBadge verification={conversation.otherParticipant.verification} lang={lang} size="sm" />
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            Replies in ~15 mins
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex justify-center my-2">
          <span className="text-[11px] bg-white/90 text-gray-500 font-medium px-2.5 py-0.5 rounded-full shadow-2xs border border-gray-200">
            Messages are end-to-end encrypted
          </span>
        </div>

        {messages.map((msg) => {
          const isMine = msg.senderId === currentUser.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-2xs text-sm relative break-words ${
                  isMine
                    ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-xs'
                    : 'bg-white text-gray-900 rounded-tl-xs'
                }`}
              >
                {/* Product Reference Card inside Message */}
                {msg.productRef && (
                  <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2.5">
                    <img
                      src={msg.productRef.imageUrl}
                      alt={msg.productRef.name}
                      className="w-12 h-12 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-gray-900 truncate">
                        {msg.productRef.name}
                      </p>
                      <p className="text-xs font-bold text-emerald-800">
                        ₹{msg.productRef.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location card */}
                {msg.type === 'location' && msg.location && (
                  <div className="mb-1.5 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                    <MapPin className="text-blue-600 shrink-0" size={20} />
                    <div className="text-xs">
                      <p className="font-semibold text-blue-900">Shared Location</p>
                      <p className="text-blue-700 text-[11px]">{msg.location.label}</p>
                    </div>
                  </div>
                )}

                {/* Audio voice note player mockup */}
                {msg.type === 'audio' && (
                  <div className="flex items-center gap-2 py-1 min-w-44">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Mic size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-emerald-600" />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">0:14</span>
                    </div>
                  </div>
                )}

                {/* Text Content */}
                {msg.text && (
                  <p className="text-[13px] leading-relaxed select-text">{msg.text}</p>
                )}

                {/* Timestamp and Read Status */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400 select-none">
                  <span>{msg.timestamp}</span>
                  {isMine && (
                    <CheckCheck size={14} className="text-emerald-600 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies Drawer for Business Owners */}
      {isBusinessChat && currentBusiness?.quickReplies && showQuickReplies && (
        <div className="bg-white border-t border-gray-200 p-2 text-xs space-y-1 z-30 shadow-md">
          <div className="flex items-center justify-between font-semibold text-gray-600 pb-1 border-b border-gray-100">
            <span>Quick Replies</span>
            <button onClick={() => setShowQuickReplies(false)} className="text-gray-400">✕</button>
          </div>
          {currentBusiness.quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuickReply(qr)}
              className="w-full text-left px-2.5 py-1.5 hover:bg-gray-50 text-gray-800 rounded transition-colors text-xs"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Attachments Drawer */}
      {showAttachments && (
        <div className="bg-white border-t border-gray-200 p-3 grid grid-cols-4 gap-2 text-center text-xs z-30 shadow-md">
          <button
            onClick={() => {
              onSendMessage({
                conversationId: conversation.id,
                senderId: currentUser.id,
                senderName: currentUser.name,
                type: 'text',
                text: '📷 Photo attachment',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              });
              setShowAttachments(false);
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-purple-50 text-purple-700"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <ImageIcon size={20} />
            </div>
            <span>{t.camera}</span>
          </button>

          <button
            onClick={() => {
              onSendMessage({
                conversationId: conversation.id,
                senderId: currentUser.id,
                senderName: currentUser.name,
                type: 'text',
                text: '📄 Quotation_Estimate.pdf',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
              });
              setShowAttachments(false);
            }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-blue-50 text-blue-700"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span>{t.document}</span>
          </button>

          <button
            onClick={handleSendLocation}
            className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-emerald-50 text-emerald-700"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <span>{t.locationShare}</span>
          </button>

          {isBusinessChat && (
            <button
              onClick={() => {
                setShowQuickReplies(true);
                setShowAttachments(false);
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-amber-50 text-amber-700"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <span>Replies</span>
            </button>
          )}
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-[#f0f2f5] p-2 flex items-center gap-1.5 shrink-0 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowAttachments(!showAttachments)}
          className={`p-2 rounded-full transition-colors ${
            showAttachments ? 'bg-gray-300 text-gray-800' : 'text-gray-500 hover:text-gray-700'
          }`}
          title="Attach"
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
          className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-900 border border-gray-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 shadow-2xs"
        />

        {inputText.trim() ? (
          <button
            type="button"
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
            title="Send"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendVoiceSim}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isRecordingVoice
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
            }`}
            title="Hold to Record Voice Message"
          >
            <Mic size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
