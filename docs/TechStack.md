# Tech Stack

Fill out the headings below with your Tech Stack information. List the tools and technology you would like to use for your final project. Explain your reasoning for this as well. For example, how does the proposed tool or technology provide value to your overall portfolio of work? 

## Application Design

I’m designing directly in the browser using live HTML, CSS, and React. I don’t use Figma because I move faster just building it out and adjusting the layout visually as I go. I’ve used Tailwind CSS throughout the project to help with layout, spacing, and structure. I’ve looked at UI kits like Flowbite and Match.com itself for inspiration but I’m keeping the design custom to make it feel more like a real app instead of a copy. This lets me show off my frontend structure and how I handle UX choices live in the browser. If I need to pull in UI patterns, I’ll reference real sites and keep the experience production-focused.

## Front End Framework

I’m using React for the frontend. I’ve already built most of the core features using functional components, props, and hooks like useState and useEffect. I’m not using TypeScript or CRA — I started with my own structure so I could have full control. I’ve been using React Router for navigation and Tailwind CSS for all layout and styling. Everything is modular, clean, and actually works like a real app, not just a demo.

## State Management

I’m handling state using useState and localStorage. For now I’ve got a fake login that locks users out of the rest of the site unless they “sign in” through the modal. It stores the mock user data in localStorage and updates views through props and internal state. I’m avoiding Redux or anything heavy until it’s needed. Later I’ll plug in token-based auth or maybe Firebase, but everything is already structured so I can just switch it out when the backend is live.

## Node

I’ve got Node running the backend. The app is structured with `server.js`, `app.js`, and my routes/controllers in their own folders. I’m using npm to manage everything and I already set it up to serve static files and mock API data. Later it’ll serve the real frontend build and the live API. I’m building this the way I’d prep something for production so I don’t have to refactor everything once I go live.

## Express

I’m using Express for the backend. Routes and controllers are broken up by feature — events, users, settings, RSVPs — all with their own logic and middleware. I’ve already got body parsing and JSON handling working, and everything is written like a real API even though the data is mocked for now. When I do hook it up to a real DB, it’ll be as simple as connecting models and updating the route logic.

## SQL/Postgres/Sequelize

I’ve used Sequelize before and I know how to write migrations, models, and seeds. Right now I’m sticking with hardcoded mock data to keep the flow fast, but the backend is already built like it’s going to plug into Postgres. I’ve mapped out models like Users, Cars, Events, RSVPs, and I’ll set them up with validation, constraints, and full CRUD once I add the DB layer. The way I wrote the app lets me switch from mock to real data without having to restructure anything.