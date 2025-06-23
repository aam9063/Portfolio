Te voy a crear un README.md personalizado para tu portfolio/blog. Primero déjame revisar algunos detalles de tu proyecto para hacerlo más específico:
Read file: src/consts.ts
Read file: package.json
Ran tool
Perfecto! Basándome en la información de tu proyecto, aquí tienes un README.md personalizado para tu portfolio/blog:

```markdown
# 💼 Albert Alarcón | Portfolio & Blog

Bienvenido a mi portfolio personal y blog de desarrollo de software. Un sitio estático rápido y minimalista construido con Astro, donde comparto mis conocimientos sobre desarrollo .NET, arquitectura de software y tecnologías modernas.

## 🚀 Demo en Vivo

[Ver Portfolio](https://tu-dominio.com) <!-- Actualiza con tu URL real -->

## 👨‍💻 Sobre Mí

Soy Albert Alarcón, un desarrollador de software especializado en .NET y Angular. En este blog escribo sobre temas que me apasionan, incluyendo:

- 🏗️ Clean Architecture & CQRS Pattern
- 🧪 Testing en .NET
- 🔧 Mejores prácticas de desarrollo
- 📚 Experiencias y aprendizajes del desarrollo de software

## ✨ Características

- ⚡ **Súper rápido** - Construido con Astro para máximo rendimiento
- 🎨 **Diseño minimalista** - Interfaz limpia y profesional
- 🌙 **Modo oscuro/claro** - Tema adaptable
- 📱 **Totalmente responsive** - Se adapta a cualquier dispositivo
- 🔍 **Búsqueda integrada** - Encuentra contenido fácilmente
- 📖 **Soporte MDX** - Componentes interactivos en markdown
- 🚀 **SEO optimizado** - Metadatos y sitemap automático
- 📄 **RSS Feed** - Mantente actualizado con nuevos posts

## 🛠️ Stack Técnico

- **Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [SolidJS](https://www.solidjs.com/)
- **Language**: TypeScript
- **Content**: Markdown/MDX
- **Deployment**: [Vercel](https://vercel.com/) / [Netlify](https://netlify.com/)

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables (Header, Footer, etc.)
├── content/        # Contenido del blog y proyectos
│   ├── blog/       # Posts del blog
│   ├── projects/   # Proyectos destacados
│   └── work/       # Experiencia laboral
├── layouts/        # Plantillas de página
├── pages/          # Rutas de la aplicación
├── styles/         # Estilos globales
└── types.ts        # Definiciones de tipos TypeScript
```

## 🚀 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando                | Acción                                    |
| :--------------------- | :---------------------------------------- |
| `npm install`          | Instala las dependencias                  |
| `npm run dev`          | Inicia servidor de desarrollo local       |
| `npm run dev:network`  | Inicia servidor en red local             |
| `npm run build`        | Construye el sitio para producción       |
| `npm run preview`      | Vista previa del build local             |
| `npm run lint`         | Ejecuta ESLint                           |
| `npm run lint:fix`     | Corrige errores de ESLint automáticamente|

## 📝 Agregar Nuevo Contenido

### Nuevo Post del Blog

1. Crea una nueva carpeta en `src/content/blog/`
2. Añade un archivo `index.md` o `index.mdx`
3. Incluye el frontmatter requerido:

```yaml
---
title: "Tu Título Aquí"
summary: "Breve descripción del post"
date: "2024-01-01"
draft: false
tags:
  - .NET
  - Clean Architecture
---
```

### Nuevo Proyecto

1. Crea una nueva carpeta en `src/content/projects/`
2. Añade un archivo `index.md` con el frontmatter:

```yaml
---
title: "Nombre del Proyecto"
summary: "Descripción del proyecto"
date: "2024-01-01"
draft: false
tags:
  - JavaScript
  - React
demoUrl: "https://tu-demo.com"
repoUrl: "https://github.com/usuario/repo"
---
```

## 📊 Posts Destacados

- 🏗️ [Clean Architecture in .NET - CQRS Pattern](./src/content/blog/01-Clean-Architecture-in-dotnet-CQRS-Pattern/)
- 🧪 [Testing en .NET](./src/content/blog/02-testing-in-dotnet/)

## 🌐 Conecta Conmigo

- 📧 **Email**: [albert9063@gmail.com](mailto:albert9063@gmail.com)
- 💼 **LinkedIn**: [Albert Alarcón Martínez](https://www.linkedin.com/in/albert-alarc%C3%B3n-mart%C3%ADnez-04044a51/)
- 🐙 **GitHub**: [@aam9063](https://github.com/aam9063)

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!

**Construido con ❤️ por Albert Alarcón**
```

