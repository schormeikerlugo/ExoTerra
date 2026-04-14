# 🪐 ExoTerra

ExoTerra es un explorador interactivo 3D diseñado para visualizar y analizar exoplanetas reales descubiertos por la NASA. Combina la potencia matemática y el rigor de los datos astronómicos con la belleza y la inmersión del renderizado 3D en la web, ofreciéndole al usuario una experiencia única en la que puede interactuar gráficamente con mundos ubicados más allá de nuestro sistema solar.

## 🚀 Dirección del Proyecto
El proyecto ExoTerra no solo busca ser un catálogo visual, sino también un motor de inferencia analítica en tiempo real y una plataforma educativa pionera. Hacia el futuro, el proyecto tiene como horizontes:
- **Catálogo Exhaustivo Espacial:** Seguir mapeando miles de exoplanetas mediante el procesamiento centralizado de datos (como los archivos generados por misiones Kepler, TESS, etc.).
- **Simulación Realista y Dinámica:** Profundizar los shaders GLSL personalizados (`planet.frag.glsl`) y los efectos de post-procesado para dar vida a la geología, anillos, múltiples lunas, meteorología exoplanetaria dependientes de la insolación estelar, excentricidad, temperatura o composición química.
- **Predicción de Habitabilidad y Clasificación:** Expandir el algoritmo PL/pgSQL procedural corriendo en la base de datos (Supabase). Éste calcula el `habitability_score` ponderando radio, masa, insolación y temperatura de equilibrio; infiriendo a su vez detalles científicos para visualizar mundos rocosos de lava, gigantes de hielo espectaculares y súper-tierras con océanos globales.

## 💻 Arquitectura y Stack Tecnológico
La magia de ExoTerra viene impulsada por tecnologías modernas enfocadas en un rendimiento excepcional y procesamiento dinámico:
- **Frontend 3D Inmersivo:** React 19, TypeScript y Vite proporcionan la estructura de rápida iteración. `React Three Fiber` junto con `Drei` otorgan el contexto 3D interactivo, y *Three.js* ejecuta el modelado volumétrico nativo bajo webGL.
- **Estilos e Interfaz Modular:** Estilizado mediante `TailwindCSS v4` para construir una UI astronómica "glassmorphic", minimalista y libre de fricción. El estado local y global se maneja agílmente utilizando `Zustand`. Integración de navegación ininterrumpida con `React Router v7`.
- **Backend y Motor Computacional:** Un backend Serverless propulsado por `Supabase` y PostgreSQL aloja miles de registros purificados que nacen del `nasa_data.csv`.
- **Data Ingestion Procedural:** Scripts en Python (`import_data.py`, `import_sql.py`) procesan masivamente y auto-sincronizan la digestión, enviando lotes eficientes hacia Supabase. Triggers en base de datos (`supabase_schema.sql`) logran calcular en inserción atributos visuales asombrosos sobre cómo debe pintar la UI el exoplaneta (densidad de nubes, color de la atmósfera, número de lunas posibles, formaciones de anillos).

## ⚙️ Características Actuales
- 🌍 **Renderizado Procedural 3D Complejo**: Auto-generación de superficies (e.g. roca helada, agua habitable, gas joviano incandescente).
- 📡 **Catálogo Extendido Dinámico**: Visualización de sistemas estelares con filtrado y control de habitabilidad directo.
- 🔬 **Explorador Único (`ExplorerPage`)**: Detalles termodinámicos (temperatura de equilibrio $K$, luminosidad, metalicidades y edad precalculada de estrellas host).
- 🧑‍🚀 **Motor RLS y Computación en Supabase**: Las lógicas pesadas para inferencia se mantienen en DB para aligerar la responsividad y seguridad del cliente (Row Level Security activo).

## 🛠️ Instalación y Desarrollo Local

### 1. Requisitos Previos
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3+](https://www.python.org/) (Para las utilidades script de ingesta)
- Un proyecto habilitado en [Supabase](https://supabase.io/) para replicar la DB.

### 2. Configurar la Infraestructura Base
Importa la estructura a tu nueva base de datos Supabase ejecutando en el editor SQL:
\`\`\`bash
# Refiérase al archivo principal del modelo
supabase_schema.sql
\`\`\`

### 3. Ingesta de la Base Astronómica
\`\`\`bash
# Configura tus variables en import_data.py y corre la semilla
python import_data.py nasa_data.csv
\`\`\`

### 4. Lanzar el Entorno Web
Clona tu propio repositorio (luego de hacer push) e instala el entorno Node:
\`\`\`bash
npm install
npm run dev
\`\`\`

¡Disfruta surcando la galaxia en `localhost:5173`! 🌌✨
