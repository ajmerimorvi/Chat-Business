import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Sampark Storage Architecture
 *
 * Stores media files in Google Cloud Storage:
 * - Public: Business Logos, Cover Photos, Product Catalog Images
 * - Protected: Verification Documents (GSTIN, Shop Act)
 * - Encrypted/Private: In-chat Photos and Audio Voice Notes
 */

export async function uploadBusinessPhoto(
  businessId: string,
  type: 'logo' | 'cover',
  file: File | Blob
): Promise<string> {
  const extension = file.type.split('/')[1] || 'jpg';
  const storagePath = `businesses/${businessId}/${type}_${Date.now()}.${extension}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: { businessId, type }
  });

  return await getDownloadURL(fileRef);
}

export async function uploadProductImage(
  businessId: string,
  productId: string,
  file: File | Blob
): Promise<string> {
  const extension = file.type.split('/')[1] || 'jpg';
  const storagePath = `businesses/${businessId}/products/${productId}_${Date.now()}.${extension}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: { businessId, productId }
  });

  return await getDownloadURL(fileRef);
}

export async function uploadVerificationDocument(
  businessId: string,
  documentType: 'gstin' | 'shop_act' | 'pan',
  file: File | Blob
): Promise<string> {
  // Stored in private directory restricted by security rules
  const extension = file.type.includes('pdf') ? 'pdf' : 'jpg';
  const storagePath = `businesses/${businessId}/verifications/${documentType}_${Date.now()}.${extension}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType: file.type || 'application/pdf',
    customMetadata: { businessId, documentType }
  });

  return await getDownloadURL(fileRef);
}

export async function uploadChatMedia(
  conversationId: string,
  file: File | Blob,
  mediaType: 'image' | 'voice'
): Promise<string> {
  const extension = mediaType === 'voice' ? 'm4a' : 'jpg';
  const storagePath = `conversations/${conversationId}/media/${Date.now()}_${mediaType}.${extension}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType: file.type || (mediaType === 'voice' ? 'audio/m4a' : 'image/jpeg'),
    customMetadata: { conversationId, mediaType }
  });

  return await getDownloadURL(fileRef);
}
