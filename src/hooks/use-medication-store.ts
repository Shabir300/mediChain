
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
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set) => ({
      medications: [],
      addMedication: (med) =>
        set((state) => ({ medications: [...state.medications, med] })),
      removeMedication: (id) =>
        set((state) => ({
          medications: state.medications.filter((med) => med.id !== id),
        })),
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
          // Set default demo data only after hydration
          medications: state ? [
            { id: 'med-default', name: 'Paracetamol', time: new Date(Date.now() + 65 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
          ] : []
        });
      },
    }),
    {
      name: 'curelink-medication-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
            // If there's stored data, don't overwrite with default
            if (state.medications.length > 0) {
                 state.setHasHydrated(true);
            } else {
                // If storage is empty, then set default data after hydration
                state.setHasHydrated(true);
            }
        }
      },
      // Only persist the medications array
      partialize: (state) => ({ medications: state.medications }),
    }
  )
);

// This is a helper to initialize the store on the client
export const useHydratedMedicationStore = () => {
    const store = useMedicationStore();
    React.useEffect(() => {
        if (!store._hasHydrated && store.medications.length === 0) {
            useMedicationStore.getState().setHasHydrated(true);
        }
    }, [store._hasHydrated, store.medications.length]);
    return store;
}
