import { Conversation, Message, Business, Product, Service, Inquiry, Contact } from '../domain/types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'sampark_conversations_v3',
  MESSAGES: 'sampark_messages_v3',
  BUSINESSES: 'sampark_businesses_v3',
  PRODUCTS: 'sampark_products_v3',
  SERVICES: 'sampark_services_v3',
  INQUIRIES: 'sampark_inquiries_v3',
  CONTACTS: 'sampark_contacts_v3',
};

/**
 * Production Local Cache
 * Only serves as offline cache for Firestore data, never defaults to fake or demo state.
 */
export const localDb = {
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveConversations(convs: Conversation[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
    } catch (e) {
      console.warn('Failed saving conversations to cache', e);
    }
  },

  getMessages(): Record<string, Message[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },
  saveMessages(msgs: Record<string, Message[]>) {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs));
    } catch (e) {
      console.warn('Failed saving messages to cache', e);
    }
  },

  getBusinesses(): Business[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveBusinesses(b: Business[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(b));
    } catch (e) {
      console.warn('Failed saving businesses to cache', e);
    }
  },

  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveProducts(p: Product[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(p));
    } catch (e) {
      console.warn('Failed saving products to cache', e);
    }
  },

  getServices(): Service[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveServices(s: Service[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed saving services to cache', e);
    }
  },

  getInquiries(): Inquiry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveInquiries(inq: Inquiry[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inq));
    } catch (e) {
      console.warn('Failed saving inquiries to cache', e);
    }
  },

  getContacts(): Contact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveContacts(c: Contact[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(c));
    } catch (e) {
      console.warn('Failed saving contacts to cache', e);
    }
  },
};
