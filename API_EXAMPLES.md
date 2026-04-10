# EVENTO API Examples

## Authentication

### Register User
**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Login User
**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
**GET** `/api/auth/me`
*Headers: `Authorization: Bearer <token>`*

---

## Events

### Get All Events
**GET** `/api/events`
*Query Parameters: `search`, `category`, `sort`, `page`, `limit`*
Example: `/api/events?category=Music&sort=-price&page=1&limit=5`

### Get Single Event
**GET** `/api/events/:id`

### Create Event (Admin Only)
**POST** `/api/events`
*Headers: `Authorization: Bearer <admin_token>`*
```json
{
  "title": "Summer Music Festival",
  "description": "A grand music festival under the sun.",
  "date": "2024-07-15T18:00:00Z",
  "location": "Central Park, NY",
  "category": "Music",
  "imageUrl": "/uploads/image-123456789.jpg",
  "price": 50,
  "availableSeats": 500,
  "totalSeats": 500,
  "badge": "Trending"
}
```

### Update Event (Admin Only)
**PUT** `/api/events/:id`
*Headers: `Authorization: Bearer <admin_token>`*

### Delete Event (Admin Only)
**DELETE** `/api/events/:id`
*Headers: `Authorization: Bearer <admin_token>`*

---

## Bookings

### Book an Event
**POST** `/api/bookings`
*Headers: `Authorization: Bearer <token>`*
```json
{
  "eventId": "event_id_here",
  "seats": 2
}
```

### Get My Bookings
**GET** `/api/bookings/my`
*Headers: `Authorization: Bearer <token>`*

### Cancel Booking
**PUT** `/api/bookings/:id/cancel`
*Headers: `Authorization: Bearer <token>`*

---

## User Profile & Wishlist

### Get Profile
**GET** `/api/users/profile`
*Headers: `Authorization: Bearer <token>`*

### Update Profile
**PUT** `/api/users/profile`
*Headers: `Authorization: Bearer <token>`*
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### Add to Wishlist
**POST** `/api/users/wishlist/:eventId`
*Headers: `Authorization: Bearer <token>`*

### Remove from Wishlist
**DELETE** `/api/users/wishlist/:eventId`
*Headers: `Authorization: Bearer <token>`*

### Get Wishlist
**GET** `/api/users/wishlist`
*Headers: `Authorization: Bearer <token>`*

---

## Image Upload

### Upload Image (Admin Only)
**POST** `/api/upload`
*Headers: `Authorization: Bearer <admin_token>`*
*Form-Data: `image: <file>`*
