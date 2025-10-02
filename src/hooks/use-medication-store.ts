
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Medication {
  id: string;
  name: string;
  time: string; // HH:MM format
}

interface MedicationState {
  medications: Medication[];
  addMedication: (med: Medication) => void;
  removeMedication: (id: string) => void;
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set) => ({
      medications: [
        // Default medication for demo purposes
        { id: 'med-default', name: 'Paracetamol', time: new Date(Date.now() + 65 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
      ],
      addMedication: (med) =>
        set((state) => ({ medications: [...state.medications, med] })),
      removeMedication: (id) =>
        set((state) => ({
          medications: state.medications.filter((med) => med.id !== id),
        })),
    }),
    {
      name: 'curelink-medication-storage', // name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // use localStorage
    }
  )
);
