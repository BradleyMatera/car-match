# CarMatch

## Application Definition Statement

I’m building a car enthusiast dating site that works like a real modern platform — not a gimmick. The idea is to combine dating and event culture for people who are actually into the car scene. Users can build a profile, showcase their cars, connect with other drivers, and attend local meets. Think of it like if Match.com and a car show app had a clean, focused baby. This project pushes my skills across frontend, backend, auth, real layout logic, and actually creating a niche social experience that feels live, not just a prototype.

## Target Market

My primary target market is U.S.-based car enthusiasts, ages 18–40, with a mix of casual interest to hardcore gearheads. A lot of them work in trades, retail, tech, or creative fields, and cars are their hobby or lifestyle. Based on TikTok lives and car Discord groups I’ve watched or been in, there's a big chunk of users who want more social interaction outside of Instagram. My secondary research includes sites like Match.com, DriveTribe, and dating app breakdowns from Pew Research. People are already blending events and dating — just not cleanly in one place.

## User Profile / Persona

**Name:** Jordan R.  
**Age:** 29  
**Location:** Phoenix, AZ  
**Job:** HVAC Tech  
**Hobbies:** Track days, JDM builds, BBQs, street meets  
**Tech Use:** Android, uses social media casually, prefers real websites over apps  
**Goals:** Wants to meet someone who understands the car life, can’t stand apps that feel fake or flooded with bots, wants something fun but legit.  
**Frustrations:** Tired of dating apps not letting him show off his actual lifestyle. Most platforms feel like they're built for influencers, not car people.

## Use Cases

- **Use Case: RSVP to an Event**
  - User lands on the Events page  
  - Scrolls to “Drift Day” and clicks the card  
  - Sees the image, date, schedule, and location  
  - Clicks “RSVP”  
  - The backend logs that RSVP and the event shows up in their profile

- **Use Case: Build a Profile**
  - User logs in for the first time and lands on the setup modal  
  - They fill out basic info, select car interests, upload garage photos  
  - Their profile is created and shows up in the Discover section  
  - Others can now view their build, bio, and message them

## Problem Statement

Most dating apps aren’t built around lifestyle. Car culture is a huge part of identity for a lot of people, but there’s no dedicated space where they can meet people who get it. Right now, people are forced to use generic platforms that don’t give them the tools or layout to share the lifestyle that actually matters to them.

## Pain Points

- Profiles on dating apps are too generic — you can’t talk about your car, your projects, your events  
- There’s no way to filter matches by car interests or event types  
- Local car events are scattered across different social media pages with no centralized way to find or RSVP  
- Users want real profiles, clean UX, and to feel like the app was made for them — not repurposed from a general audience

## Solution Statement

My app solves this by combining dating, profiles, and car events into one clean platform. The profile isn’t just a headshot and age — it includes your car builds, project updates, and events you’re going to. You can filter matches by car interests, chat, and plan meetups that aren’t awkward because everyone’s already into the same thing. What makes this different is that it’s *only* for this niche. It’s not trying to be everything — it’s specific, and that’s what makes it valuable.

## Competition

Direct competitors are traditional dating apps like Tinder, Bumble, and Match. None of them focus on car culture, and their filters and bios are too generic for this niche. Indirect competitors are Instagram and Facebook groups where car people meet up and post event invites, but there’s no real structure or way to meet new people that isn’t random. Sites like DriveTribe tried community building for gearheads, but didn’t touch dating or event linking.

## Features & Functionality

- **Profiles with Garage Showcase**  
  Users can upload cars, current projects, and link Instagram or YouTube builds  
  → solves the “my car is my identity” problem

- **Event Discovery & RSVP**  
  See upcoming events near you, RSVP, and comment  
  → solves the scattered event info and commitment issue

- **Match Filtering by Interest**  
  Filter potential matches by car type, event attendance, location  
  → solves the bad match relevance issue

- **Messaging**  
  Message people before or after events  
  → helps break the ice and connect naturally

- **Settings Dashboard**  
  Full control over account, payment (if added later), privacy, and visibility  
  → makes the app feel like a real platform, not a demo

## Integrations

- **Mock API (Custom)**  
  For now I’m using mock JSON data served through Express routes to simulate users and events  
- **Later Additions**  
  Google Calendar API for event sync, EmailJS for invites or reminders  
- **Visual Assets**  
  Using real car imagery pulled from Unsplash or Pexels API (license OK)  
- All integrations follow TOS and are used to simulate production logic for now — I’ll swap in real backend endpoints later.