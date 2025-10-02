'use server';

/**
 * @fileOverview A patient-side stock alert AI agent.
 *
 * - patientStockAlert - A function that handles the stock alert process for a patient.
 * - PatientStockAlertInput - The input type for the patientStockAlert function.
 * - PatientStockAlertOutput - The return type for the patientStockAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PatientStockAlertInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  currentStock: z.number().describe('The current stock quantity the patient has.'),
});
export type PatientStockAlertInput = z.infer<typeof PatientStockAlertInputSchema>;

const PatientStockAlertOutputSchema = z.object({
  alertMessage: z.string().describe('A proactive and friendly message encouraging the user to reorder if stock is low.'),
});
export type PatientStockAlertOutput = z.infer<typeof PatientStockAlertOutputSchema>;

export async function patientStockAlert(input: PatientStockAlertInput): Promise<PatientStockAlertOutput> {
  return patientStockAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'patientStockAlertPrompt',
  input: {schema: PatientStockAlertInputSchema},
  output: {schema: PatientStockAlertOutputSchema},
  prompt: `You are a friendly AI healthcare assistant. Your goal is to help patients manage their medication.

  A patient's stock for a medication is running low. Your task is to generate a helpful and proactive alert message.

  Product Name: {{productName}}
  Patient's Current Stock: {{currentStock}}

  Analyze the stock level. If it's 3 or less, craft a friendly alert.
  - The message should be encouraging, not alarming.
  - It should clearly state the product name and the remaining quantity.
  - It must suggest reordering soon to avoid running out.

  Example: "It looks like your supply of {{productName}} is running low ({{currentStock}} remaining). To ensure you don't miss any doses, it might be a good time to place a new order!"
  
  If the stock is not low, respond with a simple confirmation like "Stock levels are currently fine."
  `,
});

const patientStockAlertFlow = ai.defineFlow(
  {
    name: 'patientStockAlertFlow',
    inputSchema: PatientStockAlertInputSchema,
    outputSchema: PatientStockAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      alertMessage: output?.alertMessage || "Could not determine stock status.",
    };
  }
);
