# NOVA AI Frontend

React + Vite frontend for **NOVA : EMAIL MARKETER** — an AI-powered email marketing platform. Users sign up, craft AI-generated campaigns with NOVA, manage influencers/recipients, and track email performance from a unified dashboard.

This repo is the frontend only. It communicates with the [NOVA AI Backend](https://github.com/sunil998877/NOVA_AI_BACKEND) via REST API.

## What it does

1. User lands on the **Landing Page** and signs up or logs in (email/password or Google)
2. User crafts email copy using **Message Crafter** (NOVA AI writes subject + body + 4 follow-ups)
3. User builds a recipient list via **Find Influencers** → **My Influencers**
4. User creates and manages **Campaigns** (sender mailbox, schedule, status)
5. **Dashboard** shows live stats — total, delivered, opened emails
6. **Email Tracking** and **Newsletter Tracking** give per-email analytics

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v3 + custom CSS variables |
| UI Components | Radix UI primitives + custom components |
| Routing | react-router-dom v6 |
| Auth | JWT (stored client-side) + Google OAuth |
| Icons | Lucide React |
| Charts | Recharts |
| Animations | Framer Motion |
| Carousels | Embla Carousel |

## Pages & Routes

### Public Routes

| Route | Page | Description |
|---|---|---|
| `/` | `Landing.js` | Marketing landing page |
| `/login` | `Login.js` | Email/password + Google login |
| `/signup` | `Signup.js` | Registration form with reCAPTCHA |
| `/forgot-password` | `ForgotPassword.js` | Send password reset email |
| `/update-password` | `UpdatePassword.js` | Set new password via reset link |

### Protected Routes (requires JWT)

| Route | Page | Description |
|---|---|---|
| `/dashboard` | `Dashboard.js` | Main dashboard with stats & campaigns |
| `/dashboard-view` | `DashboardView.js` | Alternate dashboard layout |
| `/campaigns` | `Campaigns.js` | Campaign list, create, edit, delete |
| `/campaign-analytics` | `CampaignAnalytics.js` | Per-campaign performance metrics |
| `/message-crafter` | `MessageCrafter.js` | NOVA AI chat for email drafting |
| `/message-crafting` | `MessageCrafting.js` | Full email crafting workspace |
| `/email-management` | `EmailManagement.js` | Manage recipient email lists |
| `/email-tracking` | `EmailTracking.js` | Track open/click events per email |
| `/newsletter-tracking` | `NewsletterTracking.js` | Newsletter campaign analytics |
| `/find-influencers` | `FindInfluencers.js` | Search and discover influencers |
| `/my-influencers` | `MyInfluencers.js` | Saved influencer/recipient list |

Protected routes are wrapped in a `RequireAuth` guard — unauthenticated users are redirected to `/login`.

## Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── App.js               # Root component, routing, auth guard
│   ├── index.jsx            # Vite entry point
│   ├── components/
│   │   ├── AppSidebar.js    # Main navigation sidebar
│   │   ├── SiteHeader.js    # Top header bar
│   │   ├── CampaignFormDialog.js  # Create/edit campaign modal
│   │   ├── CampaignFilm.js  # Campaign card/film strip UI
│   │   ├── GoogleSignInButton.js  # Google OAuth button
│   │   ├── Recaptcha.js     # reCAPTCHA wrapper
│   │   ├── AnimatedParticles.js   # Background particle animation
│   │   ├── AppErrorBoundary.jsx   # Global error boundary
│   │   ├── landing/         # Landing page sub-components
│   │   └── ui/              # Radix UI + custom primitives
│   ├── pages/               # Page-level components (see routes above)
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── AuthContext.js   # Auth state & JWT management
│   │   └── theme.js         # Theme apply/get utilities
│   └── styles/              # Global CSS
├── .env                     # Environment variables (see below)
├── .env.example             # Environment variable template
├── jsconfig.json            # JS path aliases (@/*)
├── vite.config.js           # Vite + proxy config
├── tailwind.config.js       # Tailwind theme config
└── package.json
```

## Setup

### Prerequisites

- Node.js v18+
- NOVA AI Backend running on `http://localhost:3001`

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the `frontend/` root:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:3001

# Google OAuth Client IDs (from Google Cloud Console)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_GOOGLE_CLIENT_ID_ALT=your_alternative_google_client_id

# reCAPTCHA Site Key (from Google reCAPTCHA console)
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

> All env variables must start with `REACT_APP_` — Vite is configured to expose them via `process.env.REACT_APP_*`.

### 3. Run in development

```bash
npm run dev
```

App will be available at [http://localhost:5173](http://localhost:5173)

API calls to `/api/*` are automatically proxied to `http://localhost:3001` (configured in `vite.config.js`).

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve with:

```bash
npm run preview
```

## API Integration

All backend calls go through `process.env.REACT_APP_API_URL`. Protected API routes send the JWT in the `Authorization` header:

```
Authorization: Bearer <jwt>
```

The JWT is managed by `AuthContext` — it handles login, logout, and token persistence.

## Google Auth

1. User clicks **Sign in with Google** button
2. Google returns an ID token to the frontend
3. Frontend posts `{ idToken }` to `POST /api/auth/google`
4. Backend verifies and returns a JWT
5. App stores JWT and redirects to `/dashboard`

## Theme Support

The app supports light/dark themes managed via `lib/theme.js`. The active theme is persisted and applied on load in `App.js`.

## Scripts

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Build for production → dist/
npm run preview   # Preview production build locally
```
