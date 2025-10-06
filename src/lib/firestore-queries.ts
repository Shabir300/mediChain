import {
    usersCollection,
    appointments,
    medicines,
    orders,
    medicalRecords,
  } from './firestore';
  import { query, where, getDocs, collection } from 'firebase/firestore';
  import { db } from '../config/firebase';
  
  export const searchDoctorsInFirestore = async (filters: any) => {
    let q = collection(db, 'users');
  
    const queryConstraints = [where('role', '==', 'doctor')];
  
    if (filters.specialization) {
      queryConstraints.push(where('doctorData.specialization', '==', filters.specialization));
    }
  
    if(filters.minRating) {
        queryConstraints.push(where('doctorData.rating', '>=', filters.minRating))
    }
  
    // Note: Firestore does not support geo queries out of the box.
    // This would require a more complex solution with Geohashes or a third-party service like Algolia.
    // For now, we'll filter by a general location if provided.
    if (filters.location) {
        queryConstraints.push(where('location', '==', filters.location));
    }
  
    const finalQuery = query(q, ...queryConstraints);
    const snapshot = await getDocs(finalQuery);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  };
  
  export const searchMedicinesInFirestore = async (queryString: string, filters: any) => {
    const q = query(
      medicines.collectionRef,
      where('name', '>=', queryString),
      where('name', '<=', queryString + '\uf8ff')
    );
  
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  };
  
  export const getPatientAppointments = async (patientId: string, filter: string) => {
    let q;
    switch (filter) {
      case 'upcoming':
        q = query(
          appointments.collectionRef,
          where('patientId', '==', patientId),
          where('date', '>=', new Date())
        );
        break;
      case 'past':
        q = query(
          appointments.collectionRef,
          where('patientId', '==', patientId),
          where('date', '<', new Date())
        );
        break;
      default:
        q = query(appointments.collectionRef, where('patientId', '==', patientId));
    }
  
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  };
  
  export const getOrderFromFirestore = async (patientId: string, orderId?: string, amount?: number) => {
    if (orderId) {
      return orders.getById(orderId);
    }
    if (amount) {
        const q = query(orders.collectionRef, where('patientId', '==', patientId), where('totalAmount', '==', amount));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    }
    return [];
  };
  
  export const searchHospitalsInFirestore = async (filters: any) => {
    const q = query(
        collection(db, 'users'),
        where('role', '==', 'hospital'),
        where('hospitalData.facilities', 'array-contains-any', filters.facilities)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  };
  
  export const getPatientMedicalRecords = async (patientId: string) => {
    return medicalRecords.query('patientId', patientId);
  };
  