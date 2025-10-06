# Public Assets

Static files bundled into the production build by Create React App.

```mermaid
graph TD
  Public[public/] --> Index[index.html]
  Public --> Manifest[manifest.json]
  Public --> Robots[robots.txt]
  Public --> Favicon[favicon.ico]
  Public --> Icons[logo192.png]
  Public --> Icons512[logo512.png]
  Public --> NotFound[404.html]
```

- `index.html` — HTML shell injected with the compiled React bundle.
- `manifest.json` — PWA metadata consumed by CRA.
- `robots.txt` — crawler directives.
- `404.html` — fallback page for GitHub Pages routing.
- `logo192.png` / `logo512.png` / `favicon.ico` — app icons.
