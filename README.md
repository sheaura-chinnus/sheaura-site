# Sheaura — E-Commerce Platform

Sheaura is a modern, high-performance sales-only e-commerce platform specializing in:
- **Imitation Jewellery & Bridal Sets**
- **Fashion Accessories & Hair Adornments**
- **Cosmetics & Beauty Products**
- **Occasion Ornaments**

> **Important Compliance Note:** Sheaura is strictly a **sales-only** catalogue for fashion accessories and imitation jewellery. Products are never marketed or described as genuine precious gold, sterling silver, natural diamonds, or precious gemstones.

---

## Architecture & Technology Stack

```
                          ┌─────────────────────────────┐
                          │   Cloudflare Pages (Edge)   │
                          │   React 18 + Vite + Tailwind│
                          └──────────────┬──────────────┘
                                         │ tRPC Client + HTTPS + Cookies
                                         ▼
                          ┌─────────────────────────────┐
                          │    Render Web Service       │
                          │   Node.js + Express + tRPC  │
                          └──────┬───────────────┬──────┘
                                 │               │
                 Pooler (pg)     │               │ connect-pg-simple
                                 ▼               ▼
                          ┌─────────────────────────────┐
                          │     Neon PostgreSQL         │
                          │   Drizzle ORM + Sessions    │
                          └─────────────────────────────┘
```

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, `@trpc/client`, `@tanstack/react-query`, Lucide React.
- **Backend:** Node.js, Express, TypeScript, `@trpc/server`, Passport.js, `express-session`, `connect-pg-simple`.
- **Database:** Neon Serverless PostgreSQL with Drizzle ORM (`drizzle-orm/node-postgres`).
- **Hosting Targets:**
  - **Backend:** Render (`srv-da7q4l1srm7s739v2etg` — Node.js Web Service on Free Tier).
  - **Frontend:** Cloudflare Pages (Free Tier, static edge hosting) or Render unified static hosting.
  - **Database:** Neon PostgreSQL (Free Tier, serverless branching, auto-suspend).

---

## Key Features

### Customer Experience
- **Product Catalogue:** Category filtering, search, sorting, tag filtering, responsive image carousels.
- **WhatsApp Order Flow:** Direct WhatsApp enquiry generation with order summary and customer details.
- **Customer Accounts:** Mobile OTP login (10-minute expiry with rate limiting), Google Sign-In, and email/password.
- **Address Book & Order History:** Saved customer shipping addresses and live order tracking.

### Admin Dashboard (`/admin`)
- **Product Management:** Full CRUD, image uploads (with DB storage fallback), stock tracking, price management.
- **Category & Collection Management:** Dynamic hierarchy, slug generation, active/inactive toggles.
- **Inventory Control:** Automatic atomic stock deduction upon order creation, automatic stock restoration upon cancellation or rejection, and real-time low-stock alerts.
- **Enquiry & Order Management:** Status lifecycle (`pending`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `rejected`), customer lookup, and WhatsApp direct messaging.
- **Site Settings & Media:** Customizable banners, brand metadata, and theme customization.
- **Security & Audit Logs:** Role-based access control (`user`, `shop_order_receiver`, `admin`), action auditing.

---

## Authentication & Session Management

- **PostgreSQL Session Store:** Replaced in-memory storage with `connect-pg-simple` backed by Neon PostgreSQL (`session` table), ensuring user logins survive server restarts and zero-downtime redeployments.
- **Mobile OTP:** Rate-limited OTP generation with SHA-256 hash validation, 10-minute validity, and production sanitization (demo codes never exposed in production responses).
- **Google OAuth 2.0:** Streamlined one-click Google Sign-In with automatic account linking.
- **CSRF Protection:** Double-submit cookie CSRF tokens generated per session and validated on mutating endpoints.
- **Private Preview Access:** Optional link-based VIP gating (`?access=YOUR_TOKEN`) setting a 30-day secure cookie for pre-launch preview access.

---

## Modular Extension Architecture (`server/extensions`)

The codebase includes plug-and-play interfaces ready for future third-party integrations without breaking changes:
- `IPaymentProvider` — Razorpay, Cashfree, or Stripe checkout session creation, webhook verification, and refund dispatch.
- `IShippingProvider` — Shiprocket or Delhivery rate calculation, label generation, and shipment tracking.
- `INotificationProvider` — SMS, WhatsApp Cloud API, and transactional email dispatch.
- `ICouponEngine` — Percentage and flat-rate discount validation with minimum spend and category constraints.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
# Database (Neon PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Server
PORT=4000
NODE_ENV=production

# Session (Required - min 32 random characters)
SESSION_SECRET=your-32-character-random-session-secret

# Admin Dashboard Password (Required to unlock /admin portal in production)
ADMIN_PASSWORD=your-secure-admin-password

# Client URL (for CORS and redirects)
CLIENT_URL=https://sheaura-site.onrender.com

# Cross-Site Cookie Support (Set to 'true' for separate Cloudflare Pages frontend)
CROSS_SITE_COOKIES=false

# Additional CORS Allowed Origins (comma-separated)
ADDITIONAL_ALLOWED_ORIGINS=https://sheaura.pages.dev

# Private Preview Access Token (Optional: requires '?access=token' or access cookie)
PRIVATE_ACCESS_TOKEN=sheaura-vip-2026

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon serverless instance)

### Installation
```bash
npm install
```

### Database Push
Push the Drizzle ORM schema to your database:
```bash
npm run db:push
```

### Running the App
Start both backend and Vite dev server concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API & tRPC: `http://localhost:4000`

### Testing
Run the complete automated test suite (67 unit & integration tests):
```bash
npm test
```

### Production Build
```bash
npm run build
```
This builds the client to `dist/` and compiles the server TypeScript to JavaScript in `dist/server/`.

---

## Deployment Guide

### 1. Render (Backend Web Service)
1. Fork or push this repository to GitHub.
2. Create a **Web Service** on Render pointing to your repository and the `staging-without-rental` branch.
3. Configure the service:
   - **Environment:** Node
   - **Build Command:** `npm ci --include=dev && npm run build`
   - **Start Command:** `npm start`
4. Add the Environment Variables:
   - `DATABASE_URL` (from Neon)
   - `SESSION_SECRET` (generate random 32+ string)
   - `ADMIN_PASSWORD` (secure password for `/admin`)
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = `https://<your-service-name>.onrender.com` (or your custom domain)
   - `PRIVATE_ACCESS_TOKEN` = `sheaura-vip-2026` (optional VIP link gate)
5. Deploy service.

### 2. Cloudflare Pages (Frontend — Optional Split Deployment)
1. Connect repository to Cloudflare Pages.
2. Build configuration:
   - **Framework preset:** None / Vite
   - **Build command:** `npm run build:client`
   - **Build output directory:** `dist`
3. Environment variables:
   - `VITE_API_URL` = `https://<your-render-service>.onrender.com`
4. In Render backend settings:
   - Set `CROSS_SITE_COOKIES=true`
   - Add `https://<your-pages-project>.pages.dev` to `ADDITIONAL_ALLOWED_ORIGINS`

---

## Render Management CLI Tool

A custom helper CLI is included in `scripts/render.ts`:

```bash
# Check service status, deployment state, and recent events
npm run render status

# Trigger an immediate manual deploy
npm run render deploy

# Stream recent service build/runtime logs
npm run render logs

# List environment variables
npm run render env:list

# Update or add an environment variable
npm run render env:set KEY=VALUE
```

---

## Project Structure

```
sheaurasite/
├── client/                     # Frontend React 18 Application
│   ├── src/
│   │   ├── components/         # Reusable UI components & layouts
│   │   ├── hooks/              # Custom React hooks (auth, cart, etc.)
│   │   ├── lib/                # tRPC client, query client, utilities
│   │   ├── pages/              # Route pages (Catalogue, Product, Admin, etc.)
│   │   ├── App.tsx             # Main router with code splitting (React.lazy)
│   │   └── main.tsx            # Entry point with dynamic API URL resolution
├── server/                     # Backend Node.js Express Application
│   ├── __tests__/              # Vitest automated test suites (67 tests)
│   ├── db/
│   │   ├── index.ts            # Neon PostgreSQL connection pool & Drizzle ORM
│   │   └── schema.ts           # Drizzle schema (products, users, orders, sessions)
│   ├── extensions/             # Future feature extension interfaces & adapters
│   ├── trpc/
│   │   ├── routers/            # tRPC routers (auth, products, enquiries, etc.)
│   │   └── index.ts            # Root router & procedures (admin, staff, public)
│   └── index.ts                # Express server, session store, CSRF & security gates
├── scripts/
│   └── render.ts               # Render deployment & environment management CLI
├── drizzle.config.ts           # Drizzle Kit configuration
├── vite.config.ts              # Vite configuration with chunk splitting
└── vitest.config.ts            # Vitest configuration
```

---

## License & Intellectual Property
All rights reserved © Sheaura. Proprietary e-commerce software.
