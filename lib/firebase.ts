import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator,
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  DocumentReference,
  Query,
  Unsubscribe
} from 'firebase/firestore';
import { 
  getStorage, 
  Storage, 
  connectStorageEmulator,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask
} from 'firebase/storage';
import { 
  getMessaging, 
  Messaging, 
  getToken, 
  onMessage,
  MessagePayload
} from 'firebase/messaging';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: Storage = getStorage(app);

// Initialize Firebase Cloud Messaging (only on client side)
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase messaging not available:', error);
  }
}

export { messaging };

// Initialize Functions
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.warn('Failed to connect to emulators:', error);
  }
}

// Authentication helpers
export const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Phone authentication helpers
export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    }
  });
};

export const sendSMSVerification = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ confirmationResult: ConfirmationResult | null; error: string | null }> => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return { confirmationResult, error: null };
  } catch (error: any) {
    return { confirmationResult: null, error: error.message };
  }
};

export const verifySMSCode = async (
  confirmationResult: ConfirmationResult, 
  code: string
) => {
  try {
    const result = await confirmationResult.confirm(code);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};

// Firestore helpers
export const createDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Document not found' };
    }
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const getDocuments = async (
  collectionName: string, 
  conditions?: { field: string; operator: any; value: any }[],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
) => {
  try {
    let q = collection(db, collectionName) as Query;
    
    if (conditions) {
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
    }
    
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { data: documents, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
};

// Real-time listeners
export const subscribeToDocument = (
  collectionName: string, 
  docId: string, 
  callback: (data: any) => void
): Unsubscribe => {
  return onSnapshot(doc(db, collectionName, docId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

export const subscribeToCollection = (
  collectionName: string,
  callback: (data: any[]) => void,
  conditions?: { field: string; operator: any; value: any }[],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Unsubscribe => {
  let q = collection(db, collectionName) as Query;
  
  if (conditions) {
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });
  }
  
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  });
};

// Batch operations
export const batchWrite = async (operations: Array<{
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}>) => {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(operation => {
      const docRef = operation.id 
        ? doc(db, operation.collection, operation.id)
        : doc(collection(db, operation.collection));
      
      switch (operation.type) {
        case 'create':
          batch.set(docRef, {
            ...operation.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...operation.data,
            updatedAt: serverTimestamp()
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });
    
    await batch.commit();
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Transaction helper
export const runFirestoreTransaction = async (
  callback: (transaction: any) => Promise<any>
) => {
  try {
    const result = await runTransaction(db, callback);
    return { data: result, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Storage helpers
export const uploadFile = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const storageRef = ref(storage, path);
    
    if (onProgress) {
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            resolve({ url: null, error: error.message });
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ url: downloadURL, error: null });
            } catch (error: any) {
              resolve({ url: null, error: error.message });
            }
          }
        );
      });
    } else {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return { url: downloadURL, error: null };
    }
  } catch (error: any) {
    return { url: null, error: error.message };
  }
};

export const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Push notification helpers
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Failed to get notification token:', error);
    return null;
  }
};

export const onMessageListener = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, callback);
};

// Utility functions
export const generateRoomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatFirestoreDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  return new Date(timestamp);
};

export default app;