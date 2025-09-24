# Settings Page

Static profile/settings dashboard presenting account, notification, and security actions.

```mermaid
graph TD
  SettingsDir[Settings/] --> Index[index.js]
  SettingsDir --> Styles[Settings.css]
  Index --> Section[../Section]
  Index --> Grid[../Grid]
```

- `index.js` — renders the settings overview cards and action buttons.
- `Settings.css` — card layout, iconography, and danger zone styling.
