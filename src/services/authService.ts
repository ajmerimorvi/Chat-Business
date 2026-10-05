import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../domain/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface AuthState {
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  appUser: User | null;
  loading: boolean;
  error: string | null;
}

export async function loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    // Check if user document already exists in Firestore
    const userDocRef = doc(db, 'users', fbUser.uid);
    let existingData: any = null;

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        existingData = snap.data();
      }
    } catch (e) {
      console.warn('Could not read existing user doc from Firestore:', e);
    }

    const appUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Google User',
      phoneNumber: fbUser.phoneNumber || existingData?.phoneNumber || '+91 98250 88990',
      email: fbUser.email || undefined,
      avatarUrl: fbUser.photoURL || undefined,
      bio: existingData?.bio || 'Verified Sampark User via Google',
      language: existingData?.language || 'en',
      role: existingData?.role || 'business_owner',
      ownedBusinessIds: existingData?.ownedBusinessIds || ['biz_abc_furn'],
      staffAtBusinessIds: existingData?.staffAtBusinessIds || [],
      blockedUserIds: existingData?.blockedUserIds || [],
      blockedBusinessIds: existingData?.blockedBusinessIds || [],
      authProvider: 'google',
    };

    // Save/update user doc in Firestore
    try {
      await setDoc(
        userDocRef,
        {
          uid: fbUser.uid,
          name: appUser.name,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          phoneNumber: appUser.phoneNumber,
          role: appUser.role,
          lastLoginAt: serverTimestamp(),
          authProvider: 'google',
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not update user doc in Firestore:', err);
    }

    return { success: true, user: appUser };
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    let errorMsg = 'Google sign-in was cancelled or failed. Please try again.';
    if (error?.code === 'auth/popup-blocked') {
      errorMsg = 'Pop-up window was blocked by your browser. Please allow popups for this site.';
    } else if (error?.code === 'auth/cancelled-popup-request') {
      errorMsg = 'Sign in was cancelled.';
    } else if (error?.message) {
      errorMsg = error.message;
    }
    return { success: false, error: errorMsg };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
