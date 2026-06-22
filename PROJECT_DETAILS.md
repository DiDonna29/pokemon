# 📖 Detalles Técnicos del Proyecto: PokeNexus

Este documento proporciona una visión profunda de la arquitectura y las funcionalidades del proyecto para desarrolladores y stakeholders.

## 🏗️ Arquitectura de Software

El proyecto sigue una estructura de **Next.js 15 App Router** optimizada para el rendimiento y la escalabilidad:

- `src/app`: Rutas y páginas principales con manejo de hidratación para evitar errores de SSR.
- `src/components`: Componentes UI modulares (Pokedex, BattleArena, Quiz, Filters).
- `src/ai`: Integración con Genkit v1.x, definiciones de prompts y flujos de IA (Gemini 2.5 Flash).
- `src/lib`: Utilidades, clientes de API (PokeAPI) y sistemas de internacionalización (i18n).
- `src/hooks`: Hooks personalizados para gestión de estado, UI móvil y notificaciones (Toast).

## 🧠 Integración de IA (Genkit)

La funcionalidad de **Descubrimiento IA** utiliza Genkit para procesar lenguaje natural:

1. **Definición de Flujo:** Ubicado en `src/ai/flows/intelligent-pokemon-discovery-flow.ts`.
2. **Modelo:** Utiliza `gemini-2.5-flash` para una respuesta rápida y precisa.
3. **Lógica de Fallback:** Implementación de manejo de errores centralizado que informa al usuario mediante Toasts si el servicio no está disponible o no hay coincidencias.

## 🌓 Sistema de UI/UX Premium (Taste Skill)

Se ha implementado una lógica de diseño de "Alta Gama" (Anti-Slop):

- **Navegación Inteligente:** Barra inferior que se ancla al borde en móviles (docked) y flota en escritorio (floating) para máxima ergonomía.
- **Cristalismo (Glassmorphism):** Superficies con `backdrop-blur` denso y bordes sutiles que reaccionan al tema claro/oscuro.
- **Contraste Dinámico:** Uso de variables CSS HSL para asegurar legibilidad WCAG, con especial atención a los botones de tipo y estados activos.

## 🎮 Funcionalidades Core

### 1. Campo de Batalla (Combat Engine)
Un motor de simulación cinemático:
- **Animaciones Físicas:** Uso de `framer-motion` para movimientos de embestida (atacante) y vibración/flash de impacto (defensor).
- **Lógica de Turnos:** Simulación basada en estadísticas de HP, Ataque, Defensa y Velocidad con registros de batalla en tiempo real.

### 2. Sistema de Filtrado de Cápsula
- **UI de Referencia:** Panel lateral con cápsulas oscuras y checkboxes circulares amarillos de alto contraste.
- **Filtrado Profundo:** Procesamiento asíncrono que analiza peso y altura real de los especímenes, más allá de los datos básicos de la lista general.

### 3. Quiz "¿Quién es ese Pokémon?"
- **Suspenso Cinematográfico:** Siluetas con brillo pulsante que se revelan tras una secuencia de vibración y destellos de luz.
- **Pistas Progresivas:** Sistema de pistas por letra inicial y tipo elemental para guiar al usuario.

## 📦 Producción y Despliegue

El proyecto está configurado para ser desplegado instantáneamente:
- **Scripts:** Totalmente compatible con `yarn build` y `pnpm build`.
- **Next.js 15:** Aprovechando las últimas mejoras en compilación y tiempo de ejecución.
- **Imágenes:** Configuración de `next.config.ts` optimizada para dominios externos de PokeAPI y GitHub.

© 2024 PokeNexus - Desarrollado con pasión por los detalles y el rendimiento.
