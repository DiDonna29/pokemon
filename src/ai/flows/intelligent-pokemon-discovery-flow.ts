'use server';
/**
 * @fileOverview A Genkit flow for intelligently discovering Pokémon based on natural language descriptions.
 *
 * - intelligentPokemonDiscovery - A function that handles the Pokémon discovery process.
 * - IntelligentPokemonDiscoveryInput - The input type for the intelligentPokemonDiscovery function.
 * - IntelligentPokemonDiscoveryOutput - The return type for the intelligentPokemonDiscovery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentPokemonDiscoveryInputSchema = z.object({
  description: z.string().describe('A natural language description of a Pokémon, e.g., "a small, fast, fire-type Pokémon" or "a water-type Pokémon known for defense".')
});
export type IntelligentPokemonDiscoveryInput = z.infer<typeof IntelligentPokemonDiscoveryInputSchema>;

const SuggestedPokemonSchema = z.object({
  name: z.string().describe('The name of the suggested Pokémon.'),
  types: z.array(z.string()).describe('A list of primary types for the suggested Pokémon, e.g., ["fire", "flying"].')
});

const IntelligentPokemonDiscoveryOutputSchema = z.object({
  suggestedPokemon: z.array(SuggestedPokemonSchema).describe('A list of suggested Pokémon that match the description.')
});
export type IntelligentPokemonDiscoveryOutput = z.infer<typeof IntelligentPokemonDiscoveryOutputSchema>;

export async function intelligentPokemonDiscovery(input: IntelligentPokemonDiscoveryInput): Promise<IntelligentPokemonDiscoveryOutput> {
  return intelligentPokemonDiscoveryFlow(input);
}

const intelligentPokemonDiscoveryPrompt = ai.definePrompt({
  name: 'intelligentPokemonDiscoveryPrompt',
  input: {schema: IntelligentPokemonDiscoveryInputSchema},
  output: {schema: IntelligentPokemonDiscoveryOutputSchema},
  prompt: `You are an expert Pokédex assistant. Your task is to identify and suggest Pokémon based on a natural language description provided by the user.
Consider Pokémon names, types, characteristics (like speed, defense, size), and common associations.
Generate a list of up to 5 Pokémon that best fit the description.
For each suggested Pokémon, provide its common name and its primary types.

Description: {{{description}}}`
});

const intelligentPokemonDiscoveryFlow = ai.defineFlow(
  {
    name: 'intelligentPokemonDiscoveryFlow',
    inputSchema: IntelligentPokemonDiscoveryInputSchema,
    outputSchema: IntelligentPokemonDiscoveryOutputSchema
  },
  async (input) => {
    const {output} = await intelligentPokemonDiscoveryPrompt(input);
    return output!;
  }
);
