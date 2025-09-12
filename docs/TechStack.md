# Tech Stack

Fill out the headings below with your Tech Stack information. List the tools and technology you would like to use for your final project. Explain your reasoning for this as well. For example, how does the proposed tool or technology provide value to your overall portfolio of work? 

## Application Design

Design and implementation are browser‑first with live React components and plain CSS. The layout system uses simple, reusable CSS classes and component‑scoped styles; no Tailwind is currently in use. I reference production patterns from real apps and keep the experience custom to highlight structure and UX choices.

## Front End Framework

React (Create React App). Functional components with hooks (`useState`, `useEffect`, context for auth). Routing via React Router using `HashRouter` so GitHub Pages works without server rewrites. Styles are plain CSS modules/files.

## State Management

Local component state + `AuthContext` (context + localStorage) for session state. Frontend talks to a real backend via a thin API client; tokens are stored client‑side for authenticated calls.

## Node

Backend runs on Node 18 with Express 5. It exposes JWT‑based auth, messaging, events, and forums APIs, with CORS hardening and token versioning.

## Express

Express routes are feature‑oriented (auth, messages, events, forums). JSON body parsing, JWT middleware, and CORS are configured. Forums persist when a MongoDB URI is set.

## Database

MongoDB Atlas with Mongoose models (`User`, `Event`, `Message`, `ForumThread`, `ForumPost`). When `MONGODB_URI` is unset, the server uses in‑memory stores so the app remains usable.
