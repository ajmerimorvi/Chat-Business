import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../../domain/types';
import { loginWithGoogle, logoutUser } from '../../services/authService';

interface AuthContextType {
  currentUser: User;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isBusinessOwner: boolean;
  loginGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

// Fallback guest user while unauthenticated
const DEFAULT_USER: User = {
  id: 'guest_user',
  name: 'Sampark User',
  phoneNumber: '+91 98250 88990',
  language: 'en',
  role: 'customer',
  ownedBusinessIds: [],
  staffAtBusinessIds: [],
  blockedUserIds: [],
  blockedBusinessIds: [],
  authProvider: 'guest',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data();
            setCurrentUser({
              id: fbUser.uid,
              name: data.name || fbUser.displayName || 'Sampark User',
              phoneNumber: data.phoneNumber || fbUser.phoneNumber || '+91 98250 88990',
              email: fbUser.email || undefined,
              avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
              bio: data.bio || 'Verified Sampark User',
              language: data.language || 'en',
              role: data.role || 'business_owner',
              ownedBusinessIds: data.ownedBusinessIds || ['biz_abc_furn'],
              staffAtBusinessIds: data.staffAtBusinessIds || [],
              blockedUserIds: data.blockedUserIds || [],
              blockedBusinessIds: data.blockedBusinessIds || [],
              authProvider: 'google',
            });
          } else {
            // Create user document in Firestore on first sign-in
            const newUser: User = {
              id: fbUser.uid,
              name: fbUser.displayName || 'Sampark User',
              phoneNumber: fbUser.phoneNumber || '+91 98250 88990',
              email: fbUser.email || undefined,
              avatarUrl: fbUser.photoURL || undefined,
              bio: 'Verified Sampark Member',
              language: 'en',
              role: 'business_owner',
              ownedBusinessIds: ['biz_abc_furn'],
              staffAtBusinessIds: [],
              blockedUserIds: [],
              blockedBusinessIds: [],
              authProvider: 'google',
            };
            setCurrentUser(newUser);
            await setDoc(userDocRef, {
              ...newUser,
              createdAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (e) {
          console.warn('Error fetching Firestore user profile:', e);
          setCurrentUser({
            id: fbUser.uid,
            name: fbUser.displayName || 'Sampark User',
            email: fbUser.email || undefined,
            avatarUrl: fbUser.photoURL || undefined,
            phoneNumber: fbUser.phoneNumber || '+91 98250 88990',
            language: 'en',
            role: 'business_owner',
            ownedBusinessIds: ['biz_abc_furn'],
            staffAtBusinessIds: [],
            blockedUserIds: [],
            blockedBusinessIds: [],
            authProvider: 'google',
          });
        }
      } else {
        setCurrentUser(DEFAULT_USER);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginGoogle = async (): Promise<boolean> => {
    const res = await loginWithGoogle();
    if (res.success && res.user) {
      setCurrentUser(res.user);
      return true;
    }
    return false;
  };

  const logout = async (): Promise<void> => {
    await logoutUser();
    setCurrentUser(DEFAULT_USER);
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, updates, { merge: true });
      } catch (e) {
        console.warn('Could not persist user update to Firestore:', e);
      }
    }
  };

  const isAdmin = currentUser.role === 'admin';
  const isBusinessOwner = currentUser.role === 'business_owner' || currentUser.ownedBusinessIds.length > 0;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isAdmin,
        isBusinessOwner,
        loginGoogle,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
