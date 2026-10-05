export type Language = 'en' | 'hi' | 'gu';

export type UserRole = 'customer' | 'business_owner' | 'business_staff' | 'admin';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  language: Language;
  role: UserRole;
  ownedBusinessIds: string[];
  staffAtBusinessIds: string[];
  blockedUserIds: string[];
  blockedBusinessIds: string[];
  authProvider?: 'phone' | 'google' | 'guest';
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string;
  statusMessage?: string;
  hasApp: boolean;
}

export type BusinessType = 'physical_store' | 'manufacturer' | 'office' | 'home_service' | 'online';

export type VerificationLevel = 0 | 1 | 2 | 3;

export type BusinessDatabaseStatus = 'ACTIVE' | 'INACTIVE';

export type BusinessVerificationStatus = 'UNVERIFIED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'REJECTED';

export type BusinessSource = 'MANUAL' | 'CSV_IMPORT' | 'EXCEL_IMPORT' | 'SALES_TEAM';

export interface BusinessHours {
  days: string; // e.g. "Mon - Sat"
  openTime: string; // "09:00"
  closeTime: string; // "20:00"
  isOpenToday: boolean;
}

export type VerificationStatus = 'draft' | 'pending_verification' | 'verified' | 're_verification_required' | 'suspended';

export interface VerificationAuditEvent {
  id: string;
  eventType: 'mobile_otp' | 'gps_geofence' | 'gst_doc' | 'reverification_trigger' | 'admin_override';
  status: 'passed' | 'failed' | 'flagged';
  timestamp: string;
  performedBy: string;
  details: string;
}

export interface BusinessVerification {
  level: VerificationLevel;
  status?: VerificationStatus;
  mobileVerified: boolean;
  mobileVerifiedAt?: string;
  locationVerified: boolean;
  locationVerifiedAt?: string;
  verifiedCoordinates?: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    address: string;
  };
  businessDocVerified: boolean;
  businessDocType?: 'gstin' | 'shop_act' | 'trade_license';
  businessDocNumber?: string;
  businessDocVerifiedAt?: string;
  lastVerifiedDate: string;
  nextVerificationDueAt?: string;
  reverificationRequired: boolean;
  riskReason?: string;
  auditHistory?: VerificationAuditEvent[];
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  subcategory: string;
  businessType: BusinessType;
  description: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  coverImageUrl: string;
  logoUrl: string;
  rating: number;
  reviewCount: number;
  openForChat: boolean;
  businessHours: BusinessHours;
  responseMetrics: {
    avgResponseMinutes: number; // e.g. 15
    responseRatePct: number;    // e.g. 94%
    text: string;               // e.g. "Usually replies within 15 min"
  };
  verification: BusinessVerification;
  subscriptionTier: 'free' | 'starter' | 'growth' | 'pro' | 'enterprise';
  activeConversationsCount: number;
  maxActiveConversations: number; // 10 for Free, 9999 for Paid
  isSponsored?: boolean;
  greetingMessage?: string;
  awayMessage?: string;
  quickReplies?: string[];
  searchKeywords: string[];

  // Database Management & Audit Foundation fields
  businessId?: string;
  businessName?: string;
  contactPerson?: string;
  mobile?: string;
  whatsapp?: string;
  area?: string;
  state?: string;
  pincode?: string;
  remarks?: string;
  status?: BusinessDatabaseStatus;
  verificationStatus?: BusinessVerificationStatus;
  source?: BusinessSource;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  importId?: string;
}

export interface BusinessImportRecord {
  importId: string;
  fileName: string;
  fileType: 'csv' | 'xlsx';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  skippedRows: number;
  uploadedBy: string;
  uploadedByName?: string;
  createdAt: string;
  status: 'completed' | 'partial' | 'failed';
  errors?: Array<{ row: number; businessName?: string; reason: string }>;
}

export interface BusinessVerificationRecord {
  verificationId: string;
  businessId: string;
  businessName: string;
  verifiedBy: string;
  verifierName?: string;
  verificationDate: string;
  mobileOtpVerified: boolean;
  locationVerified: boolean;
  businessExists: boolean;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  businessPhoto?: string;
  remarks?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface Product {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  description: string;
  category: string;
  price: number;
  priceOnRequest: boolean;
  sku?: string;
  imageUrl: string;
  available: boolean;
  location: string;
  searchKeywords: string[];
}

export interface Service {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  description: string;
  category: string;
  startingPrice: number;
  serviceArea: string;
  imageUrl?: string;
  available: boolean;
  location: string;
  searchKeywords: string[];
}

export interface Quotation {
  quotationNumber: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  gstRatePct: number;
  totalAmount: number;
  status: 'sent' | 'accepted' | 'declined' | 'revision_requested';
  validUntil: string;
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'audio' 
  | 'location' 
  | 'product_card' 
  | 'service_card' 
  | 'inquiry_context'
  | 'quotation';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  durationSeconds?: number;
  location?: {
    lat: number;
    lng: number;
    label: string;
  };
  productRef?: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    priceOnRequest?: boolean;
  };
  serviceRef?: {
    id: string;
    name: string;
    startingPrice: number;
  };
  inquiryRef?: {
    id: string;
    status: InquiryStatus;
    title: string;
  };
  quotation?: Quotation;
  replyToMessage?: {
    id: string;
    senderName: string;
    text: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  deleted?: boolean;
}

export type InquiryStatus = 
  | 'new' 
  | 'contacted' 
  | 'interested' 
  | 'quotation_sent' 
  | 'follow_up' 
  | 'converted' 
  | 'not_interested' 
  | 'closed';

export interface Inquiry {
  id: string;
  businessId: string;
  businessName: string;
  customerId: string;
  customerName: string;
  conversationId: string;
  entityType: 'product' | 'service' | 'general';
  entityId?: string;
  entityTitle: string;
  requirementNote: string;
  status: InquiryStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'business';
  participantIds: string[];
  otherParticipant: {
    id: string;
    name: string;
    avatarUrl?: string;
    phoneNumber?: string;
    isBusiness?: boolean;
    businessId?: string;
    verification?: BusinessVerification;
    openForChat?: boolean;
  };
  businessId?: string;
  assignedStaffId?: string;
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: string;
    type: MessageType;
    status?: 'sent' | 'delivered' | 'read';
  };
  unreadCount: number;
  inquiryId?: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  role: 'owner' | 'manager' | 'sales' | 'support';
  phoneNumber: string;
  avatarUrl?: string;
  assignedCount: number;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'user' | 'business' | 'message';
  targetId: string;
  targetName: string;
  reason: string;
  notes?: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}
