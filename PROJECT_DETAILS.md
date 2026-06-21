# 📖 Detalles Técnicos del Proyecto: PokeNexus

Este documento proporciona una visión profunda de la arquitectura y las funcionalidades del proyecto para desarrolladores y stakeholders.

## 🏗️ Arquitectura de Software

El proyecto sigue una estructura de **Next.js 15 App Router** optimizada para el rendimiento y la escalabilidad:

- `src/app`: Rutas y páginas principales.
- `src/components`: Componentes UI modulares y lógicos (Pokedex, BattleArena, Quiz).
- `src/ai`: Integración con Genkit, definiciones de prompts y flujos de IA.
- `src/lib`: Utilidades, clientes de API (PokeAPI) y sistemas de internacionalización (i18n).
- `src/hooks`: Hooks personalizados para gestión de estado y UI móvil.

## 🧠 Integración de IA (Genkit)

La funcionalidad de **Descubrimiento IA** utiliza Genkit para procesar lenguaje natural:

1. **Definición de Flujo:** Ubicado en `src/ai/flows/intelligent-pokemon-discovery-flow.ts`.
2. **Modelo:** Utiliza `gemini-1.5-flash` a través de `@genkit-ai/google-genai`.
3. **Lógica de Fallback:** Si la IA no encuentra resultados o falla la conexión (ej. falta de API Key), el sistema lanza un aviso visual (Toast) y permite resetear los filtros para no bloquear la experiencia del usuario.

## 🌓 Sistema de Contraste Inteligente (UI/UX)

Se ha implementado una lógica de contraste dinámico para asegurar la accesibilidad (WCAG) en todas las condiciones:

- **Regla de Oro:** Texto NEGRO sobre fondos claros/amarillos y texto BLANCO sobre fondos oscuros/cristal.
- **Botón Mi Colección:** Implementa un estado "Sticky/Activo" que cambia radicalmente su apariencia para indicar que el filtro está aplicado.
- **Modo Oscuro/Claro:** Sincronización total mediante variables CSS HSL que garantizan que el cristalismo (glassmorphism) nunca comprometa la legibilidad.

## 🎮 Funcionalidades Premium

### 1. Sistema de Filtrado Profundo (Deep Filtering)
A diferencia de una búsqueda simple, PokeNexus realiza llamadas asíncronas para obtener detalles de Peso y Altura. Hemos implementado un motor de filtrado que analiza estas métricas en tiempo real, permitiendo segmentar la Pokedex por categorías como "Pesado (>100kg)" o "Pequeño (<1m)".

### 2. Campo de Batalla Directo
Un motor de simulación basado en las estadísticas reales (HP, Attack, Defense, Speed). Los registros de batalla se generan con delays controlados para simular turnos de juego clásicos.

### 3. Quiz de Suspenso Cinematográfico
El modo "¿Quién es ese Pokémon?" ha sido mejorado con:
- **Vibración y Destellos:** Al intentar revelar al Pokémon, la silueta vibra y emite luz pulsante para crear suspenso.
- **Revelado Automático:** Si el usuario falla 3 veces, se habilita el botón "Revelar Pokémon".
- **Feedback Visual:** Explosión de confeti y cambio de brillo al descubrir la identidad.

## 📦 Gestión de Paquetes y Producción

El proyecto está configurado para ser agnóstico al gestor de paquetes:
- **Scripts:** `dev`, `build`, `start`, `lint`.
- **Configuración:** `next.config.ts` incluye protecciones de `allowedDevOrigins` para entornos de desarrollo en la nube.
- **Soporte:** Probado en `pnpm`, `yarn` y `npm`.

© 2024 PokeNexus - Desarrollado con pasión por los detalles.
