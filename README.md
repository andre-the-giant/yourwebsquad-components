# Your Web Squat - component library

Hey what's up ? So you found my little component library project ? I hope you like it! 
Let me tell you more about it.

## Component authoring conventions

- **Content object:** each component accepts a `content` object for text, links, and simple data.
- **Props override order:** direct props win over `content` fields. Use sensible defaults inside the component.
- **Slots:** avoid `<slot />` unless a component cannot be expressed with `content` + props.
- **Required frontmatter comment:** every component must document its props and `content` shape.

Example frontmatter comment:
```astro
---
/*
Props:
- content?: { label?: string, href?: string, icon?: string }
- variant?: "solid" | "ghost"
- size?: "sm" | "md" | "lg"
Notes:
- direct props override content.*
*/
---
```
