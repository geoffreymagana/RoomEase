'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types';
import { onAuthStateChange, getDocument } from '@/lib/firebase';
import { TRUST_CONSTANTS } from '@/lib/trust';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch complete user data from Firestore
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const result = await getDocument('users', firebaseUser.uid);
      
      if (result.data) {
        return result.data as User;
      } else {
        // Create new user document if it doesn't exist
        const newUser: Omit<User, 'id'> = {
          email: firebaseUser.email || '',
          phone: firebaseUser.phoneNumber || undefined,
          name: firebaseUser.displayName || 'New User',
          avatar: '👤', // Default emoji avatar
          bio: '',
          trustScore: TRUST_CONSTANTS.INITIAL_SCORE,
          roomId: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: {
            language: 'en',
            theme: 'light',
            notifications: {
              push: true,
              email: true,
              chores: true,
              bills: true,
              shopping: true,
              trust: true
            },
            dietary: []
          },
          stats: {
            choresCompleted: 0,
            choresSkipped: 0,
            totalSpent: 0,
            trustScoreHistory: [{
              score: TRUST_CONSTANTS.INITIAL_SCORE,
              change: 0,
              reason: 'Account created',
              date: new Date()
            }],
            joinDate: new Date()
          }
        };

        // Create user document in Firestore
        const { createDocument } = await import('@/lib/firebase');
        const createResult = await createDocument('users', {
          ...newUser,
          id: firebaseUser.uid
        });

        if (createResult.error) {
          console.error('Failed to create user document:', createResult.error);
          return null;
        }

        return {
          id: firebaseUser.uid,
          ...newUser
        };
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { signOut: firebaseSignOut } = await import('@/lib/firebase');
      await firebaseSignOut();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        // User is signed out
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user document changes
  useEffect(() => {
    if (!firebaseUser) return;

    const { subscribeToDocument } = import('@/lib/firebase');
    
    subscribeToDocument.then(subscribe => {
      const unsubscribe = subscribe(
        'users',
        firebaseUser.uid,
        (userData) => {
          if (userData) {
            setUser(userData as User);
          }
        }
      );

      return () => unsubscribe();
    });
  }, [firebaseUser]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};