# Sign Up Form

User registration screen with client-side validation before calling the backend.

```mermaid
graph TD
  SignUpDir[SignUp/] --> Index[index.js]
  SignUpDir --> Styles[SignUp.css]
  Index --> ApiClient[../../api/client.js]
  Index --> AuthCtx[../../context/AuthContext]
```

- `index.js` — gathers profile inputs, enforces validation (email, password strength, tag format, state), and posts to `registerUser`.
- `SignUp.css` — theming and background for the form.
