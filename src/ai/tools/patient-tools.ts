
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import type { Doctor, Appointment, Order } from '@/lib/types';


export const findAvailableDoctors = ai.defineTool(
  {
    name: 'findAvailableDoctors',
    description: 'Finds available doctors based on a medical specialty.',
    inputSchema: z.object({
      specialty: z.string().describe('The medical specialty to search for (e.g., Cardiologist, Pediatrician, Dermatologist).'),
    }),
    outputSchema: z.array(z.object({
        name: z.string(),
        specialty: z.string(),
    })),
  },
  async ({specialty}) => {
    const { firestore } = initializeFirebase();
    const doctorsRef = collection(firestore, 'doctors');
    const q = query(doctorsRef, where('specialty', '==', specialty), where('availability', '==', 'Online'));
    const snapshot = await getDocs(q);
    const doctors = snapshot.docs.map(doc => doc.data() as Doctor);
    return doctors.map(doctor => ({ name: doctor.fullName, specialty: doctor.specialty }));
  }
);


export const getBudgetAndSpending = ai.defineTool(
    {
        name: 'getBudgetAndSpending',
        description: "Calculates the patient's total spending on doctor appointments and pharmacy orders.",
        inputSchema: z.object({
            patientId: z.string().describe("The UID of the patient to fetch spending for.")
        }),
        outputSchema: z.object({
            totalSpending: z.number(),
            doctorSpending: z.number(),
            pharmacySpending: z.number(),
        })
    },
    async ({ patientId }) => {
        const { firestore } = initializeFirebase();
        
        const appointmentsRef = collection(firestore, 'patients', patientId, 'appointments');
        const ordersRef = collection(firestore, 'patients', patientId, 'orders');

        const appointmentsSnap = await getDocs(appointmentsRef);
        const ordersSnap = await getDocs(ordersRef);

        const appointments = appointmentsSnap.docs.map(doc => doc.data() as Appointment);
        const orders = ordersSnap.docs.map(doc => doc.data() as Order);

        const totalDoctorSpending = appointments.reduce((sum, apt) => sum + apt.cost, 0);
        const totalPharmacySpending = orders.filter(o => o.status === 'approved').reduce((sum, order) => sum + order.total, 0);
        const totalSpending = totalDoctorSpending + totalPharmacySpending;
        
        return {
            totalSpending,
            doctorSpending: totalDoctorSpending,
            pharmacySpending: totalPharmacySpending,
        }
    }
);


export const getActiveMedications = ai.defineTool(
    {
        name: 'getActiveMedications',
        description: 'Retrieves the list of the patient\'s active medications and their reminder times.',
        inputSchema: z.object({}),
        outputSchema: z.array(z.object({
            name: z.string(),
            time: z.string(),
        }))
    },
    async () => {
        // This tool now depends on the flow passing the medication data in the context.
        // It's a placeholder to demonstrate the tool being available.
        // The actual data will be injected into the prompt from the client.
        // In a real app, this would query a database.
        return Promise.resolve([]);
    }
);

export const getMedicalRecordSummary = ai.defineTool(
    {
        name: 'getMedicalRecordSummary',
        description: 'Simulates reading a specific medical record file and returns a summary of its content.',
        inputSchema: z.object({
            fileName: z.string().describe('The name of the file to summarize, e.g., "blood_test_results.pdf"')
        }),
        outputSchema: z.object({
            summary: z.string()
        })
    },
    async ({ fileName }) => {
        // This is a simulation. In a real app, this would involve a service
        // that can parse PDF content and summarize it.
        if (fileName.toLowerCase().includes('blood_test')) {
            return { summary: "The blood test results from July 10th show that all levels are within the normal range. Cholesterol is slightly elevated, and it's recommended to follow up with a dietary consultation."};
        }
        if (fileName.toLowerCase().includes('xray')) {
            return { summary: "The chest x-ray from June 22nd shows clear lungs with no signs of pneumonia or other abnormalities."};
        }

        return { summary: `I don't have specific details for the file named '${fileName}', but it was uploaded and is part of your record.`}
    }
);
