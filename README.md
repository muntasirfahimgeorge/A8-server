# StudioSpace Server

Backend API for StudioSpace, a platform where creators can find and book photography, film, podcast, and music studios, and hosts can list their spaces.

**Live Server:** https://a8-server-2lig.onrender.com  
**Live Client:** https://studiospace-beta.vercel.app

## What it does
- Handles CRUD operations for studio listings (create, view, edit, delete).
- Manages studio bookings and tracks booking status (Pending, Confirmed, Cancelled).
- Checks existing confirmed bookings before saving a new one to prevent double-booking the same slot.
- Protects private routes so only logged-in users can add, edit, or delete studios and manage bookings.

## Tech Stack
- Node.js & Express.js
- MongoDB (Atlas)
- Better Auth / JWT verification
- Hosted on Render

## Main API Routes
- `GET /` - Health check route
- `GET /studios` - Get all studios (with search and category filtering)
- `GET /studios/:id` - Get single studio details
- `POST /studios` - Create a new studio listing (protected)
- `PATCH /studios/:id` - Update an existing studio (protected)
- `DELETE /studios/:id` - Delete a studio (protected)
- `GET /bookings` - Get bookings by user email (protected)
- `POST /bookings` - Create a new booking (protected)
- `PATCH /bookings/:id` - Cancel or update booking status (protected)

