# Learnzy Backend

A RESTful API backend for the Learnzy tutoring platform, built with Express.js, Prisma, and Better Auth.

## 🚀 Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js 5
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma 7
- **Authentication:** Better Auth
- **Email:** Nodemailer (Gmail SMTP)
- **Build Tool:** tsup

## 📁 Project Structure

```
backend/
├── api/                    # Built output (Vercel serverless)
├── generated/
│   └── prisma/             # Generated Prisma client
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding
├── src/
│   ├── app.ts              # Express app configuration
│   ├── server.ts           # Server entry point (local dev)
│   ├── index.ts            # Serverless entry point
│   ├── config/
│   │   └── index.ts        # Environment configuration
│   ├── lib/
│   │   ├── auth.ts         # Better Auth configuration
│   │   └── prisma.ts       # Prisma client instance
│   ├── middlewares/
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── globalErrorHandler.ts
│   │   └── notFound.ts
│   ├── modules/
│   │   ├── admin/          # Admin management
│   │   ├── booking/        # Booking CRUD
│   │   ├── category/       # Category CRUD
│   │   ├── review/         # Review CRUD
│   │   ├── tutor/          # Tutor profiles & availability
│   │   └── user/           # User profile & dashboard
│   ├── routes/
│   │   └── index.ts        # Route aggregator
│   ├── scripts/
│   │   └── seedAdmin.ts    # Admin seeding script
│   └── utils/
│       ├── ApiError.ts     # Custom error class
│       ├── catchAsync.ts   # Async error wrapper
│       └── sendResponse.ts # Response helper
└── vercel.json             # Vercel deployment config
```

## 🗃️ Database Schema

### Models

| Model               | Description                              |
| ------------------- | ---------------------------------------- |
| `User`              | Users with roles (STUDENT, TUTOR, ADMIN) |
| `Session`           | Better Auth sessions                     |
| `Account`           | OAuth accounts                           |
| `Verification`      | Email verification tokens                |
| `TutorProfile`      | Tutor-specific profile data              |
| `TutorAvailability` | Weekly availability slots                |
| `TutorCategory`     | Tutor-subject relationships              |
| `Category`          | Subject categories                       |
| `Booking`           | Session bookings                         |
| `Review`            | Student reviews for tutors               |

## 🔐 Authentication

Authentication is handled by Better Auth with:

- Email/password authentication
- Email verification required
- Session-based auth with cookies
- Cross-origin cookie support for production

### User Roles

```typescript
enum UserRole {
  STUDENT = "STUDENT",
  TUTOR = "TUTOR",
  ADMIN = "ADMIN",
}
```

## 📡 API Endpoints

### Auth (Better Auth)

| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| POST   | `/api/auth/sign-up/email` | Register new user   |
| POST   | `/api/auth/sign-in/email` | Login               |
| POST   | `/api/auth/sign-out`      | Logout              |
| GET    | `/api/auth/session`       | Get current session |
| GET    | `/api/auth/verify-email`  | Verify email token  |

### Categories

| Method | Endpoint              | Auth   | Description         |
| ------ | --------------------- | ------ | ------------------- |
| GET    | `/api/categories`     | Public | List all categories |
| GET    | `/api/categories/:id` | Public | Get category by ID  |
| POST   | `/api/categories`     | Admin  | Create category     |
| PUT    | `/api/categories/:id` | Admin  | Update category     |
| DELETE | `/api/categories/:id` | Admin  | Delete category     |

### Tutors

| Method | Endpoint                      | Auth   | Description                         |
| ------ | ----------------------------- | ------ | ----------------------------------- |
| GET    | `/api/tutors`                 | Public | Search tutors (filters, pagination) |
| GET    | `/api/tutors/:id`             | Public | Get tutor profile                   |
| POST   | `/api/tutors/profile`         | User   | Create tutor profile                |
| GET    | `/api/tutors/me/profile`      | Tutor  | Get own profile                     |
| PUT    | `/api/tutors/me/profile`      | Tutor  | Update own profile                  |
| PUT    | `/api/tutors/me/availability` | Tutor  | Update availability                 |
| GET    | `/api/tutors/me/bookings`     | Tutor  | Get tutor's bookings                |

### Bookings

| Method | Endpoint                     | Auth  | Description       |
| ------ | ---------------------------- | ----- | ----------------- |
| POST   | `/api/bookings`              | User  | Create booking    |
| GET    | `/api/bookings`              | User  | Get my bookings   |
| GET    | `/api/bookings/:id`          | User  | Get booking by ID |
| PATCH  | `/api/bookings/:id/cancel`   | User  | Cancel booking    |
| PATCH  | `/api/bookings/:id/confirm`  | Tutor | Confirm booking   |
| PATCH  | `/api/bookings/:id/complete` | Tutor | Mark as completed |
| PATCH  | `/api/bookings/:id/status`   | Admin | Update status     |

### Reviews

| Method | Endpoint                             | Auth    | Description       |
| ------ | ------------------------------------ | ------- | ----------------- |
| POST   | `/api/reviews`                       | Student | Create review     |
| GET    | `/api/reviews/tutor/:tutorProfileId` | Public  | Get tutor reviews |
| GET    | `/api/reviews/me`                    | User    | Get my reviews    |
| PUT    | `/api/reviews/:id`                   | User    | Update review     |

### Users

| Method | Endpoint               | Auth | Description         |
| ------ | ---------------------- | ---- | ------------------- |
| GET    | `/api/users/me`        | User | Get profile         |
| PUT    | `/api/users/me`        | User | Update profile      |
| GET    | `/api/users/dashboard` | User | Get dashboard stats |

### Admin

| Method | Endpoint                      | Auth  | Description        |
| ------ | ----------------------------- | ----- | ------------------ |
| GET    | `/api/admin/dashboard`        | Admin | Get platform stats |
| GET    | `/api/admin/users`            | Admin | List all users     |
| GET    | `/api/admin/users/:id`        | Admin | Get user by ID     |
| PATCH  | `/api/admin/users/:id/role`   | Admin | Update user role   |
| PATCH  | `/api/admin/users/:id/status` | Admin | Ban/unban user     |
| GET    | `/api/admin/bookings`         | Admin | List all bookings  |

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL database (or Neon account)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# App URLs
APP_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"

# Email (Gmail SMTP)
APP_USER="your-email@gmail.com"
APP_PASS="your-app-password"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed admin user
npm run seed:admin
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

Server runs at [http://localhost:5000](http://localhost:5000)

### Production Build

```bash
# Build for production (Vercel serverless)
npm run build
```

## 🚀 Deployment

### Vercel

The backend is configured for Vercel serverless deployment:

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ]
}
```

Deploy:

```bash
vercel --prod
```

### Environment Variables (Vercel)

Set these in the Vercel dashboard:

- `DATABASE_URL` - PostgreSQL connection string
- `APP_URL` - Frontend production URL
- `BACKEND_URL` - Backend production URL
- `APP_USER` - Gmail address for emails
- `APP_PASS` - Gmail app password
- `BETTER_AUTH_SECRET` - Auth secret key
- `NODE_ENV` - Set to `development`

## 📝 Scripts

| Script                | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Build for production     |
| `npm run seed:admin`  | Seed admin user          |
| `npx prisma generate` | Generate Prisma client   |
| `npx prisma db push`  | Push schema to database  |
| `npx prisma studio`   | Open Prisma Studio       |
