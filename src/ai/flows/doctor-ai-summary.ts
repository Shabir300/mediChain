'use server';

/**
 * @fileOverview Provides a patient summary for doctors before consultations.
 *
 * - getPatientSummary - A function that returns a summary of the patient's medical history.
 * - PatientSummaryInput - The input type for the getPatientSummary function.
 * - PatientSummaryOutput - The return type for the getPatientSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PatientSummaryInputSchema = z.object({
  patientHistory: z
    .string()
    .describe('The patient medical history, as an unstructured string.'),
  lastVisitDate: z
    .string()
    .describe('The date of the last visit, as an ISO date string.'),
  condition: z.string().describe('The patient current condition.'),
  currentMedicine: z
    .string()
    .describe('The patient current medicine, as an unstructured string.'),
});
export type PatientSummaryInput = z.infer<typeof PatientSummaryInputSchema>;

const PatientSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the patient medical history.'),
});
export type PatientSummaryOutput = z.infer<typeof PatientSummaryOutputSchema>;

export async function getPatientSummary(input: PatientSummaryInput): Promise<PatientSummaryOutput> {
  return patientSummaryFlow(input);
}

const patientSummaryPrompt = ai.definePrompt({
  name: 'patientSummaryPrompt',
  input: {schema: PatientSummaryInputSchema},
  output: {schema: PatientSummaryOutputSchema},
  prompt: `You are an AI assistant for doctors. Your task is to summarize patient information to aid the doctor before a consultation.

  Summarize the following patient information:

  Patient History: {{{patientHistory}}}
  Last Visit Date: {{{lastVisitDate}}}
  Condition: {{{condition}}}
  Current Medicine: {{{currentMedicine}}}

  Provide a concise and easy-to-understand summary.`,
});

const patientSummaryFlow = ai.defineFlow(
  {
    name: 'patientSummaryFlow',
    inputSchema: PatientSummaryInputSchema,
    outputSchema: PatientSummaryOutputSchema,
  },
  async input => {
    const {output} = await patientSummaryPrompt(input);
    return output!;
  }
);
