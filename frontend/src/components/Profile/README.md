# Profile Hub

Profile dashboard combining user bio editing, garage showcase, event ownership, and messaging shortcuts.

```mermaid
flowchart TD
  ProfileDir[Profile/] --> Index[index.js]
  ProfileDir --> Styles[Profile.css]
  ProfileDir --> Cards[profile.cards.css]
  Index --> Section[../Section]
  Index --> Grid[../Grid]
  Index --> Spacing[../Spacing]
  Index --> ApiClient[../../api/client.js]
  Index --> AuthCtx[../../context/AuthContext]
```

- `index.js` — complex view handling profile edits, preference toggles, premium gating, and personal event/message data.
- `Profile.css` — primary styling for profile layout and modular cards.
- `profile.cards.css` — supplemental card-specific styling.
