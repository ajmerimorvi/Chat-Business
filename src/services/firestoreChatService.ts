import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Conversation, Message, Inquiry, Business, Product, Service } from '../domain/types';

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
   * Send a message to Firestore and update the parent conversation's last message metadata.
   */
  async sendMessage(conversationId: string, message: Message, conversationPayload?: Partial<Conversation>): Promise<void> {
    try {
      // 1. Ensure conversation exists in Firestore
      const convRef = doc(db, 'conversations', conversationId);
      if (conversationPayload) {
        await setDoc(
          convRef,
          {
            ...conversationPayload,
            id: conversationId,
            lastMessageText: message.text || (message.type === 'image' ? '📷 Photo' : 'Voice note'),
            lastMessageTimestamp: message.timestamp,
            lastMessageStatus: message.status,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(
          convRef,
          {
            lastMessageText: message.text || (message.type === 'image' ? '📷 Photo' : 'Voice note'),
            lastMessageTimestamp: message.timestamp,
            lastMessageStatus: message.status,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // 2. Add message to the conversation's subcollection
      const msgRef = doc(db, 'conversations', conversationId, 'messages', message.id);
      await setDoc(msgRef, {
        ...message,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to send message to Firestore:', e);
      throw e;
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
    try {
      const inqRef = doc(db, 'inquiries', inquiry.id);
      await setDoc(inqRef, {
        ...inquiry,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Failed saving inquiry to Firestore:', e);
    }
  },

  /**
   * Save business document to Firestore
   */
  async saveBusiness(business: Business): Promise<void> {
    try {
      const bizRef = doc(db, 'businesses', business.id);
      await setDoc(bizRef, business, { merge: true });
    } catch (e) {
      console.warn('Failed saving business to Firestore:', e);
    }
  },
};
