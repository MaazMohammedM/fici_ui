import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'

// Generic CRUD operations
export const firebaseCRUD = {
  // Read operations
  getDocument: (collectionName: string, docId: string) =>
    getDoc(doc(db, collectionName, docId)),
  
  getCollection: (collectionName: string, queryFn?: any) =>
    getDocs(queryFn ? queryFn(collection(db, collectionName)) : collection(db, collectionName)),
  
  // Write operations
  createDocument: (collectionName: string, data: any) =>
    addDoc(collection(db, collectionName), {
      ...data,
      created_at: serverTimestamp()
    }),
  
  updateDocument: (collectionName: string, docId: string, data: any) =>
    updateDoc(doc(db, collectionName, docId), {
      ...data,
      updated_at: serverTimestamp()
    }),
  
  deleteDocument: (collectionName: string, docId: string) =>
    deleteDoc(doc(db, collectionName, docId)),
  
  // Query builders
  where: (field: string, operator: any, value: any) => where(field, operator, value),
  orderBy: (field: string, direction?: 'asc' | 'desc') => orderBy(field, direction),
  limit: (limitCount: number) => limit(limitCount),
  startAfter: (lastDoc: any) => startAfter(lastDoc)
}

// Helper functions for common operations
export const firebaseHelpers = {
  // Convert Firebase timestamp to string
  timestampToString: (timestamp: Timestamp) => {
    return timestamp.toDate().toISOString()
  },
  
  // Convert string to Firebase timestamp
  stringToTimestamp: (dateString: string) => {
    return Timestamp.fromDate(new Date(dateString))
  },
  
  // Get document with ID included
  getDocumentWithId: async (collectionName: string, docId: string) => {
    const docSnap = await getDoc(doc(db, collectionName, docId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() as any }
    }
    return null
  },
  
  // Get collection with IDs included
  getCollectionWithIds: async (collectionName: string, queryFn?: any) => {
    const querySnap = await getDocs(queryFn ? queryFn(collection(db, collectionName)) : collection(db, collectionName))
    return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
  },
  
  // Paginated query
  getPaginatedCollection: async (collectionName: string, pageSize: number, lastDoc?: any) => {
    let q = query(collection(db, collectionName), orderBy('created_at', 'desc'), limit(pageSize))
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    
    const snapshot = await getDocs(q)
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
    const lastVisible = snapshot.docs[snapshot.docs.length - 1]
    
    return {
      documents,
      lastVisible,
      hasMore: documents.length === pageSize
    }
  }
}

export { Timestamp, serverTimestamp }
