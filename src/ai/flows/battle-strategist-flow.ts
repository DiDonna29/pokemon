'use server';
/**
 * @fileOverview Un agente experto en estrategia de combate Pokémon.
 *
 * - analyzeBattleStrategy - Función que analiza el duelo entre dos Pokémon.
 * - BattleStrategyInput - Esquema de entrada.
 * - BattleStrategyOutput - Esquema de salida con consejos tácticos.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BattleStrategyInputSchema = z.object({
  pokemon1: z.object({
    name: z.string(),
    types: z.array(z.string()),
    stats: z.array(z.object({
      base_stat: z.number(),
      stat: z.object({ name: z.string() })
    }))
  }),
  pokemon2: z.object({
    name: z.string(),
    types: z.array(z.string()),
    stats: z.array(z.object({
      base_stat: z.number(),
      stat: z.object({ name: z.string() })
    }))
  }),
  lang: z.enum(['en', 'es']).default('es')
});

export type BattleStrategyInput = z.infer<typeof BattleStrategyInputSchema>;

const BattleStrategyOutputSchema = z.object({
  advantage: z.string().describe('Qué Pokémon tiene la ventaja inicial.'),
  reasoning: z.string().describe('Explicación técnica basada en tipos y estadísticas.'),
  advice: z.string().describe('Consejo táctico para el jugador que controla al Pokémon 1.')
});

export type BattleStrategyOutput = z.infer<typeof BattleStrategyOutputSchema>;

export async function analyzeBattleStrategy(input: BattleStrategyInput): Promise<BattleStrategyOutput> {
  return battleStrategistFlow(input);
}

const strategistPrompt = ai.definePrompt({
  name: 'battleStrategistPrompt',
  input: {schema: BattleStrategyInputSchema},
  output: {schema: BattleStrategyOutputSchema},
  prompt: `Eres un Maestro Pokémon experto en análisis de combate. Analiza el siguiente duelo:

Pokémon 1: {{{pokemon1.name}}} (Tipos: {{#each pokemon1.types}}{{{this}}}, {{/each}})
Pokémon 2: {{{pokemon2.name}}} (Tipos: {{#each pokemon2.types}}{{{this}}}, {{/each}})

Considera las debilidades elementales, las estadísticas base (HP, Ataque, Defensa, Velocidad) y proporciona un análisis estratégico profesional.
Responde en el idioma: {{{lang}}}.`
});

const battleStrategistFlow = ai.defineFlow(
  {
    name: 'battleStrategistFlow',
    inputSchema: BattleStrategyInputSchema,
    outputSchema: BattleStrategyOutputSchema,
  },
  async (input) => {
    const {output} = await strategistPrompt(input);
    return output!;
  }
);
