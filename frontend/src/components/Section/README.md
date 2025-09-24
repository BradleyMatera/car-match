# Section Wrapper

Semantic `<section>` wrapper with optional background themes and spacing presets.

```mermaid
graph TD
  SectionDir[Section/] --> Index[index.js]
  SectionDir --> Styles[Section.css]
  SectionDir --> Test[Section.test.js]
  Index --> Container
```

- `index.js` — renders a section with configurable spacing/background and optional `Container` wrapper.
- `Section.css` — handles spacing tokens and background modifiers.
- `Section.test.js` — ensures class composition logic works as intended.
