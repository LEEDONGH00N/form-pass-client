# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Form PASS is an event management platform for event creation, registration, and QR-based check-in. Built with React 19 + TypeScript, Tailwind CSS, and Create React App.

## Commands

```bash
npm start        # Start dev server (port 3000)
npm run build    # Create production build
npm test         # Run tests in watch mode
```

## Architecture

### Tech Stack
- React 19 + TypeScript 5.9
- React Router 7 for routing
- Axios with Bearer Token auth (stored in localStorage)
- Tailwind CSS 3.4 for styling
- SweetAlert2 for modals/dialogs
- @dnd-kit for drag-and-drop image ordering
- @uiw/react-md-editor for markdown editing
- qrcode.react + @yudiel/react-qr-scanner for QR handling
- lucide-react for icons

### Project Structure
```
src/
├── api/           # API clients (authApi.tsx, eventApi.ts)
├── types/         # TypeScript interfaces (event.ts)
├── constants/     # API URLs (api.ts) and UI constants (ui.ts)
├── pages/
│   ├── HomePage.tsx, LoginPage.tsx, SignupPage.tsx
│   ├── host/      # Host dashboard, event creation, check-in
│   └── guest/     # Event landing, ticket view, lookup
└── App.tsx        # Route definitions
```

### Key Routes
- `/` - Landing page
- `/login`, `/signup` - Authentication
- `/host/dashboard` - Host event list
- `/host/create`, `/host/edit/:eventId` - Event creation/editing (same component)
- `/host/events/:eventId` - Check-in management with QR scanner
- `/:eventCode` - Guest event registration page
- `/ticket/:qrToken` - Guest ticket view
- `/lookup` - Ticket lookup by name/phone

### API Configuration
- Production: `https://api.form-pass.life` (when `NODE_ENV === 'production'`)
- Development: `http://localhost:8080` (override with `REACT_APP_API_URL` env var)
- Two axios instances:
  - `authAxios` from `authApi.tsx` - includes Bearer token interceptor for authenticated requests
  - `apiClient` from `eventApi.ts` - for public guest-facing endpoints (uses `API_HOST` from constants)

### Domain Models
Key types in `src/types/event.ts`:
- `EventDetail` - Event with title, location, images, schedules, questions
- `Schedule` - Time slot with capacity tracking (maxCapacity, reservedCount)
- `Question` - Form field (TEXT, SELECT, CHECKBOX types)
- `ReservationRequest` - Guest registration data

### Patterns
- No global state management; pages use local useState/useEffect
- Bearer Token authentication: token stored in localStorage as `accessToken`
- Use `authAxios` from `src/api/authApi.tsx` for all authenticated (host) requests
- S3 presigned URLs for image uploads via `/api/host/s3/presigned-url`
- Markdown support for event descriptions (MDEditor component)
- Phone numbers formatted as `010-####-####` (auto-formatted on input)
- Images support both `images[]` array and legacy `thumbnailUrl` field
- SweetAlert2 theme constants defined per-component with custom Tailwind classes
- Font: Pretendard (applied via `font-[Pretendard]` class)
