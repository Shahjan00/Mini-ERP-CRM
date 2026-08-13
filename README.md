# Mini ERP + CRM Operations Portal

A full-stack, enterprise-grade **Mini ERP & CRM Operations Portal** built for wholesale and distribution companies. The system unifies Customer CRM workflows, Product Inventory management, Stock Movement audit tracking, Sales Challan dispatches with automated stock reservation, and Role-Based Access Control (RBAC).

---

## 🔑 Test Credentials (Pre-seeded Roles)

| Role | Email | Password | Allowed Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | `Admin@123` | Full access across all modules (CRM, Inventory, Challans, Settings). |
| **Sales** | `sales@erp.com` | `Sales@123` | Customer CRM, Follow-up notes, Sales Challan creation & confirmation. |
| **Warehouse** | `warehouse@erp.com` | `Warehouse@123` | Product catalog, Location tracking, Manual Stock IN/OUT adjustments, Audit logs. |
| **Accounts** | `accounts@erp.com` | `Accounts@123` | Financial summary, Confirmed Challan views, Printable PDF Invoice generation. |

> 💡 **Quick Login**: The frontend Login screen includes **1-Click Demo Buttons** to instantly log in as any role without typing!

---

## 🏗️ Architecture & Business Logic Highlights

### Core Modules
1. **Authentication & Role-Based Access Control (RBAC)**: JWT token-based authentication with fine-grained API and UI permission guards (`Admin`, `Sales`, `Warehouse`, `Accounts`).
2. **Customer CRM Module**: Manage wholesale customers, track customer status (`Lead`, `Active`, `Inactive`), schedule follow-up dates, and maintain an interactive discussion timeline.
3. **Product & Inventory Module**: Real-time SKU stock tracking, warehouse location mapping (rack/bay), and automated low-stock alerts (`currentStock <= minStockAlert`).
4. **Stock Movement Audit Log**: Immutable audit trail logging every stock `IN` or `OUT` adjustment along with quantity changed, reason, responsible staff member, and timestamp.
5. **Sales Challan Dispatch Engine**:
   - **Atomic Stock Reservation**: Confirming a Challan atomically decrements inventory stock level and logs an `OUT` movement log.
   - **Negative Stock Prevention**: API validates stock availability. Returns `400 Bad Request` with product details if stock is insufficient.
   - **Historical Snapshots**: Stores frozen snapshots of customer details and product pricing at creation time, preserving historical accuracy.
   - **Printable PDF Invoices**: Client-side clean PDF invoice view for dispatches.
6. **Operations Dashboard**: Real-time KPI summary widgets, stock reorder alert banners, recent sales challan feeds, and stock movement feeds.

---

## 🛠️ Required Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, JWT, bcryptjs, Zod validation.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Database**: PostgreSQL (Production) / SQLite (Zero-config local development).
- **DevOps**: Docker, Docker Compose, Postman Collection.

---

## 🚀 Quick Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Step 1: Clone & Setup Backend
```bash
cd backend
npm install

# Generate Prisma Client & Push Database Schema
npx prisma generate
npx prisma db push --accept-data-loss

# Seed Default Users & Sample Data
npm run seed

# Start Backend Server (runs on http://localhost:5000)
npm run dev
```

### Step 2: Setup Frontend
```bash
cd ../frontend
npm install

# Start Vite Development Server (runs on http://localhost:3000)
npm run dev
```

Open `http://localhost:3000` in your browser and log in using the demo buttons!

---

## 🐳 Docker Setup (Single Command Run)

Spin up PostgreSQL, Backend API, and Frontend web server with a single command:

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost:80`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## 📄 Postman Collection

A complete Postman collection is included under the `/postman` folder:
- File location: `postman/Mini_ERP_CRM.postman_collection.json`
- Includes pre-configured environment variables (`{{baseUrl}}`, `{{token}}`).
- Automatically captures the JWT bearer token upon successful login.

---

## 🌐 Deployment Instructions

### Option 1: Free Hosting Platform Deployment
- **Frontend**: Deploy `frontend/` to **Vercel** or **Render Static Site**.
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set Environment Variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1`
- **Backend**: Deploy `backend/` to **Render** or **Railway**.
  - Build command: `npm run build`
  - Start command: `npm start`
- **Database**: Free Managed PostgreSQL on **Supabase** or **Neon**.
  - Copy database connection string into `DATABASE_URL`.

### Option 2: AWS Deployment (EC2 + Docker)
1. Launch an AWS EC2 Ubuntu instance.
2. Install Docker & Docker Compose:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose
   ```
3. Clone repository and launch containers:
   ```bash
   git clone <repo-url>
   cd antiG
   sudo docker-compose up -d --build
   ```

---

## 📌 Assumptions Made

1. **Dual DB Capability**: Prisma uses SQLite for instant local execution without external DB installation, while supporting seamless connection to PostgreSQL for production/Docker.
2. **Challan Workflow**: Challans can be created as `DRAFT` (stock unchanged) or `CONFIRMED` (stock reduced immediately). Transitioning from `CONFIRMED` to `CANCELLED` restores stock levels.
