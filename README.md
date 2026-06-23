# ⚡ PokeNexus | Ultimate Pokédex Companion

**PokeNexus** es una plataforma digital de vanguardia diseñada para entusiastas de Pokémon, construida con las tecnologías más modernas de la web. Ofrece una experiencia inmersiva que combina descubrimiento mediante IA, simulaciones de combate realistas y entretenimiento educativo, todo envuelto en una interfaz premium de alto contraste.

---

## 🚀 Propósito de la Aplicación

La meta de PokeNexus es centralizar la experiencia de un Entrenador Pokémon en una sola herramienta digital que sea rápida, inteligente y visualmente imponente. No es solo una base de datos; es un asistente de combate y descubrimiento potenciado por IA que elimina la fricción de buscar información técnica de forma manual.

## ✨ Características Principales

- 🔍 **Búsqueda Inteligente (Híbrida):** Búsqueda clásica instantánea combinada con **Descubrimiento IA (Genkit)** que entiende lenguaje natural (ej: "un Pokémon rápido que parezca un pájaro azul").
- 🛡️ **Campo de Batalla (Battle Arena):** Motor de simulación cinemática que utiliza estadísticas reales (HP, Ataque, Defensa, Velocidad) para predecir duelos, con animaciones de impacto y logs de combate detallados.
- 🎮 **Quiz "¿Quién es ese Pokémon?":** Juego de adivinanzas con siluetas dinámicas, pistas progresivas y una atmósfera de suspenso optimizada para el tema claro y oscuro.
- 🎒 **Colección Personal:** Sistema de gestión de capturas con persistencia local para llevar un registro de tu progreso.
- 🌓 **Diseño Multi-Capa Premium:** Interfaz adaptable con tres niveles de profundidad visual, optimizada para rendimiento móvil y escritorio con aceleración por hardware.

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS.
- **Componentes:** Shadcn/UI (Customizado), Framer Motion (Animaciones cinemáticas).
- **IA:** Genkit + Google Gemini 2.5 Flash.
- **Datos:** PokeAPI (Consumo de datos en tiempo real con optimización de carga).

---

## 🏗️ Lógica del Proyecto y Proceso

1.  **Arquitectura Modular:** El proyecto se divide en componentes atómicos (`src/components`) y flujos de servidor para la IA (`src/ai`), lo que permite una escalabilidad limpia.
2.  **Optimización de Rendimiento (Anti-Slop):** Se ha evitado el uso de transiciones globales pesadas, prefiriendo animaciones dirigidas a la GPU para mantener 60 FPS constantes.
3.  **Internacionalización (i18n):** Soporte completo para Inglés y Español, permitiendo que la comunidad global acceda a la herramienta.
4.  **Hidratación Segura:** Manejo avanzado de estados del navegador para evitar errores de SSR entre el servidor de Next.js y el cliente.

## ⚙️ Instalación y Producción

Este proyecto está listo para ser desplegado instantáneamente.

### Instalación de dependencias:
```bash
# Con pnpm (recomendado)
pnpm install

# Con yarn
yarn install
```

### Ejecución en desarrollo:
```bash
pnpm dev
# o
yarn dev
```

### Construcción para producción:
```bash
pnpm build
pnpm start
# o
yarn build
yarn start
```

---

## 🔮 Futuro Escalable

PokeNexus ha sido diseñado con una base de código flexible que permite las siguientes expansiones:

1.  **Cuentas de Usuario:** Integración con Firebase Auth para sincronizar colecciones entre dispositivos.
2.  **Multijugador:** Batallas reales en tiempo real mediante WebSockets o Firestore Listeners.
3.  **Evolución Profunda:** Visualización completa de cadenas evolutivas y requerimientos específicos de evolución.
4.  **IA Predictiva Avanzada:** Sugerencias de equipo basadas en el meta actual de combate Pokémon.

---

© 2024 PokeNexus - Desarrollado por **John Di Donna**. Potenciado por **Google Gemini**.