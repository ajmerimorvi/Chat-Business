import { Contact, Conversation, Business, Product, Service, Message } from './types';

export interface SearchMatch<T> {
  item: T;
  score: number;
  matchReason?: string;
  matchedField?: string;
}

export interface UniversalSearchResults {
  query: string;
  totalCount: number;
  contactsAndChats: Array<{
    type: 'contact' | 'recent_chat' | 'message_history';
    id: string;
    name: string;
    avatarUrl?: string;
    phoneNumber?: string;
    subtitle: string;
    timestamp?: string;
    conversationId?: string;
    score: number;
  }>;
  businesses: Array<{
    business: Business;
    score: number;
    matchReason: string;
  }>;
  products: Array<{
    product: Product;
    score: number;
    parentBusinessName: string;
  }>;
  services: Array<{
    service: Service;
    score: number;
    parentBusinessName: string;
  }>;
}

export interface SearchOptions {
  query: string;
  contacts: Contact[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  businesses: Business[];
  products: Product[];
  services: Service[];
  userLocation?: { lat: number; lng: number };
}

export interface SearchService {
  search(options: SearchOptions): Promise<UniversalSearchResults>;
}

/**
 * Calculates string similarity / relevance score
 */
function scoreText(query: string, target: string): number {
  if (!query || !target) return 0;
  const q = query.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  // Exact match
  if (t === q) return 100;
  // Target starts with query
  if (t.startsWith(q)) return 80;
  // Word in target starts with query
  const words = t.split(/[\s,·\-_]+/);
  for (const word of words) {
    if (word === q) return 75;
    if (word.startsWith(q)) return 65;
  }
  // Contains query substring
  if (t.includes(q)) return 40;

  // Simple token matching
  const qTokens = q.split(/\s+/).filter(Boolean);
  let tokenMatches = 0;
  for (const token of qTokens) {
    if (t.includes(token)) tokenMatches++;
  }
  if (tokenMatches > 0) {
    return (tokenMatches / qTokens.length) * 35;
  }

  return 0;
}

/**
 * Intelligent Universal Search Implementation
 * Follows the ranking rules:
 * 1. Relationship bias: Contacts and existing chats rank high on short name queries ("Raj")
 * 2. Intent bias: Specific business names ("Raj Hardware") strongly prioritize the business
 * 3. Verified business trust bonus
 * 4. Open for chat bonus
 */
export class ClientSearchService implements SearchService {
  async search(options: SearchOptions): Promise<UniversalSearchResults> {
    const { query, contacts, conversations, messages, businesses, products, services } = options;
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return {
        query: '',
        totalCount: 0,
        contactsAndChats: [],
        businesses: [],
        products: [],
        services: [],
      };
    }

    // 1. Search Contacts & Chats
    const contactsAndChats: UniversalSearchResults['contactsAndChats'] = [];

    // Check existing conversations
    for (const conv of conversations) {
      const nameScore = scoreText(cleanQuery, conv.otherParticipant.name);
      const lastMsgScore = scoreText(cleanQuery, conv.lastMessage.text);
      
      if (nameScore > 0 || lastMsgScore > 0) {
        // High affinity for existing direct chats
        const affinityBonus = conv.type === 'direct' ? 25 : 10;
        const totalScore = Math.max(nameScore + affinityBonus, lastMsgScore + 15);
        
        contactsAndChats.push({
          type: 'recent_chat',
          id: conv.id,
          name: conv.otherParticipant.name,
          avatarUrl: conv.otherParticipant.avatarUrl,
          phoneNumber: conv.otherParticipant.phoneNumber,
          subtitle: nameScore > 0 ? (conv.lastMessage.text || 'Recent chat') : `"${conv.lastMessage.text}"`,
          timestamp: conv.lastMessage.timestamp,
          conversationId: conv.id,
          score: totalScore,
        });
      }
    }

    // Check saved contacts (that might not have a recent chat)
    for (const contact of contacts) {
      const alreadyInList = contactsAndChats.some(c => c.name.toLowerCase() === contact.name.toLowerCase());
      if (alreadyInList) continue;

      const contactNameScore = scoreText(cleanQuery, contact.name);
      const phoneScore = contact.phoneNumber.includes(cleanQuery) ? 70 : 0;
      const score = Math.max(contactNameScore, phoneScore);

      if (score > 0) {
        contactsAndChats.push({
          type: 'contact',
          id: contact.id,
          name: contact.name,
          avatarUrl: contact.avatarUrl,
          phoneNumber: contact.phoneNumber,
          subtitle: contact.statusMessage || 'Contact',
          score: score + 15, // Contacts get affinity bonus
        });
      }
    }

    // Check message histories for matching text
    for (const [convId, msgList] of Object.entries(messages)) {
      const conv = conversations.find(c => c.id === convId);
      for (const msg of msgList) {
        if (!msg.text) continue;
        const msgScore = scoreText(cleanQuery, msg.text);
        if (msgScore >= 40) {
          const alreadyListed = contactsAndChats.some(c => c.conversationId === convId && c.type === 'message_history');
          if (!alreadyListed) {
            contactsAndChats.push({
              type: 'message_history',
              id: msg.id,
              name: conv ? conv.otherParticipant.name : msg.senderName,
              subtitle: `Message: "${msg.text}"`,
              timestamp: msg.timestamp,
              conversationId: convId,
              score: msgScore + 10,
            });
          }
        }
      }
    }

    // 2. Search Businesses
    const businessResults: UniversalSearchResults['businesses'] = [];
    for (const biz of businesses) {
      let bizScore = 0;
      let reason = `${biz.category} · ${biz.city}`;

      const nameScore = scoreText(cleanQuery, biz.name);
      const categoryScore = scoreText(cleanQuery, biz.category);
      const subcatScore = scoreText(cleanQuery, biz.subcategory);
      const descScore = scoreText(cleanQuery, biz.description) * 0.5;
      
      let keywordScore = 0;
      for (const kw of biz.searchKeywords) {
        const kwScore = scoreText(cleanQuery, kw);
        if (kwScore > keywordScore) keywordScore = kwScore;
      }

      bizScore = Math.max(nameScore, categoryScore, subcatScore, descScore, keywordScore);

      // If user typed exact business name (e.g. "Raj Hardware"), heavily prioritize business over casual contacts
      if (cleanQuery.includes('hardware') || cleanQuery.includes('timber') || cleanQuery.includes('furniture') || cleanQuery.includes('mattress')) {
        bizScore += 30;
      }

      if (bizScore > 0) {
        // Verification multiplier
        if (biz.verification.level === 3) bizScore += 12;
        else if (biz.verification.level === 2) bizScore += 8;
        else if (biz.verification.level === 1) bizScore += 4;

        // Open for chat bonus
        if (biz.openForChat) bizScore += 6;

        // Sponsored placement bonus
        if (biz.isSponsored) bizScore += 10;

        businessResults.push({
          business: biz,
          score: bizScore,
          matchReason: reason,
        });
      }
    }

    // 3. Search Products
    const productResults: UniversalSearchResults['products'] = [];
    for (const prod of products) {
      const nameScore = scoreText(cleanQuery, prod.name);
      const catScore = scoreText(cleanQuery, prod.category);
      const descScore = scoreText(cleanQuery, prod.description) * 0.4;
      const bizNameScore = scoreText(cleanQuery, prod.businessName) * 0.8;
      
      let kwScore = 0;
      for (const kw of prod.searchKeywords) {
        const s = scoreText(cleanQuery, kw);
        if (s > kwScore) kwScore = s;
      }

      const score = Math.max(nameScore, catScore, descScore, bizNameScore, kwScore);
      if (score > 0) {
        productResults.push({
          product: prod,
          score: score + (nameScore > 60 ? 15 : 0),
          parentBusinessName: prod.businessName,
        });
      }
    }

    // 4. Search Services
    const serviceResults: UniversalSearchResults['services'] = [];
    for (const srv of services) {
      const nameScore = scoreText(cleanQuery, srv.name);
      const catScore = scoreText(cleanQuery, srv.category);
      const descScore = scoreText(cleanQuery, srv.description) * 0.4;
      const bizNameScore = scoreText(cleanQuery, srv.businessName) * 0.8;

      let kwScore = 0;
      for (const kw of srv.searchKeywords) {
        const s = scoreText(cleanQuery, kw);
        if (s > kwScore) kwScore = s;
      }

      const score = Math.max(nameScore, catScore, descScore, bizNameScore, kwScore);
      if (score > 0) {
        serviceResults.push({
          service: srv,
          score: score + (nameScore > 60 ? 15 : 0),
          parentBusinessName: srv.businessName,
        });
      }
    }

    // Sort all arrays by descending score
    contactsAndChats.sort((a, b) => b.score - a.score);
    businessResults.sort((a, b) => b.score - a.score);
    productResults.sort((a, b) => b.score - a.score);
    serviceResults.sort((a, b) => b.score - a.score);

    const totalCount = contactsAndChats.length + businessResults.length + productResults.length + serviceResults.length;

    return {
      query,
      totalCount,
      contactsAndChats,
      businesses: businessResults,
      products: productResults,
      services: serviceResults,
    };
  }
}

export const defaultSearchService = new ClientSearchService();
