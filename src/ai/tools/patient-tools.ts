
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { doctors, appointments as allAppointments, orders as allOrders } from '@/lib/data';
import { useMedicationStore } from '@/hooks/use-medication-store';


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
    // In a real app, this would query a database. Here, we filter the mock data.
    return doctors.filter(doctor => doctor.specialty.toLowerCase() === specialty.toLowerCase() && doctor.availability === 'Online');
  }
);


export const getBudgetAndSpending = ai.defineTool(
    {
        name: 'getBudgetAndSpending',
        description: "Calculates the patient's total spending on doctor appointments and pharmacy orders.",
        inputSchema: z.object({}),
        outputSchema: z.object({
            totalSpending: z.number(),
            doctorSpending: z.number(),
            pharmacySpending: z.number(),
        })
    },
    async () => {
        const totalDoctorSpending = allAppointments.reduce((sum, apt) => sum + apt.cost, 0);
        const totalPharmacySpending = allOrders.filter(o => o.status === 'approved').reduce((sum, order) => sum + order.total, 0);
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
        // Zustand hooks can't be used in server-side tools directly.
        // We will read from the initial state for this demo.
        // In a real app, this data would come from a database.
         const { medications } = useMedicationStore.getState();
         return medications;
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
