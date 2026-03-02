// Firebase Conversion Utilities
// Helper functions to convert Supabase-style code to Firebase-style APIs

import { db, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from './firebase';
import { ref, getDownloadURL, uploadBytes, deleteObject, getStorage, listAll } from './firebase';
import { httpsCallable, functions } from './firebase';

// Storage operations
export const firebaseStorageUpload = async (filePath: string, file: File, contentType?: string) => {
  const storageRef = ref(getStorage(), filePath);
  const snapshot = await uploadBytes(storageRef, file, { contentType });
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

export const firebaseStorageDelete = async (filePath: string) => {
  const storageRef = ref(getStorage(), filePath);
  await deleteObject(storageRef);
};

export const firebaseStorageList = async (folderPath: string) => {
  const storageRef = ref(getStorage(), folderPath);
  const result = await listAll(storageRef);
  return result.items.map(item => ({
    name: item.name,
    fullPath: item.fullPath
  }));
};

// Database operations
export const firebaseCollection = (collectionName: string) => collection(db, collectionName);

export const firebaseDoc = (collectionName: string, docId: string) => doc(db, collectionName, docId);

export const firebaseGetDoc = async (collectionName: string, docId: string) => {
  const docRef = firebaseDoc(collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const firebaseGetDocs = async (collectionName: string, queryConstraints?: unknown) => {
  const q = queryConstraints ? query(firebaseCollection(collectionName), queryConstraints as any) : firebaseCollection(collectionName);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const firebaseAddDoc = async (collectionName: string, data: Record<string, unknown>) => {
  const docRef = await addDoc(firebaseCollection(collectionName), data);
  return { id: docRef.id, ...data };
};

export const firebaseUpdateDoc = async (collectionName: string, docId: string, data: Record<string, unknown>) => {
  const docRef = firebaseDoc(collectionName, docId);
  await updateDoc(docRef, data);
  return { id: docRef.id, ...data };
};

export const firebaseDeleteDoc = async (collectionName: string, docId: string) => {
  const docRef = firebaseDoc(collectionName, docId);
  await deleteDoc(docRef);
  return true;
};

// Function operations
export const firebaseFunction = (functionName: string) => httpsCallable(functions, functionName);

// Common patterns for conversion
export const SUPABASE_TO_FIREBASE_PATTERNS = {
  // Supabase: supabase.from('table').select('*') → Firebase: getDocs(query(collection(db, 'table')))
  'from': (table: string) => firebaseCollection(table),
  'select': (columns: string) => (q: unknown) => {
    const cols = columns.split(',');
    const selectors = cols.reduce((acc, col) => ({ ...acc, [col.trim()]: true }), {} as Record<string, boolean>);
    return query(q as any, ...Object.keys(selectors).map(key => where(key, '==', true)));
  },
  'eq': (column: string, value: unknown) => (q: unknown) => query(q as any, where(column, '==', value)),
  'neq': (column: string, value: unknown) => (q: unknown) => query(q as any, where(column, '!=', value)),
  'in': (column: string, values: unknown[]) => (q: unknown) => query(q as any, where(column, 'in', values)),
  'order': (column: string, direction: 'asc' | 'desc') => (q: unknown) => query(q as any, orderBy(column, direction)),
  'limit': (count: number) => (q: unknown) => query(q as any, limit(count)),
  'ilike': (column: string, value: string) => (q: unknown) => query(q as any, where(column, '>=', value)),
  'not': (column: string, value: unknown) => (q: unknown) => query(q as any, where(column, '!=', value)),
  'is': (column: string, value: unknown) => (q: unknown) => query(q as any, where(column, '==', value)),
  'single': () => (q: unknown) => query(q as any, limit(1)),
  
  // Storage patterns
  'storage': {
    'upload': (file: File, path: string, options?: { contentType?: string }) => firebaseStorageUpload(path, file, options?.contentType),
    'delete': (path: string) => firebaseStorageDelete(path),
    'list': (path: string) => firebaseStorageList(path),
    'getDownloadURL': (path: string) => getDownloadURL(ref(getStorage(), path))
  },
  
  // Function patterns
  'functions': {
    'invoke': (functionName: string, data?: Record<string, unknown>) => firebaseFunction(functionName)(data)
  }
} as const;
