import React, { useState, useEffect, useMemo } from 'react';
import {
  CURRENT_USER,
} from './repositories/initialData';
import {
  User,
  Contact,
  Business,
  Product,
  Service,
  Conversation,
  Message,
  Inquiry,
  StaffMember,
  ReportItem,
  Language,
  InquiryStatus,
} from './domain/types';
import { defaultSearchService, UniversalSearchResults } from './domain/searchService';
import { getTranslation } from './presentation/i18n/translations';
import { HomeScreen } from './presentation/screens/HomeScreen';
import { SearchOverlayScreen } from './presentation/screens/SearchOverlayScreen';
import { ChatScreen } from './presentation/screens/ChatScreen';
import { BusinessProfileScreen } from './presentation/screens/BusinessProfileScreen';
import { ProductDetailModal } from './presentation/screens/ProductDetailModal';
import { ServiceDetailModal } from './presentation/screens/ServiceDetailModal';
import { BusinessDashboardScreen } from './presentation/screens/BusinessDashboardScreen';
import { VerificationWizardModal } from './presentation/screens/VerificationWizardModal';
import { AdminPortalScreen } from './presentation/screens/AdminPortalScreen';
import { ProfileSettingsScreen } from './presentation/screens/ProfileSettingsScreen';
import { ApkDownloadModal } from './presentation/components/ApkDownloadModal';
import { AuthModal } from './presentation/components/AuthModal';
import { NewChatModal } from './presentation/components/NewChatModal';
import { AppMenuModal } from './presentation/components/AppMenuModal';
import { subscribeToAuthChanges, getCurrentAuthUser } from './services/authService';
import { localDb } from './services/localDb';
import { firestoreChatService } from './services/firestoreChatService';
import { BottomNav, NavTab } from './presentation/components/BottomNav';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Store,
  PhoneCall,
} from 'lucide-react';

export default function App() {
  // Global State with LocalDb Persistence
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const authUser = getCurrentAuthUser();
    if (authUser) {
      return {
        ...CURRENT_USER,
        id: authUser.uid,
        name: authUser.displayName || 'Morvi Ajmeri',
        email: authUser.email || 'ajmeri.morvi@gmail.com',
        avatarUrl: authUser.photoURL || CURRENT_USER.avatarUrl,
        authProvider: 'google',
      };
    }
    return CURRENT_USER;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => localDb.getContacts());
  const [businesses, setBusinesses] = useState<Business[]>(() => localDb.getBusinesses());
  const [products, setProducts] = useState<Product[]>(() => localDb.getProducts());
  const [services, setServices] = useState<Service[]>(() => localDb.getServices());
  const [conversations, setConversations] = useState<Conversation[]>(() => localDb.getConversations());
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => localDb.getMessages());
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => localDb.getInquiries());
  const [staff] = useState<StaffMember[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [lang, setLang] = useState<Language>('en');

  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<NavTab>('chats');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<'main' | 'business_dashboard' | 'admin_portal'>('main');

  // Universal Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'people' | 'businesses' | 'products' | 'services'>('all');
  const [searchResults, setSearchResults] = useState<UniversalSearchResults>({
    query: '',
    totalCount: 0,
    contactsAndChats: [],
    businesses: [],
    products: [],
    services: [],
  });

  // Modals
  const [showVerificationWizard, setShowVerificationWizard] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Sync state to localDb on update
  useEffect(() => {
    localDb.saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    localDb.saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    localDb.saveBusinesses(businesses);
  }, [businesses]);

  useEffect(() => {
    localDb.saveProducts(products);
  }, [products]);

  useEffect(() => {
    localDb.saveServices(services);
  }, [services]);

  useEffect(() => {
    localDb.saveInquiries(inquiries);
  }, [inquiries]);

  useEffect(() => {
    localDb.saveContacts(contacts);
  }, [contacts]);

  // Real-time canonical Firestore sync for conversations across devices
  useEffect(() => {
    if (!currentUser.id) return;
    const unsub = firestoreChatService.subscribeConversations(currentUser.id, (realtimeConvs) => {
      if (realtimeConvs && realtimeConvs.length > 0) {
        setConversations(realtimeConvs);
      }
    });
    return () => unsub();
  }, [currentUser.id]);

  // Real-time canonical Firestore sync for messages in active conversation
  useEffect(() => {
    if (!activeConversation?.id) return;
    const unsub = firestoreChatService.subscribeMessages(activeConversation.id, (realtimeMsgs) => {
      if (realtimeMsgs && realtimeMsgs.length > 0) {
        setMessages((prev) => ({ ...prev, [activeConversation.id]: realtimeMsgs }));
      }
    });
    return () => unsub();
  }, [activeConversation?.id]);

  // Auto-subscribe to Firebase Auth state for Google/Gmail logins
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((fbUser) => {
      if (fbUser) {
        setCurrentUser((prev) => ({
          ...prev,
          id: fbUser.uid,
          name: fbUser.displayName || prev.name,
          email: fbUser.email || undefined,
          avatarUrl: fbUser.photoURL || prev.avatarUrl,
          authProvider: 'google',
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for native Android PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstalled(true);
      }
    } else {
      setShowApkModal(true);
    }
  };

  const t = getTranslation(lang);

  // My owned business (ABC Furniture)
  const myBusiness = useMemo(() => {
    return businesses.find((b) => b.ownerId === currentUser.id) || businesses[0];
  }, [businesses, currentUser.id]);

  // Execute Universal Search on query change
  useEffect(() => {
    let isCancelled = false;
    async function runSearch() {
      const res = await defaultSearchService.search({
        query: searchQuery,
        contacts,
        conversations,
        messages,
        businesses,
        products,
        services,
      });
      if (!isCancelled) {
        setSearchResults(res);
      }
    }

    if (searchQuery.trim()) {
      runSearch();
    } else {
      setSearchResults({
        query: '',
        totalCount: 0,
        contactsAndChats: [],
        businesses: [],
        products: [],
        services: [],
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, contacts, conversations, messages, businesses, products, services]);

  // Handle starting a conversation (from search, profile, product, or new chat modal)
  const handleOpenOrCreateChatWith = (
    target: {
      id: string;
      name: string;
      avatarUrl?: string;
      phoneNumber?: string;
      isBusiness?: boolean;
      businessId?: string;
    },
    initialMessage?: string,
    linkedProduct?: Product,
    linkedService?: Service
  ) => {
    let existingConv = conversations.find(
      (c) => c.otherParticipant.id === target.id || (target.businessId && c.businessId === target.businessId)
    );

    if (!existingConv) {
      const newConvId = `conv_${Date.now()}`;
      const matchingBiz = target.businessId ? businesses.find((b) => b.id === target.businessId) : undefined;

      existingConv = {
        id: newConvId,
        type: target.isBusiness ? 'business' : 'direct',
        participantIds: [currentUser.id, target.id],
        businessId: target.businessId,
        otherParticipant: {
          id: target.id,
          name: target.name,
          avatarUrl: target.avatarUrl || matchingBiz?.logoUrl,
          phoneNumber: target.phoneNumber || matchingBiz?.phone,
          isBusiness: target.isBusiness,
          businessId: target.businessId,
          verification: matchingBiz?.verification,
          openForChat: matchingBiz?.openForChat,
        },
        lastMessage: {
          text: initialMessage || 'Started conversation',
          senderId: currentUser.id,
          timestamp: 'Just now',
          type: linkedProduct ? 'product_card' : 'text',
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) => [existingConv!, ...prev]);
      setMessages((prev) => ({
        ...prev,
        [newConvId]: [
          ...(matchingBiz?.greetingMessage
            ? [
                {
                  id: `msg_greet_${Date.now()}`,
                  conversationId: newConvId,
                  senderId: matchingBiz.id,
                  senderName: matchingBiz.name,
                  type: 'text' as const,
                  text: matchingBiz.greetingMessage,
                  timestamp: 'Just now',
                  status: 'read' as const,
                },
              ]
            : []),
          ...(initialMessage
            ? [
                {
                  id: `msg_init_${Date.now()}`,
                  conversationId: newConvId,
                  senderId: currentUser.id,
                  senderName: currentUser.name,
                  type: (linkedProduct ? 'product_card' : 'text') as any,
                  text: initialMessage,
                  productRef: linkedProduct,
                  serviceRef: linkedService
                    ? { id: linkedService.id, name: linkedService.name, startingPrice: linkedService.startingPrice }
                    : undefined,
                  timestamp: 'Just now',
                  status: 'sent' as const,
                },
              ]
            : []),
        ],
      }));

      if (linkedProduct || linkedService) {
        const newInq: Inquiry = {
          id: `inq_${Date.now()}`,
          businessId: target.businessId!,
          businessName: target.name,
          customerId: currentUser.id,
          customerName: currentUser.name,
          conversationId: newConvId,
          entityType: linkedProduct ? 'product' : 'service',
          entityId: linkedProduct?.id || linkedService?.id,
          entityTitle: linkedProduct?.name || linkedService?.name || 'Inquiry',
          requirementNote: initialMessage || 'Customer expressed interest',
          status: 'new',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setInquiries((prev) => [newInq, ...prev]);
      }
    } else if (initialMessage) {
      handleSendMessage({
        conversationId: existingConv.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        type: linkedProduct ? 'product_card' : 'text',
        text: initialMessage,
        productRef: linkedProduct,
        timestamp: 'Just now',
        status: 'sent',
      });
    }

    setActiveConversation(existingConv);
    setSelectedBusiness(null);
    setSelectedProduct(null);
    setSelectedService(null);
    setSearchQuery('');
  };

  // Select a conversation and mark incoming messages as read
  const handleSelectConversation = (conv: Conversation) => {
    setMessages((prev) => {
      const list = prev[conv.id] || [];
      const updated = list.map((m) =>
        m.senderId !== currentUser.id && m.status !== 'read' ? { ...m, status: 'read' as const } : m
      );
      return { ...prev, [conv.id]: updated };
    });

    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );

    setActiveConversation({ ...conv, unreadCount: 0 });
  };

  // Send message in active chat with real sent -> delivered -> read status transitions
  const handleSendMessage = (msgPayload: Partial<Message>) => {
    if (!activeConversation) return;

    const msgId = `msg_${Date.now()}`;
    const newMsg: Message = {
      id: msgId,
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      type: msgPayload.type || 'text',
      text: msgPayload.text,
      mediaUrl: msgPayload.mediaUrl,
      location: msgPayload.location,
      productRef: msgPayload.productRef,
      serviceRef: msgPayload.serviceRef,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      ...msgPayload,
    };

    setMessages((prev) => ({
      ...prev,
      [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              lastMessage: {
                text: newMsg.text || 'Attachment',
                senderId: currentUser.id,
                timestamp: newMsg.timestamp,
                type: newMsg.type,
                status: 'sent',
              },
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    // Write canonically to Firestore for real cross-device synchronization
    firestoreChatService.sendMessage(activeConversation.id, newMsg, activeConversation).catch((err) => {
      console.warn('Firestore message sync notice:', err);
    });

    // 1. Transition to 'delivered' (double grey checkmarks) after 400ms
    setTimeout(() => {
      setMessages((prev) => {
        const list = prev[activeConversation.id] || [];
        return {
          ...prev,
          [activeConversation.id]: list.map((m) =>
            m.id === msgId && m.status === 'sent' ? { ...m, status: 'delivered' as const } : m
          ),
        };
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id && c.lastMessage.senderId === currentUser.id
            ? {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  status: c.lastMessage.status === 'read' ? 'read' : 'delivered',
                },
              }
            : c
        )
      );
    }, 450);

    // 2. Transition to 'read' (double blue checkmarks) after 1100ms when recipient opens and views the message
    setTimeout(() => {
      setMessages((prev) => {
        const list = prev[activeConversation.id] || [];
        return {
          ...prev,
          [activeConversation.id]: list.map((m) =>
            m.id === msgId || (m.senderId === currentUser.id && m.status !== 'read')
              ? { ...m, status: 'read' as const }
              : m
          ),
        };
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id && c.lastMessage.senderId === currentUser.id
            ? {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  status: 'read',
                },
              }
            : c
        )
      );
    }, 1100);

    // 3. Simulated response from verified merchant or contact
    if (activeConversation.type === 'business') {
      const bizId = activeConversation.businessId;
      const biz = businesses.find((b) => b.id === bizId);

      if (biz && biz.openForChat) {
        setTimeout(() => {
          const replyText =
            biz.quickReplies?.[0] || 'Thank you for reaching out! Our team is reviewing your requirement.';
          const replyMsg: Message = {
            id: `reply_${Date.now()}`,
            conversationId: activeConversation.id,
            senderId: biz.id,
            senderName: biz.name,
            type: 'text',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          };

          setMessages((p) => {
            const list = p[activeConversation.id] || [];
            // Ensure all user messages in this chat are marked as read
            const allRead = list.map((m) =>
              m.senderId === currentUser.id ? { ...m, status: 'read' as const } : m
            );
            return {
              ...p,
              [activeConversation.id]: [...allRead, replyMsg],
            };
          });

          setConversations((p) =>
            p.map((c) =>
              c.id === activeConversation.id
                ? {
                    ...c,
                    lastMessage: {
                      text: replyText,
                      senderId: biz.id,
                      timestamp: replyMsg.timestamp,
                      type: 'text',
                      status: 'read',
                    },
                    updatedAt: new Date().toISOString(),
                  }
                : c
            )
          );
        }, 1600);
      }
    }
  };

  const handleUpdateInquiryStatus = (inquiryId: string, newStatus: InquiryStatus) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: newStatus, updatedAt: new Date().toISOString() } : inq))
    );
  };

  const handleAssignStaff = (inquiryId: string, staffId: string) => {
    const assigned = staff.find((s) => s.id === staffId);
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId
          ? {
              ...inq,
              assignedStaffId: staffId,
              assignedStaffName: assigned ? `${assigned.name} (${assigned.role})` : undefined,
              updatedAt: new Date().toISOString(),
            }
          : inq
      )
    );
  };

  const handleUpdateVerification = (updatedBiz: Business) => {
    setBusinesses((prev) => prev.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
    firestoreChatService.saveBusiness(updatedBiz).catch(console.warn);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.businessId === updatedBiz.id) {
          return {
            ...c,
            otherParticipant: {
              ...c.otherParticipant,
              verification: updatedBiz.verification,
            },
          };
        }
        return c;
      })
    );
  };

  const handleToggleOpenForChat = (open: boolean) => {
    if (!myBusiness) return;
    const updated = { ...myBusiness, openForChat: open };
    handleUpdateVerification(updated);
  };

  const handleAddProduct = (prodData: Partial<Product>) => {
    if (!myBusiness) return;
    const newProd: Product = {
      id: `prod_${Date.now()}`,
      businessId: myBusiness.id,
      businessName: myBusiness.name,
      name: prodData.name || 'New Product',
      description: prodData.description || '',
      category: prodData.category || myBusiness.category,
      price: prodData.price || 0,
      priceOnRequest: prodData.priceOnRequest || false,
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      imageUrl:
        prodData.imageUrl ||
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
      available: true,
      location: myBusiness.city,
      searchKeywords: [
        prodData.name?.toLowerCase() || '',
        myBusiness.name.toLowerCase(),
        myBusiness.category.toLowerCase(),
      ],
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleAddService = (srvData: Partial<Service>) => {
    if (!myBusiness) return;
    const newSrv: Service = {
      id: `srv_${Date.now()}`,
      businessId: myBusiness.id,
      businessName: myBusiness.name,
      name: srvData.name || 'New Service',
      description: srvData.description || '',
      category: srvData.category || myBusiness.category,
      startingPrice: srvData.startingPrice || 500,
      serviceArea: srvData.serviceArea || myBusiness.city,
      available: true,
      location: myBusiness.city,
      searchKeywords: [
        srvData.name?.toLowerCase() || '',
        myBusiness.name.toLowerCase(),
      ],
    };
    setServices((prev) => [newSrv, ...prev]);
  };

  const handleReport = (targetType: 'user' | 'business' | 'message', targetId: string) => {
    const targetName =
      targetType === 'business'
        ? businesses.find((b) => b.id === targetId)?.name || 'Business'
        : 'User';

    const newReport: ReportItem = {
      id: `rep_${Date.now()}`,
      reporterId: currentUser.id,
      targetType,
      targetId,
      targetName,
      reason: 'wrong_location',
      notes: 'Reported by user for inaccurate information or spam',
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const handleBlockUser = (targetId: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      blockedUserIds: [...prev.blockedUserIds, targetId],
    }));
    setActiveConversation(null);
  };

  const unreadChatsCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  const openInquiriesCount = useMemo(() => {
    return inquiries.filter((inq) => inq.status === 'new' || inq.status === 'contacted').length;
  }, [inquiries]);

  // Main Left-pane view
  const renderSidebarView = () => {
    if (viewMode === 'admin_portal') {
      return (
        <AdminPortalScreen
          businesses={businesses}
          reports={reports}
          onBack={() => setViewMode('main')}
          onApproveVerification={(bizId, level) => {
            setBusinesses((prev) =>
              prev.map((b) =>
                b.id === bizId
                  ? {
                      ...b,
                      verification: {
                        ...b.verification,
                        level,
                        locationVerified: level >= 2,
                        businessDocVerified: level >= 3,
                        lastVerifiedDate: new Date().toISOString().split('T')[0],
                      },
                    }
                  : b
              )
            );
          }}
          onToggleSponsored={(bizId) => {
            setBusinesses((prev) =>
              prev.map((b) => (b.id === bizId ? { ...b, isSponsored: !b.isSponsored } : b))
            );
          }}
          onResolveReport={(repId, action) => {
            setReports((prev) =>
              prev.map((r) =>
                r.id === repId
                  ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' }
                  : r
              )
            );
          }}
          lang={lang}
        />
      );
    }

    if (currentTab === 'business' || viewMode === 'business_dashboard') {
      return (
        <BusinessDashboardScreen
          business={myBusiness}
          inquiries={inquiries}
          products={products.filter((p) => p.businessId === myBusiness.id)}
          services={services.filter((s) => s.businessId === myBusiness.id)}
          staff={staff}
          onOpenVerificationWizard={() => setShowVerificationWizard(true)}
          onToggleOpenForChat={handleToggleOpenForChat}
          onSelectInquiry={(inq) => {
            const conv = conversations.find((c) => c.id === inq.conversationId);
            if (conv) handleSelectConversation(conv);
          }}
          onAssignStaff={handleAssignStaff}
          onAddProduct={handleAddProduct}
          onAddService={handleAddService}
          lang={lang}
        />
      );
    }

    if (currentTab === 'calls') {
      return (
        <div className="flex flex-col h-full bg-white">
          <header className="bg-emerald-800 text-white px-4 py-3 shadow-xs">
            <h1 className="font-semibold text-lg">{t.calls}</h1>
          </header>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
              <PhoneCall size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">Encrypted Voice Calling</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              Direct peer-to-peer audio connections with verified businesses and personal contacts.
            </p>
          </div>
        </div>
      );
    }

    if (currentTab === 'updates') {
      return (
        <div className="flex flex-col h-full bg-white">
          <header className="bg-emerald-800 text-white px-4 py-3 shadow-xs">
            <h1 className="font-semibold text-lg">{t.updates}</h1>
          </header>
          <div className="flex-1 p-4 space-y-3 bg-gray-50 overflow-y-auto">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                Rajkot Verified Network
              </span>
              <h4 className="font-semibold text-sm text-gray-900">
                100% On-Site Geofence Verification Active
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Stores showing the 📍 Location Verified badge have completed on-premises physical GPS confirmation.
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase">
                Merchant Update
              </span>
              <h4 className="font-semibold text-sm text-gray-900">
                ABC Furniture catalog now includes Solid Teak Dining Sets
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Available for immediate inspection at Gondal Road showroom.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentTab === 'profile') {
      return (
        <ProfileSettingsScreen
          currentUser={currentUser}
          currentBusiness={myBusiness}
          lang={lang}
          onLanguageChange={setLang}
          onOpenAdminPortal={() => setViewMode('admin_portal')}
          onOpenBusinessDashboard={() => setCurrentTab('business')}
          onOpenApkModal={() => setShowApkModal(true)}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
      );
    }

    // Default: HomeScreen with Universal Search overlay
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <HomeScreen
          conversations={conversations}
          currentUser={currentUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchFilter={searchFilter}
          onFilterChange={setSearchFilter}
          onSelectConversation={handleSelectConversation}
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenLanguageModal={() => setShowLanguageModal(true)}
          onOpenMenuModal={() => setShowMenuModal(true)}
          onOpenApkModal={() => setShowApkModal(true)}
          onOpenAuthModal={() => setShowAuthModal(true)}
          lang={lang}
        />

        {searchQuery.trim().length > 0 && (
          <div className="absolute inset-0 top-[110px] bg-white z-20 flex flex-col">
            <SearchOverlayScreen
              results={searchResults}
              filter={searchFilter}
              onSelectPerson={(person) => {
                const matchingConv = conversations.find((c) => c.id === person.conversationId);
                if (matchingConv) {
                  handleSelectConversation(matchingConv);
                  setSearchQuery('');
                } else {
                  handleOpenOrCreateChatWith({
                    id: person.id,
                    name: person.name,
                    avatarUrl: person.avatarUrl,
                    phoneNumber: person.phoneNumber,
                  });
                }
              }}
              onSelectBusiness={(biz) => {
                setSelectedBusiness(biz);
                setSearchQuery('');
              }}
              onSelectProduct={(prod) => {
                setSelectedProduct(prod);
                setSearchQuery('');
              }}
              onSelectService={(srv) => {
                setSelectedService(srv);
                setSearchQuery('');
              }}
              lang={lang}
            />
          </div>
        )}
      </div>
    );
  };

  // Main Active Detail View (Chat / Business Profile / Product Detail / Service Detail)
  const renderDetailView = () => {
    if (activeConversation) {
      const activeInquiry = inquiries.find(
        (inq) => inq.conversationId === activeConversation.id || (activeConversation.businessId && inq.businessId === activeConversation.businessId)
      );

      return (
        <ChatScreen
          conversation={activeConversation}
          messages={messages[activeConversation.id] || []}
          currentUser={currentUser}
          currentBusiness={myBusiness}
          inquiry={activeInquiry}
          onSendMessage={handleSendMessage}
          onUpdateInquiryStatus={handleUpdateInquiryStatus}
          onBack={() => setActiveConversation(null)}
          onOpenBusinessProfile={(bizId) => {
            const biz = businesses.find((b) => b.id === bizId);
            if (biz) setSelectedBusiness(biz);
          }}
          onBlockUser={handleBlockUser}
          onReport={handleReport}
          lang={lang}
        />
      );
    }

    if (selectedBusiness) {
      return (
        <BusinessProfileScreen
          business={selectedBusiness}
          products={products}
          services={services}
          onBack={() => setSelectedBusiness(null)}
          onStartChat={(initText, prod, srv) => {
            handleOpenOrCreateChatWith(
              {
                id: selectedBusiness.id,
                name: selectedBusiness.name,
                avatarUrl: selectedBusiness.logoUrl,
                phoneNumber: selectedBusiness.phone,
                isBusiness: true,
                businessId: selectedBusiness.id,
              },
              initText,
              prod,
              srv
            );
          }}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onSelectService={(s) => setSelectedService(s)}
          lang={lang}
        />
      );
    }

    if (selectedProduct) {
      const biz = businesses.find((b) => b.id === selectedProduct.businessId);
      return (
        <ProductDetailModal
          product={selectedProduct}
          business={biz}
          onBack={() => setSelectedProduct(null)}
          onChatAboutProduct={(prod) => {
            handleOpenOrCreateChatWith(
              {
                id: prod.businessId,
                name: prod.businessName,
                isBusiness: true,
                businessId: prod.businessId,
              },
              `I am interested in ${prod.name}.`,
              prod
            );
          }}
          onViewBusiness={(bizId) => {
            const b = businesses.find((item) => item.id === bizId);
            if (b) {
              setSelectedProduct(null);
              setSelectedBusiness(b);
            }
          }}
          lang={lang}
        />
      );
    }

    if (selectedService) {
      const biz = businesses.find((b) => b.id === selectedService.businessId);
      return (
        <ServiceDetailModal
          service={selectedService}
          business={biz}
          onBack={() => setSelectedService(null)}
          onChatAboutService={(srv) => {
            handleOpenOrCreateChatWith(
              {
                id: srv.businessId,
                name: srv.businessName,
                isBusiness: true,
                businessId: srv.businessId,
              },
              `I would like to inquire about ${srv.name}.`,
              undefined,
              srv
            );
          }}
          onViewBusiness={(bizId) => {
            const b = businesses.find((item) => item.id === bizId);
            if (b) {
              setSelectedService(null);
              setSelectedBusiness(b);
            }
          }}
          lang={lang}
        />
      );
    }

    // Default right-pane state for desktop (WhatsApp Web style welcome hero)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f0f2f5] border-b-8 border-emerald-700 select-none">
        <div className="w-24 h-24 rounded-full bg-emerald-800 text-white flex items-center justify-center mb-6 shadow-xl relative">
          <span className="text-4xl font-extrabold tracking-tight">S</span>
          <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
            <ShieldCheck size={26} className="text-emerald-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sampark Web</h2>
        <p className="text-sm text-gray-600 max-w-md leading-relaxed mb-6">
          Official messaging and verified business discovery platform. Direct communication with GST-registered and location-verified merchants.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <MessageSquare size={16} />
            <span>Start New Chat</span>
          </button>
          <button
            onClick={() => setCurrentTab('business')}
            className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
          >
            <Store size={16} className="text-emerald-700" />
            <span>My Store</span>
          </button>
        </div>

        <div className="mt-12 flex items-center gap-1.5 text-xs text-gray-400">
          <Lock size={13} />
          <span>End-to-end encrypted · GST &amp; Geofence Verified</span>
        </div>
      </div>
    );
  };

  const isDetailActive = Boolean(activeConversation || selectedBusiness || selectedProduct || selectedService);

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col overflow-hidden font-sans antialiased selection:bg-emerald-100">
      {/* Real Full-Screen Production Container */}
      <div className="flex-1 flex overflow-hidden w-full h-full">
        {/* Left Column (Sidebar / Master View): Full width on mobile, 420px on desktop */}
        <aside
          className={`h-full flex flex-col bg-white border-r border-gray-200 transition-all ${
            isDetailActive ? 'hidden md:flex md:w-[400px] lg:w-[460px] shrink-0' : 'w-full md:w-[400px] lg:w-[460px] shrink-0'
          }`}
        >
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {renderSidebarView()}
          </div>

          {/* Bottom Nav on Sidebar */}
          {viewMode === 'main' && (
            <BottomNav
              currentTab={currentTab}
              onTabChange={(tab) => {
                setCurrentTab(tab);
                setSearchQuery('');
              }}
              unreadChatsCount={unreadChatsCount}
              openInquiriesCount={openInquiriesCount}
              lang={lang}
            />
          )}
        </aside>

        {/* Right Column (Detail View): Full screen on mobile when active, remaining flex space on desktop */}
        <main
          className={`h-full flex-1 flex flex-col overflow-hidden ${
            isDetailActive ? 'flex w-full' : 'hidden md:flex'
          }`}
        >
          {renderDetailView()}
        </main>
      </div>

      {/* Real New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        contacts={contacts}
        businesses={businesses}
        onAddContacts={(newContacts) => {
          setContacts((prev) => {
            const existingPhones = new Set(prev.map((c) => c.phoneNumber.replace(/[^\d]/g, '')));
            const filteredNew = newContacts.filter(
              (nc) => !existingPhones.has(nc.phoneNumber.replace(/[^\d]/g, ''))
            );
            return [...filteredNew, ...prev];
          });
        }}
        onStartChatWithContact={(target, msg) => {
          handleOpenOrCreateChatWith(target, msg);
        }}
      />

      {/* Real App Menu Modal */}
      <AppMenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        currentUser={currentUser}
        currentBusiness={myBusiness}
        lang={lang}
        onOpenBusinessDashboard={() => {
          setViewMode('business_dashboard');
          setCurrentTab('business');
        }}
        onOpenVerificationWizard={() => setShowVerificationWizard(true)}
        onOpenAdminPortal={() => setViewMode('admin_portal')}
        onOpenLanguageModal={() => setShowLanguageModal(true)}
        onOpenApkModal={() => setShowApkModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Android App & APK Download Modal */}
      <ApkDownloadModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        onInstallPwa={handleInstallApp}
        isInstallable={!isInstalled}
      />

      {/* Verification Wizard Modal */}
      {showVerificationWizard && myBusiness && (
        <VerificationWizardModal
          business={myBusiness}
          onClose={() => setShowVerificationWizard(false)}
          onUpdateVerification={handleUpdateVerification}
          lang={lang}
        />
      )}

      {/* Language Switch Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Choose Language / ભાષા / भाषा</h3>
            <div className="space-y-1.5 text-xs">
              {(
                [
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी (Hindi)' },
                  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
                ] as const
              ).map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLang(item.code);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl font-medium transition-colors flex items-center justify-between ${
                    lang === item.code ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{item.label}</span>
                  {lang === item.code && <CheckCircle2 size={16} className="text-emerald-700" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onUserChange={(updatedUser: User) => {
          setCurrentUser(updatedUser);
        }}
      />
    </div>
  );
}
