# 📖 Detalles Técnicos del Proyecto: PokeNexus

Este documento proporciona una visión profunda de la arquitectura y las funcionalidades del proyecto para desarrolladores.

## 🏗️ Arquitectura de Software

El proyecto sigue una estructura de **Next.js App Router** optimizada para el rendimiento y la escalabilidad:

- `src/app`: Rutas y páginas principales.
- `src/components`: Componentes UI modulares y lógicos (Pokedex, BattleArena, Quiz).
- `src/ai`: Integración con Genkit, definiciones de prompts y flujos de IA.
- `src/lib`: Utilidades, clientes de API (PokeAPI) y sistemas de internacionalización (i18n).
- `src/hooks`: Hooks personalizados para gestión de estado y UI móvil.

## 🧠 Integración de IA (Genkit)

La funcionalidad de **Descubrimiento IA** utiliza Genkit para procesar lenguaje natural:

1. **Definición de Flujo:** Ubicado en `src/ai/flows/intelligent-pokemon-discovery-flow.ts`.
2. **Modelo:** Utiliza `gemini-2.5-flash` a través de `@genkit-ai/google-genai`.
3. **Prompting:** Implementa *Handlebars* para estructurar las consultas al modelo, asegurando respuestas en formato JSON estructurado que la aplicación puede mapear directamente a IDs de la PokeAPI.

## 🌓 Sistema de Temas y Contraste

Se ha implementado una lógica de contraste dinámico para asegurar la accesibilidad (WCAG):

- **Variables CSS:** Uso intensivo de variables HSL en `globals.css`.
- **Lógica de Tipografía:** En componentes críticos (como `page.tsx` y `WhosThatPokemon.tsx`), el color del texto se fuerza dinámicamente:
  - Fondos Claros/Amarillos -> Texto Negro (`text-black`).
  - Fondos Oscuros -> Texto Blanco (`text-white`).

## 🎮 Funcionalidades Específicas

### 1. Sistema de Filtrado Profundo
A diferencia de una búsqueda simple, PokeNexus realiza llamadas asíncronas para obtener detalles de Peso y Altura, permitiendo un filtrado que la API estándar no ofrece en sus endpoints de lista.

### 2. Campo de Batalla
Utiliza un motor de simulación basado en las estadísticas reales (HP, Attack, Defense, Speed). Los registros de batalla se generan en tiempo real para dar transparencia al resultado.

### 3. Quiz de Suspenso
El modo "¿Quién es ese Pokémon?" utiliza animaciones de `framer-motion` para crear un efecto de revelación dramático:
- **Vibración:** Se activa al fallar o al revelar.
- **Flash:** Un destello de opacidad simula el "encendido" de la luz.
- **Confeti:** Feedback positivo visual tras el acierto o revelación.

## 📦 Gestión de Paquetes

El archivo `package.json` está configurado para ser agnóstico al gestor de paquetes. Se recomienda el uso de `pnpm` por su velocidad y eficiencia en el manejo de dependencias de Next.js.
