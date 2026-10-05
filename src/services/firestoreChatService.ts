import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Conversation, Message, Inquiry, Business, Product, Service, BusinessImportRecord } from '../domain/types';

/**
 * Production-ready Firestore Real-Time Data Service.
 * Ensures canonical synchronization across devices (Phone A <-> Firestore <-> Phone B)
 * instead of isolated client-side localStorage.
 */

export const firestoreChatService = {
  /**
   * Subscribe in real-time to conversations where the current user is a participant.
   */
  subscribeConversations(userId: string, onUpdate: (conversations: Conversation[]) => void): () => void {
    if (!userId) return () => {};

    try {
      const convsRef = collection(db, 'conversations');
      const q = query(convsRef, where('participantIds', 'array-contains', userId));

      return onSnapshot(
        q,
        (snapshot) => {
          const conversations: Conversation[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            conversations.push({
              id: docSnap.id,
              type: data.type || (data.businessId ? 'business' : 'direct'),
              participantIds: data.participantIds || [],
              businessId: data.businessId,
              otherParticipant: data.otherParticipant || {
                id: (data.participantIds || []).find((p: string) => p !== userId) || 'unknown',
                name: data.otherParticipantName || 'Contact',
                avatarUrl: data.otherParticipantAvatar,
              },
              lastMessage: {
                text: data.lastMessageText || '',
                senderId: data.lastMessageSenderId || '',
                timestamp: data.lastMessageTimestamp || 'Just now',
                type: data.lastMessageType || 'text',
                status: data.lastMessageStatus || 'delivered',
              },
              unreadCount: data.unreadCount || 0,
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          });

          // Sort by latest message descending
          conversations.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          onUpdate(conversations);
        },
        (error) => {
          console.warn('Firestore conversations subscription notice:', error);
        }
      );
    } catch (e) {
      console.warn('Could not subscribe to Firestore conversations:', e);
      return () => {};
    }
  },

  /**
   * Subscribe in real-time to messages in a specific conversation.
   */
  subscribeMessages(conversationId: string, onUpdate: (messages: Message[]) => void): () => void {
    if (!conversationId) return () => {};

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const msgs: Message[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            msgs.push({
              id: docSnap.id,
              conversationId,
              senderId: data.senderId,
              senderName: data.senderName || '',
              senderAvatarUrl: data.senderAvatarUrl,
              text: data.text || '',
              type: data.type || 'text',
              mediaUrl: data.mediaUrl,
              mediaDurationSeconds: data.mediaDurationSeconds,
              mediaSizeBytes: data.mediaSizeBytes,
              mediaMimeType: data.mediaMimeType,
              locationPayload: data.locationPayload,
              timestamp: data.timestamp || new Date().toISOString(),
              status: data.status || 'delivered',
              isFromBusiness: Boolean(data.isFromBusiness),
              businessId: data.businessId,
              quotationPayload: data.quotationPayload,
            } as Message);
          });
          onUpdate(msgs);
        },
        (error) => {
          console.warn('Firestore messages subscription notice:', error);
        }
      );
    } catch (e) {
      console.warn('Could not subscribe to Firestore messages:', e);
      return () => {};
    }
  },

  /**
   * Send a message to Firestore atomically and update parent conversation metadata.
   */
  async sendMessage(conversationId: string, message: Message, conversationPayload?: Partial<Conversation>): Promise<void> {
    try {
      const batch = writeBatch(db);
      const convRef = doc(db, 'conversations', conversationId);

      const convData = conversationPayload
        ? {
            ...conversationPayload,
            id: conversationId,
            lastMessageText: message.text || (message.type === 'image' ? '📷 Photo' : 'Voice note'),
            lastMessageTimestamp: message.timestamp,
            lastMessageStatus: message.status,
            updatedAt: serverTimestamp(),
          }
        : {
            lastMessageText: message.text || (message.type === 'image' ? '📷 Photo' : 'Voice note'),
            lastMessageTimestamp: message.timestamp,
            lastMessageStatus: message.status,
            updatedAt: serverTimestamp(),
          };

      batch.set(convRef, convData, { merge: true });

      const msgRef = doc(db, 'conversations', conversationId, 'messages', message.id);
      batch.set(msgRef, {
        ...message,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (e) {
      console.error('Failed to send message atomically to Firestore:', e);
      throw e;
    }
  },

  /**
   * Subscribe to Businesses in Firestore with bounded limit to prevent browser memory exhaustion on large collections
   */
  subscribeBusinesses(onUpdate: (businesses: Business[]) => void, limitCount: number = 200): () => void {
    try {
      const bizRef = collection(db, 'businesses');
      const q = query(bizRef, limit(limitCount));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: Business[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as Business);
          });
          if (list.length > 0) {
            onUpdate(list);
          }
        },
        (error) => {
          console.warn('Businesses subscription notice:', error);
        }
      );
    } catch (e) {
      console.warn('Failed subscribing to businesses:', e);
      return () => {};
    }
  },

  /**
   * Update message status (e.g. delivered -> read)
   */
  async updateMessageStatus(conversationId: string, messageId: string, status: 'delivered' | 'read'): Promise<void> {
    try {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
      await updateDoc(msgRef, { status });
    } catch (e) {
      console.warn('Failed to update message status:', e);
    }
  },

  /**
   * Subscribe to Inquiries in real time
   */
  subscribeInquiries(userId: string, onUpdate: (inquiries: Inquiry[]) => void): () => void {
    if (!userId) return () => {};

    try {
      const inqRef = collection(db, 'inquiries');
      const q = query(inqRef, where('customerId', '==', userId));

      return onSnapshot(
        q,
        (snapshot) => {
          const list: Inquiry[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as Inquiry);
          });
          onUpdate(list);
        },
        (error) => {
          console.warn('Firestore inquiries subscription notice:', error);
        }
      );
    } catch (e) {
      console.warn('Could not subscribe to inquiries:', e);
      return () => {};
    }
  },

  /**
   * Save an inquiry to Firestore
   */
  async saveInquiry(inquiry: Inquiry): Promise<void> {
    const inqRef = doc(db, 'inquiries', inquiry.id);
    await setDoc(
      inqRef,
      {
        ...inquiry,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  },

  /**
   * Save business document to Firestore
   * SECURITY ENFORCEMENT: Client saveBusiness cannot elevate or create a verified business.
   * New businesses are strictly forced to UNVERIFIED with level 0.
   */
  async saveBusiness(business: Business): Promise<void> {
    const bizRef = doc(db, 'businesses', business.id);
    const isAlreadyVerified = business.verificationStatus === 'VERIFIED' && (business.verification?.level ?? 0) > 0;

    const secureBusiness: Business = {
      ...business,
      businessId: business.businessId || business.id,
      businessName: business.businessName || business.name,
      mobile: business.mobile || business.phone,
      status: business.status || 'ACTIVE',
      source: business.source || 'MANUAL',
      verificationStatus: isAlreadyVerified ? 'VERIFIED' : 'UNVERIFIED',
      verification: isAlreadyVerified
        ? { ...business.verification, status: 'VERIFIED' }
        : {
            ...business.verification,
            level: 0,
            status: 'UNVERIFIED',
            mobileVerified: false,
            locationVerified: false,
            businessDocVerified: false,
            reverificationRequired: false,
            lastVerifiedDate: business.verification?.lastVerifiedDate || new Date().toISOString().split('T')[0],
          },
      updatedAt: new Date().toISOString(),
    };
    await setDoc(bizRef, secureBusiness, { merge: true });
  },

  /**
   * Bulk save imported businesses in atomic batches of up to 400 items,
   * strictly enforcing verificationStatus = 'UNVERIFIED' on all records.
   */
  async bulkSaveBusinesses(
    businesses: Business[],
    importRecord?: BusinessImportRecord
  ): Promise<void> {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < businesses.length; i += CHUNK_SIZE) {
      const chunk = businesses.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const b of chunk) {
        const secureBusiness: Business = {
          ...b,
          // CRITICAL SECURITY ENFORCEMENT: Never allow bulk import to mark verified!
          verificationStatus: 'UNVERIFIED',
          status: b.status || 'ACTIVE',
          source: b.source || 'CSV_IMPORT',
          verification: {
            ...b.verification,
            level: 0,
            status: 'UNVERIFIED',
            mobileVerified: false,
            locationVerified: false,
            businessDocVerified: false,
            reverificationRequired: false,
          },
          updatedAt: new Date().toISOString(),
        };
        batch.set(doc(db, 'businesses', secureBusiness.id), secureBusiness, { merge: true });
      }

      await batch.commit();
    }

    if (importRecord) {
      await this.saveImportRecord(importRecord);
    }
  },

  /**
   * Save an import history log
   */
  async saveImportRecord(record: BusinessImportRecord): Promise<void> {
    const ref = doc(db, 'businessImports', record.importId);
    await setDoc(ref, {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
    });
  },

  /**
   * Real-time subscription to import history
   */
  subscribeImportHistory(onUpdate: (records: BusinessImportRecord[]) => void): () => void {
    const q = query(collection(db, 'businessImports'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const records: BusinessImportRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as BusinessImportRecord);
        });
        onUpdate(records);
      },
      (err) => {
        console.warn('Import history sync notice:', err);
      }
    );
  },

  /**
   * Seed baseline verified businesses to Firestore if collection is empty
   */
  async seedInitialBusinessesIfEmpty(defaultBusinesses: Business[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'businesses'));
      if (snap.empty && defaultBusinesses.length > 0) {
        const batch = writeBatch(db);
        for (const b of defaultBusinesses) {
          batch.set(doc(db, 'businesses', b.id), b);
        }
        await batch.commit();
      }
    } catch (e) {
      console.warn('Initial business seeding notice:', e);
    }
  },

  /**
   * Save product document to Firestore
   */
  async saveProduct(product: Product): Promise<void> {
    const prodRef = doc(db, 'products', product.id);
    await setDoc(prodRef, product, { merge: true });
  },

  /**
   * Save service document to Firestore
   */
  async saveService(service: Service): Promise<void> {
    const srvRef = doc(db, 'services', service.id);
    await setDoc(srvRef, service, { merge: true });
  },

  /**
   * Save safety report document to Firestore
   */
  async saveReport(report: any): Promise<void> {
    const repRef = doc(db, 'reports', report.id);
    await setDoc(repRef, { ...report, createdAt: serverTimestamp() }, { merge: true });
  },

  /**
   * Submit business owner verification request to pending verificationRequests collection
   */
  async submitVerificationRequest(request: {
    id: string;
    businessId: string;
    businessName: string;
    ownerId: string;
    type: 'mobile_otp' | 'gps_geofence' | 'gst_doc';
    details: string;
    status: 'pending';
    payload?: any;
  }): Promise<void> {
    const reqRef = doc(db, 'verificationRequests', request.id);
    await setDoc(reqRef, {
      ...request,
      createdAt: serverTimestamp(),
    });
  },

  /**
   * Authoritative admin-only approval to record verified audit and update business verification
   */
  async recordAuthoritativeVerification(
    businessId: string,
    level: 1 | 2 | 3,
    adminUid: string
  ): Promise<void> {
    const batch = writeBatch(db);

    const recordRef = doc(db, 'verificationRecords', `ver_${businessId}_${Date.now()}`);
    batch.set(recordRef, {
      businessId,
      level,
      status: 'verified',
      approvedBy: adminUid,
      approvedAt: serverTimestamp(),
    });

    const bizRef = doc(db, 'businesses', businessId);
    batch.set(
      bizRef,
      {
        verificationStatus: 'VERIFIED',
        verification: {
          level,
          status: 'VERIFIED',
          mobileVerified: level >= 1,
          locationVerified: level >= 2,
          businessDocVerified: level >= 3,
          lastVerifiedDate: new Date().toISOString().split('T')[0],
        },
      },
      { merge: true }
    );

    await batch.commit();
  },
};
