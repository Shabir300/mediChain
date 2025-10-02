
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
  updateOrderStatus: (orderId: string, status: 'approved' | 'declined') => void;
  updateProductStock: (productId: string, newStock: number) => void;
  addProduct: (product: Omit<Product, 'id' | 'image' | 'description'>) => void;
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
                    image: 'medicine-1', // default image
                    description: 'Newly added product'
                },
                ...state.pharmacyProducts,
            ]
        }))
    }),
    {
      name: 'curelink-data-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
