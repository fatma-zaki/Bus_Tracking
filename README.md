# BusTrack - School Bus Management System

A full-stack web application for managing school bus operations with real-time tracking, role-based dashboards, seat booking, attendance management, and live notifications.

Built as a graduation project to demonstrate proficiency in modern web development with React, Node.js, MongoDB, and real-time communication via Socket.IO.

## Features

- **Role-Based Access Control** - Five distinct user roles (Admin, Manager, Driver, Parent, Student) with dedicated dashboards and permissions
- **Real-Time Bus Tracking** - Live GPS tracking on interactive Leaflet maps with Socket.IO for instant location updates
- **Seat Booking System** - Students and parents can browse available trips, book seats, and receive confirmation
- **Attendance Management** - Drivers mark student attendance; admins and managers view attendance reports
- **Route & Trip Management** - Full CRUD for bus routes and trip scheduling with driver assignments
- **Bus Fleet Management** - Add, edit, and monitor buses with driver assignment and capacity tracking
- **Notifications System** - In-app notifications for booking confirmations, trip updates, and alerts
- **Reports & Analytics** - Visual dashboards with Chart.js for booking stats, driver performance, and system analytics
- **User Management** - Admin panel for creating and managing users across all roles
- **Parent Features** - View children's profiles, track assigned buses, and book trips on their behalf
- **Cloud Image Uploads** - Profile photos and assets stored via Cloudinary integration
- **Responsive Design** - Mobile-friendly UI with off-canvas sidebar navigation for dashboard pages

## Tech Stack

### Frontend
- **React 18** with Vite for fast development and optimized builds
- **Redux Toolkit** for global state management
- **React Router v6** for client-side routing with route guards
- **Tailwind CSS 3** for utility-first responsive styling
- **Leaflet / React-Leaflet** for interactive maps and geolocation
- **Chart.js / React-Chartjs-2** for data visualization
- **Socket.IO Client** for real-time WebSocket communication
- **Axios** with interceptors for API communication and auth token management

### Backend
- **Node.js** with **Express 5**
- **MongoDB** with **Mongoose** ODM
- **Socket.IO** for real-time bidirectional communication
- **JWT** (JSON Web Tokens) for authentication
- **Cloudinary** for cloud-based image storage
- **Firebase Admin SDK** for push notifications
- **Nodemailer** for email notifications
- **Multer** for file upload handling
- **Express Rate Limiter** for API security

## Project Structure

```
bus_track/
├── src/                        # React frontend
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Page components (25+ pages)
│   ├── redux/                  # Redux slices and store
│   ├── services/               # Socket.IO service
│   ├── layouts/                # Layout components
│   └── assets/                 # Static assets
├── backend-BusMS-main/         # Express backend
│   ├── config/                 # Database and cloud config
│   ├── controllers/            # Route handlers (12 controllers)
│   ├── models/                 # Mongoose schemas (11 models)
│   ├── routes/                 # API route definitions (14 route files)
│   └── middlewares/            # Auth, role, rate-limit, upload middleware
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── package.json                # Frontend dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account (for image uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/bustrack.git
   cd bustrack
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend-BusMS-main
   npm install
   ```

4. **Configure environment variables**

   Copy the example files and fill in your credentials:

   ```bash
   # Backend
   cp backend-BusMS-main/.env.example backend-BusMS-main/.env

   # Frontend (optional - defaults to localhost)
   cp .env.example .env
   ```

   Edit `backend-BusMS-main/.env` with your MongoDB URI, JWT secret, and API keys.

### Running Locally

1. **Start the backend server**
   ```bash
   cd backend-BusMS-main
   npm run dev
   ```
   Backend runs on `http://localhost:5000`

2. **Start the frontend dev server** (in a new terminal)
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3001`

### Building for Production

```bash
npm run build
```

The optimized build output is in the `dist/` directory.

## API Overview

| Endpoint              | Method         | Description                    |
| --------------------- | -------------- | ------------------------------ |
| `/api/users`          | GET/POST       | User registration and listing  |
| `/api/users/login`    | POST           | Authentication                 |
| `/api/buses`          | CRUD           | Bus fleet management           |
| `/api/routes`         | CRUD           | Route management               |
| `/api/trips`          | CRUD           | Trip scheduling                |
| `/api/bookings`       | CRUD           | Seat booking system            |
| `/api/attendances`    | GET/POST       | Attendance tracking            |
| `/api/notifications`  | GET/POST       | Notification system            |
| `/api/bus-locations`  | GET/POST       | Real-time bus locations         |
| `/api/dashboard`      | GET            | Dashboard statistics           |
| `/api/driver`         | GET/PUT        | Driver-specific operations     |
| `/api/chats`          | GET/POST       | In-app messaging               |

All endpoints are protected by JWT authentication and role-based authorization middleware.

## User Roles

| Role       | Access                                                       |
| ---------- | ------------------------------------------------------------ |
| **Admin**  | Full system access, user/bus/route/trip management, reports   |
| **Manager**| Similar to admin with limited user management                 |
| **Driver** | Assigned trips, attendance marking, live tracking             |
| **Parent** | Children management, booking, bus tracking                    |
| **Student**| Personal dashboard, booking, bus tracking                     |

## Screenshots

> Add screenshots of key pages here:
> - Home page / Landing
> - Admin Dashboard
> - Live Tracking Map
> - Booking Flow
> - Driver Dashboard

## Deployment (Vercel — Free)

The entire project (frontend + backend API) is deployed on [Vercel](https://vercel.com) as a single service. The backend runs as serverless functions.

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Import the **Bus_Tracking** repository
3. Add environment variables in the Vercel dashboard:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — your JWT secret key
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `EMAIL_USER`, `EMAIL_PASSWORD`
   - (Optional) `OpenAI_API_KEY`
4. Deploy

> **Note:** Real-time bus tracking via Socket.IO is available in local development but not in the Vercel deployment (serverless functions don't support WebSockets). All other features (dashboards, booking, maps, auth, CRUD) work fully.

## License

This project was built as a graduation project for educational purposes.
