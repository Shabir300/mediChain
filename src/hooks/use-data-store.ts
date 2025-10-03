
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
    Appointment, 
    Order, 
    MedicalRecord, 
    Patient,
    Review,
    Product,
    Doctor,
    appointments as initialAppointments,
    orders as initialOrders,
    medicalRecords as initialMedicalRecords,
    patients as initialPatients,
    reviews as initialReviews,
    pharmacyProducts as initialPharmacyProducts,
    doctors as initialDoctors,
} from '@/lib/data';

export interface DataState {
  appointments: Appointment[];
  orders: Order[];
  medicalRecords: MedicalRecord[];
  patients: Patient[];
  reviews: Review[];
  pharmacyProducts: Product[];
  doctors: Doctor[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status' | 'patientName'>) => void;
  addOrder: (order: Omit<Order, 'id' | 'patientName'>) => void;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id'>) => void;
  removeMedicalRecord: (recordId: string) => void;
  updateOrderStatus: (orderId: string, status: 'approved' | 'declined') => void;
  updateProductStock: (productId: string, newStock: number) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updatedProduct: Product) => void;
  addDoctor: (doctor: Omit<Doctor, 'id' | 'location' | 'availability' | 'rating' | 'name'> & { fullName: string }) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      appointments: initialAppointments,
      orders: initialOrders,
      medicalRecords: initialMedicalRecords,
      patients: initialPatients,
      reviews: initialReviews,
      pharmacyProducts: initialPharmacyProducts,
      doctors: initialDoctors,

      addAppointment: (appointment) =>
        set((state) => ({
          appointments: [
            ...state.appointments,
            {
              ...appointment,
              id: `apt-${Date.now()}`,
              patientName: 'Demo Patient',
              status: 'booked',
            },
          ],
        })),
      
      addOrder: (order) => 
        set((state) => ({
            orders: [
                {
                    ...order,
                    id: `ord-${Date.now()}`,
                    patientName: 'Demo Patient',
                },
                ...state.orders,
            ]
        })),

      addMedicalRecord: (record) =>
        set((state) => ({
            medicalRecords: [
                {
                    ...record,
                    id: `rec-${Date.now()}`,
                },
                ...state.medicalRecords,
            ]
        })),
    
      removeMedicalRecord: (recordId) =>
        set((state) => ({
            medicalRecords: state.medicalRecords.filter(record => record.id !== recordId)
        })),

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
            orders: state.orders.map(order => 
                order.id === orderId ? { ...order, status } : order
            )
        })),
    
      updateProductStock: (productId, newStock) =>
        set((state) => ({
            pharmacyProducts: state.pharmacyProducts.map(p => 
                p.id === productId ? { ...p, stock: newStock } : p
            )
        })),

      addProduct: (product) =>
        set((state) => ({
            pharmacyProducts: [
                {
                    ...product,
                    id: `prod-${Date.now()}`,
                },
                ...state.pharmacyProducts,
            ]
        })),

       updateProduct: (productId, updatedProduct) =>
        set((state) => ({
            pharmacyProducts: state.pharmacyProducts.map(p => 
                p.id === productId ? { ...p, ...updatedProduct } : p
            )
        })),
      
      addDoctor: (doctor) =>
        set((state) => ({
          doctors: [
            {
              id: `doc-${Date.now()}`,
              name: doctor.fullName,
              specialty: doctor.specialty,
              bio: doctor.bio,
              education: doctor.education,
              clinicName: doctor.clinicName,
              address: doctor.address,
              previousExperience: doctor.previousExperience,
              avatar: doctor.avatar,
              location: 'In City',
              availability: 'Online',
              rating: 4.5, // Default rating
            },
            ...state.doctors,
          ],
        })),
    }),
    {
      name: 'curelink-data-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
