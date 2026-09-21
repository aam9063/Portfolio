import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Albert | Software Developer",
  DESCRIPTION: "Welcome to my portfolio and blog, a portfolio and blog for software developers.",
  AUTHOR: "Albert Alarcón",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "Places I have worked.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Recent projects I have worked on.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword.",
}

// Links
export const LINKS: Links = [
  {
    TEXT: "Case studies",
    HREF: "/#case-studies",
  },
  {
    TEXT: "How I work",
    HREF: "/#how-i-work",
  },
  {
    TEXT: "Blog",
    HREF: "/blog",
  },
]

// Contact call-to-action, rendered as a button (not a plain nav link)
export const CONTACT_CTA: Links[number] = {
  TEXT: "Contact",
  HREF: "/#contact",
}

// Socials
export const SOCIALS: Socials = [
  { 
    NAME: "Email",
    ICON: "email", 
    TEXT: "albert9063@gmail.com",
    HREF: "mailto:albert9063@gmail.com",
  },
  { 
    NAME: "Github",
    ICON: "github",
    TEXT: "aam9063",
    HREF: "https://github.com/aam9063"
  },
  { 
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "Albert Alarcón Martínez",
    HREF: "https://www.linkedin.com/in/albertalarcon-software-developer/",
  }
]

