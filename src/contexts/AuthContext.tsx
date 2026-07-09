"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AppUser, UserRole } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'workshops', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAppUser({
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: data.role || 'admin',
              workshopId: currentUser.uid, // Assuming owner is the workshopId for now
              name: data.name,
              employeeId: data.employeeId
            });
          } else {
            // Default fallback if doc missing
            setAppUser({
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: 'admin',
              workshopId: currentUser.uid
            });
          }
          // Sync settings from cloud when logged in
          useSettingsStore.getState().syncFromCloud(currentUser.uid);
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
