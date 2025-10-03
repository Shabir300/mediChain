
'use server';

/**
 * @fileOverview A multi-talented AI assistant for patients that can answer questions about symptoms, budget, medications, and medical records.
 *
 * - patientAiAssistant - The primary function that acts as a conversational agent.
 * - PatientAiAssistantInput - The input type for the patientAiAssistant function.
 * - PatientAiAssistantOutput - The return type for the patientAiAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getActiveMedications, getBudgetAndSpending, getMedicalRecordSummary, findAvailableDoctors } from '../tools/patient-tools';

const PatientAiAssistantInputSchema = z.object({
  userQuery: z.string().describe('The question or statement from the user.'),
  medicalHistory: z.string().optional().describe("A summary of the patient's medical history file names."),
  appointments: z.string().optional().describe('A summary of past and upcoming appointments.'),
  medications: z.string().optional().describe('A summary of current medications.'),
  orders: z.string().optional().describe('A summary of pharmacy orders.'),
  chatHistory: z.string().optional().describe('The history of the current conversation, if available.'),
});
export type PatientAiAssistantInput = z.infer<typeof PatientAiAssistantInputSchema>;

const PatientAiAssistantOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user.'),
});
export type PatientAiAssistantOutput = z.infer<typeof PatientAiAssistantOutputSchema>;


export async function patientAiAssistant(input: PatientAiAssistantInput): Promise<PatientAiAssistantOutput> {
  return patientAiAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'patientAiAssistantPrompt',
  input: {schema: PatientAiAssistantInputSchema},
  output: {schema: PatientAiAssistantOutputSchema},
  tools: [findAvailableDoctors, getBudgetAndSpending, getActiveMedications, getMedicalRecordSummary],
  prompt: `You are an expert AI healthcare assistant for a patient. Your goal is to be helpful, empathetic, and provide clear, concise information based on the user's query and the data you can access through your tools.

  Here is the information provided about the patient and the conversation so far:
  - User's latest query: {{{userQuery}}}
  - Medical Records available: {{{medicalHistory}}}
  - Appointments: {{{appointments}}}
  - Pharmacy Orders: {{{orders}}}
  - Active Medications: {{{medications}}}
  - Conversation History: {{{chatHistory}}}

  Follow these steps carefully:
  1.  Analyze the user's query to understand their intent. Are they asking about symptoms, spending, medication, a specific medical record, or just having a general conversation?
  2.  Based on the intent, decide if you need to use a tool.
      - If they ask about **symptoms** (e.g., "I have a headache"), determine if a specialist is needed and use the 'findAvailableDoctors' tool if necessary.
      - If they ask about **budget, cost, or spending**, use the 'getBudgetAndSpending' tool.
      - If they ask about their **current medications**, use the 'getActiveMedications' tool and refer to the 'Active Medications' context provided above.
      - If they ask a question about a **specific medical record** (e.g., "what were my blood test results?"), use the 'getMedicalRecordSummary' tool with the relevant filename.
      - If they say 'hi' or make a general statement, provide a friendly greeting and ask how you can help. DO NOT default to asking for symptoms unless they mention them.
  3.  Synthesize the information from the tool's output (if any) and the user's query to formulate a helpful response.
  4.  Provide a clear, empathetic, and easy-to-understand response to the user.
      - When providing information from a tool, present it in a natural, conversational way. Don't just spit out the raw data.
  
  IMPORTANT: Do NOT provide a medical diagnosis. Your guidance should be safe, cautious, and always encourage professional medical consultation when there is any doubt.`,
});

const patientAiAssistantFlow = ai.defineFlow(
  {
    name: 'patientAiAssistantFlow',
    inputSchema: PatientAiAssistantInputSchema,
    outputSchema: PatientAiAssistantOutputSchema,
  },
  async input => {
    // For the getActiveMedications tool to work, we must provide the data in the prompt.
    // The tool itself doesn't have access to the client-side store.
    const fullPromptInput = {
        ...input,
        medications: input.medications || "No active medications."
    };

    const {output} = await prompt(fullPromptInput);
    return {
      response: output?.response || "I'm sorry, I was unable to process your request at this time. Please try again later.",
    }
  }
);
