import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  writeBatch, 
  getDocs,
  type Unsubscribe
} from 'firebase/firestore';

export interface BusEntry {
  busNumber: string;
  timestamp: string;
}

export interface BusdleTemplate {
  date: string;
  busOrder: string[];
  uniqueBusCount: number;
}

export interface BusLogData {
  [date: string]: BusEntry[];
}

// Bus log operations
export const saveBusLog = async (date: string, entries: BusEntry[]): Promise<void> => {
  try {
    await setDoc(doc(db, 'busLogs', date), { entries, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Error saving bus log:', error);
    throw error;
  }
};

export const getBusLog = async (date: string): Promise<BusEntry[]> => {
  try {
    const docSnap = await getDoc(doc(db, 'busLogs', date));
    return docSnap.exists() ? docSnap.data().entries || [] : [];
  } catch (error) {
    console.error('Error getting bus log:', error);
    return [];
  }
};

export const getAllBusLogs = async (): Promise<BusLogData> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'busLogs'));
    const allLogs: BusLogData = {};
    
    querySnapshot.forEach((doc) => {
      allLogs[doc.id] = doc.data().entries || [];
    });
    
    return allLogs;
  } catch (error) {
    console.error('Error getting all bus logs:', error);
    return {};
  }
};

export const subscribeToBusLog = (date: string, callback: (entries: BusEntry[]) => void): Unsubscribe => {
  return onSnapshot(doc(db, 'busLogs', date), (doc) => {
    callback(doc.exists() ? doc.data()?.entries || [] : []);
  }, (error) => {
    console.error('Error in bus log subscription:', error);
  });
};

// Busdle template operations
export const saveBusdleTemplate = async (date: string, template: BusdleTemplate): Promise<void> => {
  try {
    await setDoc(doc(db, 'busdleTemplates', date), { 
      ...template, 
      lastUpdated: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error saving busdle template:', error);
    throw error;
  }
};

export const clearBusdleTemplate = async (date: string): Promise<void> => {
  try {
    const docRef = doc(db, 'busdleTemplates', date);
    await setDoc(docRef, { deleted: true, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Error clearing busdle template:', error);
    throw error;
  }
};

export const getBusdleTemplate = async (date: string): Promise<BusdleTemplate | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'busdleTemplates', date));
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Check if the template was deleted
      if (data.deleted) {
        return null;
      }
      return {
        date: data.date,
        busOrder: data.busOrder,
        uniqueBusCount: data.uniqueBusCount
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting busdle template:', error);
    return null;
  }
};

export const subscribeToBusdleTemplate = (date: string, callback: (template: BusdleTemplate | null) => void): Unsubscribe => {
  return onSnapshot(doc(db, 'busdleTemplates', date), (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      // Check if the template was deleted
      if (data.deleted) {
        callback(null);
      } else {
        callback({
          date: data.date,
          busOrder: data.busOrder,
          uniqueBusCount: data.uniqueBusCount
        });
      }
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in busdle template subscription:', error);
  });
};

// Utility functions for adding/removing individual bus entries
export const addBusEntry = async (date: string, entry: BusEntry): Promise<void> => {
  const currentEntries = await getBusLog(date);
  currentEntries.push(entry);
  await saveBusLog(date, currentEntries);
};

export const removeBusEntry = async (date: string, index: number): Promise<BusEntry | null> => {
  const currentEntries = await getBusLog(date);
  if (index >= 0 && index < currentEntries.length) {
    const removedEntry = currentEntries.splice(index, 1)[0];
    await saveBusLog(date, currentEntries);
    return removedEntry;
  }
  return null;
};

export const undoLastBusEntry = async (date: string): Promise<BusEntry | null> => {
  const currentEntries = await getBusLog(date);
  if (currentEntries.length > 0) {
    const removedEntry = currentEntries.pop()!;
    await saveBusLog(date, currentEntries);
    return removedEntry;
  }
  return null;
};

export const clearBusLog = async (date: string): Promise<void> => {
  await saveBusLog(date, []);
};

export const clearAllBusData = async (): Promise<void> => {
  try {
    const busLogsSnapshot = await getDocs(collection(db, 'busLogs'));
    const busdleTemplatesSnapshot = await getDocs(collection(db, 'busdleTemplates'));
    
    const batch = writeBatch(db);
    
    busLogsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    busdleTemplatesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error clearing all bus data:', error);
    throw error;
  }
};

// Migration function to move localStorage data to Firebase
export const migrateLocalStorageToFirebase = async (): Promise<void> => {
  try {
    const busLogData = JSON.parse(localStorage.getItem('busLog') || '{}');
    const busdleData = JSON.parse(localStorage.getItem('busdleTemplates') || '{}');
    
    const batch = writeBatch(db);
    
    // Migrate bus logs
    for (const [date, entries] of Object.entries(busLogData)) {
      if (Array.isArray(entries) && entries.length > 0) {
        batch.set(doc(db, 'busLogs', date), { 
          entries, 
          lastUpdated: new Date().toISOString(),
          migratedFrom: 'localStorage'
        });
      }
    }
    
    // Migrate busdle templates
    for (const [date, template] of Object.entries(busdleData)) {
      if (template && typeof template === 'object') {
        batch.set(doc(db, 'busdleTemplates', date), { 
          ...template as BusdleTemplate, 
          lastUpdated: new Date().toISOString(),
          migratedFrom: 'localStorage'
        });
      }
    }
    
    await batch.commit();
    
    // Clear localStorage after successful migration
    localStorage.removeItem('busLog');
    localStorage.removeItem('busdleTemplates');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Check if Firebase is properly configured
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Just check if we can initialize a reference - doesn't actually read data
    // This tests if Firebase config is valid without requiring permissions
    const testRef = doc(db, 'busLogs', 'connection-test');
    
    // Try a simple read operation to test permissions
    await getDoc(testRef);
    return true;
  } catch (error: any) {
    console.error('Firebase connection failed:', error);
    
    // If it's a permissions error, Firebase is configured but rules need fixing
    if (error?.code === 'permission-denied') {
      console.log('🔥 Firebase is configured but permissions need to be set up');
      // Return false so we fall back to localStorage until rules are fixed
      return false;
    }
    
    // Other errors indicate configuration issues
    return false;
  }
};
