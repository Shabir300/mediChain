'use server';

/**
 * @fileOverview A pharmacy stock alert AI agent.
 *
 * - lowStockAlert - A function that handles the stock alert process.
 * - LowStockAlertInput - The input type for the lowStockAlert function.
 * - LowStockAlertOutput - The return type for the lowStockAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LowStockAlertInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  currentStock: z.number().describe('The current stock quantity of the product.'),
  stockChangeReason: z.string().describe('The reason for the change in stock levels.'),
});
export type LowStockAlertInput = z.infer<typeof LowStockAlertInputSchema>;

const LowStockAlertOutputSchema = z.object({
  alertMessage: z.string().describe('A warning message if the stock is low, otherwise null.'),
});
export type LowStockAlertOutput = z.infer<typeof LowStockAlertOutputSchema>;

export async function lowStockAlert(input: LowStockAlertInput): Promise<LowStockAlertOutput> {
  return lowStockAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lowStockAlertPrompt',
  input: {schema: LowStockAlertInputSchema},
  output: {schema: LowStockAlertOutputSchema},
  prompt: `You are an AI assistant helping pharmacies manage their stock levels.

  If the current stock of {{productName}} is less than 5, generate a low stock warning message including the reason for the stock change.
  Otherwise, indicate that no alert is necessary.

  Current Stock: {{currentStock}}
  Product Name: {{productName}}
  Reason for Stock Change: {{stockChangeReason}}

  If an alert is necessary, make it informative and suggest replenishing the stock. Otherwise, the alertMessage should be null.
`,
});

const lowStockAlertFlow = ai.defineFlow(
  {
    name: 'lowStockAlertFlow',
    inputSchema: LowStockAlertInputSchema,
    outputSchema: LowStockAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_LOW_AND_ABOVE',
        },
      ],
    });
    return {
      alertMessage: output?.alertMessage || null,
    };
  }
);
