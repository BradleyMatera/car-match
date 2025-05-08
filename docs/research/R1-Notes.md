# Research Notes – Week 1  
*Author: Bradley Matera*  
*Date: May 8, 2025*

## Topic: Design System and MVP Structure

This week I started working on the MVP of my Car Match project, a dating platform for car enthusiasts. The design process is focused on creating a clean, professional UI that feels real and usable even though it’s running on mock data. The core structure and layout planning are captured in my `designdoc.md` file.

I built a modal-based homepage that simulates login gating like Match.com. From there, I planned a full layout system that uses responsive grid logic and modular sections (like tiles, dashboards, and CTA buttons). The user flows have been outlined, including modal onboarding, profile view, settings, event RSVP, and dashboard logic. The frontend is structured in a way that it could later be connected to a real backend without major rewrites.

## Sub-Topic: UI/UX Design Reference

In the design doc, I break down each main page (Landing, Dashboard, Profile, Events, Settings, and About) with bullet points on what the UI should include. I’ve focused heavily on layout structure, form design, and component hierarchy. I also included thoughts on how controls should work on desktop vs. mobile and ensured the design stays accessible and easy to follow for users of all ages.

## Sub-Topic: Infrastructure and Technical Planning

I included a basic AWS architecture plan in the design doc. The frontend is meant to be hosted on S3 and served with CloudFront. The backend, if built later, would run on AWS Lambda or ECS. I’d use RDS (PostgreSQL) for structured data and Cognito for user auth. While this isn’t implemented yet, it shows the direction I plan to go if the app were to become live.

## Sub-Topic: Style Tile and Visual Design

I documented a basic style tile in the design doc including primary colors (#d19efa and #181818), card component designs, rounded corners, padding, and text hierarchy. The design choices are meant to be soft and modern, without being overstyled. Most of the inspiration comes from mainstream dating platforms but toned down for a niche community.

## Next Steps

- Transfer the content from `designdoc.md` into this markdown format each week.
- Create `R2-Notes.md` to begin logging Events page feedback flow and RSVP mock logic.
- Set up GitHub Issues and Project board to reflect features described in the design doc.
- Begin tagging features in commits based on layout zones (topnav, CTA, dashboard tiles, etc.)

## Repo

Main repo is live and public here:  
[https://github.com/BradleyMatera/car-match](https://github.com/BradleyMatera/car-match)