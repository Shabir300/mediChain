
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  User,
  Appointment,
  MedicalRecord,
  Medicine,
  Order,
  Notification,
} from '../types';

// User collection helpers
const usersCollection = collection(db, 'users');

export const addUser = (uid: string, data: Omit<User, 'uid'>) => {
    return setDoc(doc(db, 'users', uid), data);
};

export const getUser = async (uid: string): Promise<User | null> => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  return docSnap.exists() ? ({ uid, ...docSnap.data() } as User) : null;
};

export const updateUser = async (uid: string, data: Partial<User>) => {
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, { ...data, updatedAt: Timestamp.now() });
};


// Generic collection helpers
const createCollection = <T = any>(collectionName: string) => {
  const collectionRef = collection(db, collectionName);

  return {
    add: (data: Omit<T, 'id'>) => addDoc(collectionRef, data),
    getAll: async (): Promise<(T & { id: string })[]> => {
      const snapshot = await getDocs(collectionRef);
      return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as T & { id: string }));
    },
    getById: async (id: string): Promise<(T & { id: string }) | null> => {
      const docSnap = await getDoc(doc(collectionRef, id));
      return docSnap.exists() ? ({ ...docSnap.data(), id: docSnap.id } as T & { id: string }) : null;
    },
    update: (id: string, data: Partial<T>) => updateDoc(doc(collectionRef, id), data),
    delete: (id: string) => deleteDoc(doc(collectionRef, id)),
    query: async (field: keyof T, value: any): Promise<(T & { id: string })[]> => {
        const q = query(collectionRef, where(field as string, '==', value));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as T & { id: string }));
    }
  };
};

export const appointments = createCollection<Appointment>('appointments');
export const medicalRecords = createCollection<MedicalRecord>('medical_records');
export const medicines = createCollection<Medicine>('medicines');
export const orders = createCollection<Order>('orders');
export const notifications = createCollection<Notification>('notifications');