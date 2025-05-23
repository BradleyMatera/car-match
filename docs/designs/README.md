# Designs.

This folder is for structure and design work. Use this README as a log of updates made to your design. Link to your Figma work below and only add images to this folder when your design work is complete.

### Links

* [Design Document](https://github.com/BradleyMatera/car-match/blob/main/car-match-mvp/designdoc.md)  
* [Live Repo](https://github.com/BradleyMatera/car-match)

<br>

# Log ...🚀 

Follow this format for your log entries:  

Date: May 6, 2025  
Update: Started full design breakdown inside `designdoc.md`. Documented layout plans for landing, profile, settings, and event pages. Established visual system using #d19efa and #181818 with soft UI components (rounded corners, consistent padding). Described card system, onboarding modal flow, and grid-based dashboard zones.

Date: May 8, 2025  
Update: Finalized layout structure for all views. Prioritized clarity and realism in UX flow. Documented AWS backend planning in case this frontend is extended later. Set up research structure to move into `/docs/research`. Design system and spacing logic are now locked in for this MVP.

Date: May 11, 2025
Update: The application now has a consistent, professional look and feel with a maintainable code structure. The layout system provides a solid foundation for future development, making it easy to add new features while maintaining visual consistency across all pages.

Date: May 17, 2025
Update: Polished UI interactions across the Events and Profile views. RSVP actions now reflect user state with clear visual feedback. Updated Profile view includes a clean “My Events” section with structured styling and consistent layout rules. Placeholder visuals were added for garage items and future messaging features. Mock data now drives all profile and event visuals, allowing the design to simulate real user activity. Began refining visual hierarchy on smaller screens to improve mobile responsiveness.


Date: May 22, 2025
Update: I got the whole advanced messaging system fully added back in and set up right. The profile page now shows all the messaging stuff directly, with tabs for Inbox, Unread, Sent, System, and Locked all working. Premium features are in too, like gender filters, radius sorting, locked messages that blur for free users, and daily message limits that trigger the upgrade modal. I didn’t remove anything from the mock API. Everything that was there before, like events, users, and messages, is still in place. I also added a bunch of fake data so the app feels full and active. The UI finally got the upgrade it needed, and now it looks clean and demo-ready. Login and signup are connected to the backend, the auth state holds across the session, and frontend and backend are talking with CORS fixed. Everything works how it’s supposed to, nothing is broken or missing, and it’s all set to show off.