import React, { useState, useEffect, useMemo } from 'react';
import {
  CURRENT_USER,
  INITIAL_CONTACTS,
  INITIAL_BUSINESSES,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_INQUIRIES,
  INITIAL_STAFF,
  INITIAL_REPORTS,
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
import { BottomNav, NavTab } from './presentation/components/BottomNav';
import {
  Smartphone,
  Maximize2,
  Minimize2,
  PhoneCall,
  Bell,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [contacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [inquiries, setInquiries] = useState<Inquiry[]>(INITIAL_INQUIRIES);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
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
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

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

  // Handle starting a conversation (from search, profile, or product)
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
    // Check if conversation exists
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

      // If inquiry context
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
      // Send initial message to existing conv
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

  // Send message in active chat
  const handleSendMessage = (msgPayload: Partial<Message>) => {
    if (!activeConversation) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
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

    // Update conversation lastMessage
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
              },
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    // Business simulated response
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

          setMessages((p) => ({
            ...p,
            [activeConversation.id]: [...(p[activeConversation.id] || []), replyMsg],
          }));

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
                    },
                    updatedAt: new Date().toISOString(),
                  }
                : c
            )
          );
        }, 1500);
      }
    }
  };

  // Inquiry Status update
  const handleUpdateInquiryStatus = (inquiryId: string, newStatus: InquiryStatus) => {
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: newStatus, updatedAt: new Date().toISOString() } : inq))
    );
  };

  // Staff assignment
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

  // Verification updates
  const handleUpdateVerification = (updatedBiz: Business) => {
    setBusinesses((prev) => prev.map((b) => (b.id === updatedBiz.id ? updatedBiz : b)));
    // Also sync in conversations
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

  // Toggle open for chat
  const handleToggleOpenForChat = (open: boolean) => {
    if (!myBusiness) return;
    const updated = { ...myBusiness, openForChat: open };
    handleUpdateVerification(updated);
  };

  // Add Product to catalog
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

  // Add Service
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

  // Reports
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
    alert('Report submitted. Admin moderation team will review this listing.');
  };

  // Block user
  const handleBlockUser = (targetId: string) => {
    setCurrentUser((prev) => ({
      ...prev,
      blockedUserIds: [...prev.blockedUserIds, targetId],
    }));
    setActiveConversation(null);
    alert('Contact has been blocked.');
  };

  // Unread count
  const unreadChatsCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  // Open inquiries count
  const openInquiriesCount = useMemo(() => {
    return inquiries.filter((inq) => inq.status === 'new' || inq.status === 'contacted').length;
  }, [inquiries]);

  // Render the current view
  const renderCurrentView = () => {
    // 1. If currently inside a 1-on-1 Chat
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

    // 2. If viewing a Business Profile
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

    // 3. If viewing a Product Detail Modal
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

    // 4. If viewing a Service Detail Modal
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

    // 5. Admin Portal view
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

    // 6. Business Dashboard view
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
            if (conv) setActiveConversation(conv);
          }}
          onAssignStaff={handleAssignStaff}
          onAddProduct={handleAddProduct}
          onAddService={handleAddService}
          lang={lang}
        />
      );
    }

    // 7. Calls Tab (Reserved navigation architecture)
    if (currentTab === 'calls') {
      return (
        <div className="flex flex-col h-full bg-white">
          <header className="bg-emerald-800 text-white px-4 py-3 shadow-xs">
            <h1 className="font-semibold text-lg">{t.calls}</h1>
          </header>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <PhoneCall size={28} />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-1">Encrypted Voice &amp; Video Calling</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              Call any verified business or contact directly from their profile without revealing your private mobile number.
            </p>
          </div>
        </div>
      );
    }

    // 8. Updates Tab
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

    // 9. Profile & Settings Tab
    if (currentTab === 'profile') {
      return (
        <ProfileSettingsScreen
          currentUser={currentUser}
          currentBusiness={myBusiness}
          lang={lang}
          onLanguageChange={setLang}
          onOpenAdminPortal={() => setViewMode('admin_portal')}
          onOpenBusinessDashboard={() => setCurrentTab('business')}
        />
      );
    }

    // 10. Default: HomeScreen with Universal Search overlay when user types
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <HomeScreen
          conversations={conversations}
          currentUser={currentUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchFilter={searchFilter}
          onFilterChange={setSearchFilter}
          onSelectConversation={(conv) => setActiveConversation(conv)}
          onOpenNewChat={() => setSearchQuery('Raj')}
          onOpenLanguageModal={() => setShowLanguageModal(true)}
          onOpenPersonaModal={() => setShowPersonaModal(true)}
          lang={lang}
        />

        {/* When user starts searching, display Universal Search Results overlay instantly */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute inset-0 top-[110px] bg-white z-20 flex flex-col">
            <SearchOverlayScreen
              results={searchResults}
              filter={searchFilter}
              onSelectPerson={(person) => {
                const matchingConv = conversations.find((c) => c.id === person.conversationId);
                if (matchingConv) {
                  setActiveConversation(matchingConv);
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

  return (
    <div className="min-h-screen bg-slate-900 text-gray-900 flex flex-col items-center justify-center font-sans antialiased selection:bg-emerald-100">
      {/* Top Ambient Bar (Allows switching frame vs fullscreen) */}
      <header className="w-full max-w-4xl px-4 py-2 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-200">Sampark</span>
          <span className="text-slate-500">·</span>
          <span>Universal Search &amp; Verified Business Discovery</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
            title="Toggle Android Device Frame"
          >
            {isPhoneFrame ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            <span>{isPhoneFrame ? 'Expand Viewport' : 'Android Frame'}</span>
          </button>
        </div>
      </header>

      {/* Main Container / Mobile Device Frame */}
      <main
        className={`w-full transition-all duration-300 flex flex-col overflow-hidden bg-white shadow-2xl ${
          isPhoneFrame
            ? 'max-w-[420px] h-[92vh] max-h-[880px] rounded-3xl border-8 border-slate-800 relative'
            : 'max-w-4xl h-[92vh] rounded-2xl border border-slate-800'
        }`}
      >
        {/* Android Mock Status Bar */}
        <div className="bg-emerald-950 text-white px-4 py-1 flex items-center justify-between text-[11px] font-medium tracking-tight select-none shrink-0 z-40">
          <span>09:41</span>
          <div className="flex items-center gap-2">
            <span>5G</span>
            <span>88%</span>
          </div>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {renderCurrentView()}
        </div>

        {/* Bottom Navigation (Visible on main views when not in deep chat or modal) */}
        {!activeConversation && !selectedBusiness && !selectedProduct && !selectedService && viewMode === 'main' && (
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
      </main>

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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
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

      {/* Persona Switch Modal */}
      {showPersonaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Switch Persona Mode</h3>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  setViewMode('main');
                  setCurrentTab('chats');
                  setShowPersonaModal(false);
                }}
                className="w-full text-left p-2.5 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                <p className="font-bold text-gray-900">👤 Customer Mode</p>
                <p className="text-[11px] text-gray-500">Ajit Sharma (Search, Discover &amp; Chat)</p>
              </button>

              <button
                onClick={() => {
                  setViewMode('main');
                  setCurrentTab('business');
                  setShowPersonaModal(false);
                }}
                className="w-full text-left p-2.5 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors"
              >
                <p className="font-bold text-gray-900">🏪 Business Owner Mode</p>
                <p className="text-[11px] text-gray-500">ABC Furniture (Inquiries, Verification, Catalog)</p>
              </button>

              <button
                onClick={() => {
                  setViewMode('admin_portal');
                  setShowPersonaModal(false);
                }}
                className="w-full text-left p-2.5 bg-slate-900 text-white rounded-xl transition-colors"
              >
                <p className="font-bold">🛡️ Platform Admin Mode</p>
                <p className="text-[11px] text-slate-300">Verification Audit, Moderation, Search Analytics</p>
              </button>
            </div>
            <button
              onClick={() => setShowPersonaModal(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
