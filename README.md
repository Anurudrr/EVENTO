# EVENTO

EVENTO is a full-stack event marketplace where attendees can discover and book event services, while organizers can create listings, manage bookings, and grow their presence on the platform.

The project combines a React + Vite frontend with an Express + MongoDB backend and supports real authentication, wishlist management, reviews, bookings, contact submissions, and vendor dashboards.

## Features

### Attendee features
- User signup and login
- Browse and search event services
- Filter by category, location, price, and rating
- View event details
- Save services to wishlist
- Book event services
- View and cancel bookings
- Update profile
- Submit reviews

### Organizer features
- Organizer signup and login
- Create event listings
- Upload listing images
- View own events
- Delete events
- View organizer bookings
- Access organizer dashboard

### Platform features
- Protected routes
- JWT authentication
- MongoDB persistence
- Contact form submission
- Review and rating support
- Responsive frontend
- Production build support

## Tech Stack

### Frontend
- React 19
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- GSAP
- React Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT
- Bcrypt
- Multer
- Joi

## Project Structure

```text
src/
  components/
  context/
  layouts/
  pages/
  sections/
  services/
  types/
  utils/

server/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
```

## Local Setup

### Prerequisites
- Node.js 20+
- npm
- MongoDB local instance or MongoDB Atlas

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Create a `.env` file in the project root and copy values from `.env.example`.

Example:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/evento
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### 3. Start the app

```bash
npm run dev
```

The app runs on:

- Frontend + backend server: `http://localhost:3000`

Image uploads require valid Cloudinary credentials in `.env`. The rest of the app can run without them, but event/profile image uploads will fail until they are configured.

### 4. Validate before deployment

```bash
npm run lint
npm run build
```

## Main API Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Events
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`

### Bookings
- `POST /api/bookings`
- `GET /api/bookings/mybookings`
- `GET /api/bookings/organizer`
- `DELETE /api/bookings/:id`

### Users
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users/wishlist`
- `POST /api/users/wishlist/:eventId`
- `DELETE /api/users/wishlist/:eventId`

### Reviews
- `GET /api/reviews/:eventId`
- `POST /api/reviews/:eventId`
- `DELETE /api/reviews/:id`

### Contact
- `POST /api/contact`

### Health
- `GET /api/health`

## Deployment Overview

Recommended stack:

1. Frontend on Vercel
2. Backend on Render
3. Database on MongoDB Atlas

High-level flow:

1. Create MongoDB Atlas cluster
2. Deploy backend to Render
3. Add backend environment variables
4. Deploy frontend to Vercel
5. Point frontend API base/config to backend domain if needed
6. Update backend `CORS_ORIGIN` with frontend domain

## Screenshots

Add screenshots here after deployment:

```md
![Home Page](./screenshots/home.png)
![Services Page](./screenshots/services.png)
![Event Detail](./screenshots/event-detail.png)
![Buyer Dashboard](./screenshots/buyer-dashboard.png)
![Seller Dashboard](./screenshots/seller-dashboard.png)
```

Suggested screenshots:
- Home page
- Explore / services page
- Event details page
- Wishlist / bookings dashboard
- Organizer dashboard
- Create event modal

## Testing Checklist

### Attendee flow
- Register as attendee
- Login successfully
- Browse events
- Search and filter
- Save to wishlist
- Open event detail page
- Book an event
- View booking in dashboard
- Cancel booking
- Update profile
- Submit a review

### Organizer flow
- Register as organizer
- Login successfully
- Open seller dashboard
- Create a new event
- Upload images
- View listing in events page
- Receive booking from attendee account
- Confirm booking appears in organizer dashboard

### Contact flow
- Submit contact form
- Verify data is stored in MongoDB

## Future Improvements

- Edit event flow for organizers from dashboard UI
- Booking quantity selector on event page
- Better organizer messaging system
- Admin dashboard
- Payment gateway integration
- Cloud image storage instead of local uploads
- Email notifications
- Automated tests
- CI/CD pipeline

## Production Notes

- Use a strong `JWT_SECRET`
- Restrict `CORS_ORIGIN` to your real frontend domain
- Persist or externalize uploads in production
- Use MongoDB Atlas backups and monitoring
- Run behind HTTPS only

## License

This project is for portfolio and educational use unless you choose to license it differently.
