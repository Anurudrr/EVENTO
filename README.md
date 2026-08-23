# 🎪 EVENTO — Premium Event Marketplace

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://evento-six-livid.vercel.app)
[![CI](https://github.com/Anurudrr/EVENTO/actions/workflows/ci.yml/badge.svg)](https://github.com/Anurudrr/EVENTO/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)]()
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://evento-six-livid.vercel.app)

> A cinematic, full-stack event marketplace built with React 19 + Express + MongoDB. Book photographers, venues, decorators, and planners — all in one elevated flow.

---

## 🌐 Live

**[https://evento-six-livid.vercel.app](https://evento-six-livid.vercel.app)**

---

## ✨ Key Features

### 💳 UPI QR Payment System
Custom-built QR-based payment flow with seller verification, transaction ID (UTR) validation, and email confirmation. Built **without Razorpay** to work without a registered business domain. The system:
- Generates a per-booking UPI deep link and QR code
- 10-minute countdown timer with auto-expiry
- Buyer submits UTR reference after payment
- Seller verifies or rejects from their dashboard
- Both parties receive email notification on resolution
- Automatic 5-second status polling after UTR submission

### 🎨 Cinematic Design System
- Custom "Noir" aesthetic with CSS custom properties
- GSAP-powered hero animations with parallax and tilt effects
- Framer Motion page transitions and micro-animations
- 3D service card tilt on pointer move
- Custom cursor with context-aware labels

### 🔐 Authentication
- OTP-based email login (no plain passwords stored)
- Google OAuth via `google-auth-library`
- JWT access tokens with role-based route protection
- Organizer verification workflow (admin-approved)

### 📦 Service Management
- Sellers create and edit listings with images, pricing, availability, and policy fields
- Cloudinary image uploads with magic-byte validation
- Interactive Leaflet map for pinning service location
- Availability calendar with blocked-date management

### 📊 Dual-Role Dashboards
- **Buyer Dashboard**: bookings, wishlist, payment history, chat
- **Seller Dashboard**: incoming bookings, payment verification, revenue stats, service management
- **Admin Dashboard**: user management, organizer verification, payment oversight

### 🔔 Notifications
- In-app notification bell with unread count badge
- Server-side notification stream (SSE-ready)
- Polling fallback (20s interval, pauses when tab is hidden)

### 🗺️ Location Features
- Buyer pins their desired service location on a map at booking time
- Seller sees both the venue pin and their own service pin
- One-tap Google Maps directions link

### 🔍 Shareable Search & Filters
- All filters (search, category, location, price, rating, sort) synced to URL params
- Deep-linkable filtered result pages
- 300ms debounced search to reduce API calls

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Animations | Framer Motion, GSAP 3, Three.js |
| Routing | React Router v7 |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB Atlas, Mongoose 9 |
| Auth | JWT, Bcrypt, Google OAuth |
| Payments | Custom UPI QR (no gateway dependency) |
| Email | Nodemailer (SMTP + mock dev fallback) |
| Maps | Leaflet, React Leaflet |
| Images | Cloudinary (with magic-byte upload validation) |
| Hosting | Vercel (frontend + serverless backend) |
| Security | Helmet, express-rate-limit, express-mongo-sanitize, Joi |

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- MongoDB Atlas connection string
- (Optional) SMTP credentials for email

### Setup

```bash
# Clone the repository
git clone https://github.com/Anurudrr/EVENTO.git
cd EVENTO

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, etc.

# Start development server (frontend + backend together)
npm run dev
```

The app runs at **http://localhost:3000** in development (frontend served via Vite middleware).

### Environment Variables

See [`.env.example`](.env.example) for all required variables. Key ones:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret (32+ chars) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_USER` | Email SMTP username |
| `SMTP_PASS` | Email SMTP password |
| `VITE_API_URL` | Backend API base URL |

---

## 📁 Project Structure

```
EVENTO/
├── src/                    # Frontend (React + Vite)
│   ├── components/         # Reusable UI components
│   ├── context/            # React contexts (Auth, Toast, Theme)
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Route pages
│   ├── sections/           # Page sections (Hero, Footer, etc.)
│   ├── services/           # API service clients
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── server/                 # Backend (Express + TypeScript)
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, validation, error handling
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routers
│   └── utils/              # Server utilities (mailer, cloudinary, etc.)
├── api/                    # Vercel serverless entry point
└── public/                 # Static assets
```

---

## 🔒 Security

- **Helmet**: HTTP security headers
- **Rate limiting**: 5 req/15min on OTP, 10/15min on login, 10/15min on payment
- **MongoDB injection**: `express-mongo-sanitize` on all API requests
- **File uploads**: MIME + magic-byte validation, filename sanitization, 5MB max
- **Input validation**: Joi schemas on all POST/PUT routes
- **CORS**: Configurable origin whitelist via `CORS_ORIGINS` env variable

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions and PR guidelines.

---

## 👤 Author

Built by **Anurudr** — [GitHub](https://github.com/Anurudrr)

---

## 📄 License

MIT
