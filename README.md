# Orders and Settlements

A full-stack web application for managing orders with line items, recording payments, and tracking settlement status.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, TypeScript, NestJS |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| API Docs | Swagger (`/api/docs`) |
| Frontend | React + TypeScript, Vite |
| Styling | Tailwind CSS v3 |
| Code Quality | ESLint, Husky, lint-staged |
| Deployment | Vercel |

---

## Project Structure

```
CrossVal/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── auth/      # JWT Auth, guards, strategy
│   │   ├── users/     # User schema & service
│   │   ├── orders/    # Order schema, service, controller
│   │   └── payments/  # Payment schema, service, controller (with ACID transactions)
│   └── vercel.json
├── frontend/          # React + Vite SPA
│   ├── src/
│   │   ├── lib/api.ts # Typed API client
│   │   └── pages/     # Login, Register, Dashboard, CreateOrder, OrderDetail
│   └── vercel.json
├── .husky/            # Git hooks (pre-commit lint)
└── package.json       # Root workspace
```

---

## Getting Started (Local)

### Prerequisites
- Node.js >= 18
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm install
npm run start:dev
```

API will be available at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/api/docs`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login | No |
| GET | `/orders` | List orders (filter: `?status=`) | Yes |
| POST | `/orders` | Create order | Yes |
| GET | `/orders/:id` | Get order details | Yes |
| POST | `/orders/:id/payments` | Record payment | Yes |
| GET | `/orders/:id/payments` | Get payment history | Yes |

---

## Deployment (Vercel)

### Backend
```bash
cd backend
vercel --prod
# Set env vars: MONGODB_URI, JWT_SECRET
```

### Frontend
```bash
cd frontend
vercel --prod
# Set env var: VITE_API_URL=https://your-backend.vercel.app
```

---

## Key Design Decisions

- **MongoDB Transactions (ACID):** Payment creation and order status update happen atomically in a single MongoDB transaction, preventing race conditions and over-payment.
- **Materialized `status` & `amountPaid`:** Stored directly on Order documents for fast filtering without aggregation.
- **JWT Auth:** Stateless, passed as Bearer token in Authorization header.
