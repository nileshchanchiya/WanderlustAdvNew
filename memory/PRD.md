# Itinera — Product Requirements Document

## Original Problem Statement
Create a fully functional production-ready itinerary app.

## User Choices (verbatim)
- Itinerary types: **Travel trips + Event/conference schedules + flexible generic itineraries**
- AI auto-generation: **No — manual only**
- Authentication: **JWT email/password**
- Features: **Map view, Budget/expense tracker, Packing checklist, Export to PDF**
- Design vibe: **Minimal & clean (Linear/Notion-like)**

## Architecture
- **Backend:** FastAPI + MongoDB (Motor). All routes prefixed `/api`.
- **Auth:** Bcrypt password hashing + PyJWT (HS256). Access token (15 min) + refresh token (7 days) set as httpOnly cookies (`samesite=none; secure`). Brute-force lockout keyed by **email** (5 attempts / 15 min window).
- **Frontend:** React 19 + React Router 7 + Axios (`withCredentials: true`) + Tailwind + shadcn/ui. Sonner for toasts.
- **Map:** Leaflet + react-leaflet with Carto "light_all" tile layer (no API key needed).
- **PDF:** html2canvas + jsPDF, rendered from a hidden DOM node for consistent typography.
- **Charts:** Recharts (pie chart for budget breakdown).

## Design System
- **Fonts:** Cabinet Grotesk (display), Satoshi (body), JetBrains Mono (numbers). Loaded via Fontshare + Google Fonts.
- **Colors:** Terracotta `#DE6242` (primary), Alabaster `#FCFCFB` (background), neutral grayscale. No shadows — 1 px borders only.
- **Radius:** 10 px default.
- **Layout:** 12-col asymmetric layouts, generous spacing, label-caps metadata.

## Implemented (2026-02)
- ✅ Landing page with editorial hero + feature grid + CTA
- ✅ JWT auth (register / login / logout / me / refresh) with httpOnly cookies
- ✅ Admin auto-seed on startup, brute-force protection by email
- ✅ Protected routes + AuthContext
- ✅ Dashboard with itinerary cards (travel / event / generic), empty state
- ✅ Create/Edit itinerary modal (title, type, destination, date range, budget limit, currency, emoji cover, description)
- ✅ Itinerary detail with 5 tabs: Overview, Timeline, Map, Budget, Packing
- ✅ Timeline with day grouping, categorised events (activity / food / transport / stay / meeting)
- ✅ Map tab with markers, connecting polyline
- ✅ Budget tab with expense CRUD, running total vs. limit, pie chart by category
- ✅ Packing tab with categorised checklist + progress bar
- ✅ Export to PDF (full itinerary snapshot)
- ✅ Logout + toast notifications

## Test Status
- Backend: 17/17 tests passing after fixes (brute-force + tz datetime + logout + ItineraryUpdate None filter)
- Frontend: 100 % of critical flows (signup, dashboard, create, tabs, edit, logout, protected route)

## Personas
1. **Solo traveller** planning a multi-city trip and wanting a calm timeline, map and expense log.
2. **Event organiser** mapping out a 2-day conference schedule for their team.
3. **Weekend planner** drafting a simple multi-day generic plan.

## Prioritised Backlog
### P1 (next)
- Collaborative sharing (invite co-travellers by email to edit an itinerary)
- Drag-and-drop reordering of timeline events
- Duplicate itinerary / template gallery
- Password reset flow (endpoint stubs exist, needs email integration)

### P2
- Geocoding on the fly so users don't have to paste lat/lng manually
- Currency conversion in budget
- Timeline view grouped by week for long trips
- Attach images / links to events
- Mobile-first gesture refinements

### P3
- Offline PWA + local cache
- iCal export & calendar sync
- Public share URL with read-only view
- AI assist (off by default — opt-in)
