# Entry Modal

First-run onboarding modal guiding users through initial profile capture.

```mermaid
graph TD
  EntryModal[EntryModal/] --> Index[index.js]
  EntryModal --> Styles[EntryModal.css]
```

- `index.js` — stateful component collecting car preference, demographics, and credentials before handing off to the caller.
- `EntryModal.css` — modal layout and form styling.
