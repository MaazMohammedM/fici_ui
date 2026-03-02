import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider, type User, type UserCredential } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, setDoc, deleteDoc, serverTimestamp, startAfter, Timestamp, writeBatch, onSnapshot, arrayUnion, type DocumentData, type CollectionReference, type Query } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes, uploadString, deleteObject, listAll } from 'firebase/storage';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key-here",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "your-measurement-id"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Connect to emulator for local development
// if (import.meta.env.DEV) {
//   connectFunctionsEmulator(functions, "127.0.0.1", 5001)
// }

// Export Google Auth provider
export const googleProvider = new GoogleAuthProvider()

// Export auth functions
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getAuth
}

// Export auth types
export type { User, UserCredential }

// Export firestore functions
export {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  arrayUnion
}

// Export storage functions
export {
  ref,
  getDownloadURL,
  uploadBytes,
  uploadString,
  deleteObject,
  getStorage,
  listAll
}

// Export functions
export {
  httpsCallable,
  getFunctions
}

// Export types
export type { DocumentData, CollectionReference, Query }
