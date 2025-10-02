'use server';

/**
 * @fileOverview An AI-powered symptom checker flow that can act as an agent.
 *
 * - symptomChecker - A function that takes a symptom description and returns guidance, potentially including a list of recommended doctors.
 * - SymptomCheckerInput - The input type for the symptomChecker function.
 * - SymptomCheckerOutput - The return type for the symptomChecker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doctors } from '@/lib/data';

const SymptomCheckerInputSchema = z.object({
  symptomDescription: z
    .string()
    .describe('A description of the symptoms the patient is experiencing.'),
  medicalHistory: z
    .string()
    .optional()
    .describe("The patient's medical history, if available."),
  chatHistory: z
    .string()
    .optional()
    .describe('The history of the current conversation, if available.'),
});
export type SymptomCheckerInput = z.infer<typeof SymptomCheckerInputSchema>;

const SymptomCheckerOutputSchema = z.object({
  guidance: z.string().describe('AI-generated guidance for the patient, which may include a summary of findings or a list of recommended doctors.'),
});
export type SymptomCheckerOutput = z.infer<typeof SymptomCheckerOutputSchema>;

// Define the tool for the AI to use
const findAvailableDoctors = ai.defineTool(
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


export async function symptomChecker(input: SymptomCheckerInput): Promise<SymptomCheckerOutput> {
  return symptomCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomCheckerPrompt',
  input: {schema: SymptomCheckerInputSchema},
  output: {schema: SymptomCheckerOutputSchema},
  tools: [findAvailableDoctors],
  prompt: `You are an AI medical assistant. Your role is to analyze a patient's symptoms and provide initial guidance.

  Here is the information provided by the patient:
  - Symptoms: {{{symptomDescription}}}
  - Medical History: {{{medicalHistory}}}
  - Conversation History: {{{chatHistory}}}

  Follow these steps:
  1.  Analyze the symptoms and medical history.
  2.  Determine if the symptoms are mild, moderate, or severe.
  3.  If the symptoms seem to require a specialist's attention, use the 'findAvailableDoctors' tool to find a relevant specialist (e.g., for a skin rash, find a Dermatologist).
  4.  Provide a clear, empathetic response to the patient.
      - If you use the tool, list the available doctors you found and recommend booking an appointment.
      - If the symptoms are mild, suggest home care.
      - If the symptoms are severe, strongly advise the patient to seek immediate medical attention at an emergency room.
  
  Do NOT provide a diagnosis. Your guidance should be safe, cautious, and always encourage professional medical consultation when there is any doubt.`,
});

const symptomCheckerFlow = ai.defineFlow(
  {
    name: 'symptomCheckerFlow',
    inputSchema: SymptomCheckerInputSchema,
    outputSchema: SymptomCheckerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      guidance: output?.guidance || "I'm sorry, I was unable to process your request at this time. Please try again later.",
    }
  }
);
