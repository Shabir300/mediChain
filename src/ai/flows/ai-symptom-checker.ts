'use server';

/**
 * @fileOverview An AI-powered symptom checker flow.
 *
 * - symptomChecker - A function that takes a symptom description and returns guidance.
 * - SymptomCheckerInput - The input type for the symptomChecker function.
 * - SymptomCheckerOutput - The return type for the symptomChecker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomCheckerInputSchema = z.object({
  symptomDescription: z
    .string()
    .describe('A description of the symptoms the patient is experiencing.'),
});
export type SymptomCheckerInput = z.infer<typeof SymptomCheckerInputSchema>;

const SymptomCheckerOutputSchema = z.object({
  guidance: z
    .string()
    .describe(
      'Guidance on what the patient should do based on their symptoms (e.g., take rest, book urgent appointment).'    )
});
export type SymptomCheckerOutput = z.infer<typeof SymptomCheckerOutputSchema>;

export async function symptomChecker(input: SymptomCheckerInput): Promise<SymptomCheckerOutput> {
  return symptomCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomCheckerPrompt',
  input: {schema: SymptomCheckerInputSchema},
  output: {schema: SymptomCheckerOutputSchema},
  prompt: `You are an AI assistant that provides basic guidance to patients based on their symptoms.

  Based on the following symptom description, provide guidance on what the patient should do.  Be brief and direct.

  Symptom Description: {{{symptomDescription}}}
  `,
});

const symptomCheckerFlow = ai.defineFlow(
  {
    name: 'symptomCheckerFlow',
    inputSchema: SymptomCheckerInputSchema,
    outputSchema: SymptomCheckerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
