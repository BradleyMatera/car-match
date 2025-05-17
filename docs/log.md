# Log ...🚀 

# Project & Portfolio  
### Bradley Matera  

![Degree Program](https://img.shields.io/badge/degree-web%20development-blue.svg)&nbsp;  

<br>

## 📢 &nbsp; Weekly Stand Up

Each week I will summarize my milestone activity and progress by writing a stand-up. A stand-up is meant to be a succinct update on how things are going. Use these prompts as a guide on what to write about:

⚙️ Overview - What I worked on this past week  
🌵 Challenges - What problems did I have & how I'm addressing them  
🏆 Accomplishments - What is something I "leveled up" on this week  
🔮 Next Steps - What I plan to prioritize and do next  

<br>

### Week 1

⚙️ Overview:  
This week I started the Car Match project and built out the core MVP structure. I focused on designing the layout to feel like a real dating app, with a gated homepage modal, user onboarding, mock event cards, and a responsive layout. I built everything with future backend integration in mind and structured it to plug in later if needed.  

🌵 Challenges:  
A major challenge was figuring out the best way to simulate login and RSVP without having a backend. I ended up using localStorage and internal state to keep it functional for testing. Another challenge was spacing and layout on mobile—it took a few redesigns to get it balanced and clean.  

🏆 Accomplishments:  
This is the most polished frontend I’ve built from scratch. I’ve never been confident on the UI/UX side but I’m finally getting it. The project is using feature branch workflow properly now, and my planning is centralized in a living `designdoc.md`. I also made the repo public and started preparing to break down weekly milestones with proper issues.  

🔮 Next Steps:  
This week I’ll start transferring research and design breakdowns from `designdoc.md` into `R1-Notes.md`. I’m also setting up GitHub Project views, starting weekly issue tracking, and expanding the event system with better mock user behavior and error states. The layout system is locked in—now I just need to keep building.

### Week 2

Week 2

⚙️ Overview:
This week I added more logic and built out the mock API to behave more like a real backend. I got RSVP working in a way that actually connects to the user profile. When a user signs up for an event, it saves and shows up under “My Events” in their profile. I also cleaned up profile editing so users can change their bio, age, and car interests. You can even add cars to your garage now (just the UI part for now).

🌵 Challenges:
I ran into a few runtime errors because I didn’t have all the mock functions ready yet. Adding initMockData fixed one of the bigger issues. I also had to stop and rethink how data should be shared across components without breaking anything. Keeping the state synced without causing bugs is always tricky.

🏆 Accomplishments:
I leveled up on mock API structure big time. I added RSVP handling (rsvpToEvent, cancelRsvp), profile updates, user message retrieval, and full event linking. I also built out a full fake dataset: 10 user profiles, 12 unique events across the US, and 20 conversations between users. All the relationships are mapped so the app feels real now, not just empty UI.

🔮 Next Steps:
Next I’m going to focus on event creation logic and user relationships. Now that users can RSVP, I want to start making it so they can create and manage their own events. After that I’ll probably start testing out message handling and build logic for the chat system.

### Week 3

Stay tuned, this stand up is coming soon...

### Week 4

My final stand up...

<br>