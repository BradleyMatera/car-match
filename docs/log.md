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

⚙️ Overview:
This week I added more logic and built out the mock API to behave more like a real backend. I got RSVP working in a way that actually connects to the user profile. When a user signs up for an event, it saves and shows up under “My Events” in their profile. I also cleaned up profile editing so users can change their bio, age, and car interests. You can even add cars to your garage now (just the UI part for now).

🌵 Challenges:
I ran into a few runtime errors because I didn’t have all the mock functions ready yet. Adding initMockData fixed one of the bigger issues. I also had to stop and rethink how data should be shared across components without breaking anything. Keeping the state synced without causing bugs is always tricky.

🏆 Accomplishments:
I leveled up on mock API structure big time. I added RSVP handling (rsvpToEvent, cancelRsvp), profile updates, user message retrieval, and full event linking. I also built out a full fake dataset: 10 user profiles, 12 unique events across the US, and 20 conversations between users. All the relationships are mapped so the app feels real now, not just empty UI.

🔮 Next Steps:
Next I’m going to focus on event creation logic and user relationships. Now that users can RSVP, I want to start making it so they can create and manage their own events. After that I’ll probably start testing out message handling and build logic for the chat system.

### Week 3

⚙️ Overview:
This week I focused on finally getting the advanced messaging system built out the way it was supposed to be. I added full tab support for Inbox, Unread, Sent, System, and Locked messages, and made sure the whole thing shows up on the profile page like we planned. I also set up the premium features—locked messages blur out if you’re a free user, and filters like gender and distance are only usable if you’re premium or dev. Daily limits are in too, and they trigger the upgrade modal when hit. I connected all of this to the backend, made sure auth stays active through the context, and confirmed the frontend and backend are syncing properly.

🌵 Challenges:
Biggest issue was that the UI didn’t match what the system needed. I had to go in and restructure the whole messaging section so it actually looked and felt like a real system, not just static data. I also had to clean up a bunch of mock data problems—stuff was missing or removed, and I had to add it all back in and make sure it felt populated enough for demo use. Just getting the messaging logic and layout to sync with real user states was a grind.

🏆 Accomplishments:
The messaging system is fully working now, and the UI actually reflects all the premium logic. The whole thing is hooked to the backend and feels like a real feature. Profile pages look alive, messages are categorized properly, and I added a ton of fake data so nothing feels empty. I also cleaned up the login/signup flow and made sure the session state stays consistent across pages. Honestly, it looks and works way better now.

🔮 Next Steps:
Next, I’m going to work on letting users create their own events. The RSVP system already works, but now that the profile and messaging side is solid, it makes sense to give users the ability to actually post and manage events too. I’ll probably also polish a few UI things and make sure the message filters behave exactly how they should across user types.

### Week 4

My final stand up...

<br>