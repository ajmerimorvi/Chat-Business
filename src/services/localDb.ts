import { Conversation, Message, Business, Product, Service, Inquiry, Contact } from '../domain/types';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_BUSINESSES,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_INQUIRIES,
  INITIAL_CONTACTS,
} from '../repositories/initialData';

const STORAGE_KEYS = {
  CONVERSATIONS: 'sampark_conversations_v2',
  MESSAGES: 'sampark_messages_v2',
  BUSINESSES: 'sampark_businesses_v2',
  PRODUCTS: 'sampark_products_v2',
  SERVICES: 'sampark_services_v2',
  INQUIRIES: 'sampark_inquiries_v2',
  CONTACTS: 'sampark_contacts_v2',
};

export const localDb = {
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  },
  saveConversations(convs: Conversation[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
    } catch (e) {
      console.warn('Failed saving conversations', e);
    }
  },

  getMessages(): Record<string, Message[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return data ? JSON.parse(data) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  },
  saveMessages(msgs: Record<string, Message[]>) {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs));
    } catch (e) {
      console.warn('Failed saving messages', e);
    }
  },

  getBusinesses(): Business[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
      return data ? JSON.parse(data) : INITIAL_BUSINESSES;
    } catch {
      return INITIAL_BUSINESSES;
    }
  },
  saveBusinesses(b: Business[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(b));
    } catch (e) {
      console.warn('Failed saving businesses', e);
    }
  },

  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },
  saveProducts(p: Product[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(p));
    } catch (e) {
      console.warn('Failed saving products', e);
    }
  },

  getServices(): Service[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return data ? JSON.parse(data) : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  },
  saveServices(s: Service[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(s));
    } catch (e) {
      console.warn('Failed saving services', e);
    }
  },

  getInquiries(): Inquiry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      return data ? JSON.parse(data) : INITIAL_INQUIRIES;
    } catch {
      return INITIAL_INQUIRIES;
    }
  },
  saveInquiries(inq: Inquiry[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inq));
    } catch (e) {
      console.warn('Failed saving inquiries', e);
    }
  },

  getContacts(): Contact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      return data ? JSON.parse(data) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  },
  saveContacts(c: Contact[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(c));
    } catch (e) {
      console.warn('Failed saving contacts', e);
    }
  },
};
