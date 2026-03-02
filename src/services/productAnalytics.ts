import { db, collection, getDocs, getDoc, query, where, doc, setDoc, serverTimestamp } from '../lib/firebase';

export interface ProductVisitData {
  product_id: string;
  name: string;
  thumbnail_url?: string;
}

export const trackProductVisit = async (data: ProductVisitData) => {
  try {
    // First, try to get the existing record
    const productStatsRef = doc(db, 'product_visit_stats', data.product_id);
    const existingRecord = await getDoc(productStatsRef);

    let newCount = 1;
    if (existingRecord.exists()) {
      const existingData = existingRecord.data();
      newCount = (existingData?.visit_count || 0) + 1;
    }

    // Upsert with the correct count using setDoc
    const visitData = {
      product_id: data.product_id,
      name: data.name,
      thumbnail_url: data.thumbnail_url,
      visit_count: newCount,
      last_visited_at: serverTimestamp()
    };

    await setDoc(productStatsRef, visitData, { merge: true });
    
    return visitData;
  } catch (error) {
    console.error('Error tracking product visit:', error);
    throw error;
  }
};
