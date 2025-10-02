'use server';

/**
 * @fileOverview An AI agent that consolidates a patient's medical data into a single summary.
 *
 * - getMedicalSummary - A function that returns a comprehensive medical summary.
 * - MedicalSummaryInput - The input type for the getMedicalSummary function.
 * - MedicalSummaryOutput - The return type for the getMedicalSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MedicalSummaryInputSchema = z.object({
  records: z.string().describe('A summary of all uploaded medical records, including file names and dates.'),
  appointments: z.string().describe('A list of all past and upcoming appointments.'),
  medications: z.string().describe('A list of all current medications and their reminder times.'),
});
export type MedicalSummaryInput = z.infer<typeof MedicalSummaryInputSchema>;

const MedicalSummaryOutputSchema = z.object({
  highlights: z.string().describe('A very brief, one-sentence summary of the most important health highlight.'),
  recentActivity: z.string().describe('A summary of recent activities, such as appointments and new records.'),
  medicationSummary: z.string().describe('A summary of all active medications.'),
});
export type MedicalSummaryOutput = z.infer<typeof MedicalSummaryOutputSchema>;

export async function getMedicalSummary(input: MedicalSummaryInput): Promise<MedicalSummaryOutput> {
  return medicalSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'medicalSummaryPrompt',
  input: {schema: MedicalSummaryInputSchema},
  output: {schema: MedicalSummaryOutputSchema},
  prompt: `You are an AI medical assistant responsible for creating a patient-friendly medical summary.
  
  Consolidate the following information into a clear and concise summary. The tone should be helpful and easy for a non-medical person to understand.

  **Uploaded Records:**
  {{{records}}}

  **Appointments:**
  {{{appointments}}}

  **Current Medications:**
  {{{medications}}}

  Based on this data, generate the following summaries:
  1.  **Highlights**: A single, impactful sentence that summarizes the patient's most important current health status (e.g., "Currently managing post-op recovery from a recent surgery," or "Regularly attending check-ups for ongoing allergy monitoring.").
  2.  **Recent Activity**: A brief paragraph summarizing recent events, like the latest appointments or newly added medical records.
  3.  **Medication Summary**: A simple list or paragraph summarizing all active medications.
  `,
});

const medicalSummaryFlow = ai.defineFlow(
  {
    name: 'medicalSummaryFlow',
    inputSchema: MedicalSummaryInputSchema,
    outputSchema: MedicalSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
