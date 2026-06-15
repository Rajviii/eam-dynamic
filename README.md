# EAM Pro - Enterprise Asset Management System

EAM Pro is a modern, dynamic Enterprise Asset Management (EAM) application built with Next.js, fully aligned with **ISO 55001** standards for asset lifecycle and maintenance management.

## Key Features & Modules

### 1. ISO 55001 Asset Management Plan (AMP)
The **Asset Management Plan** translates strategic organizational objectives into actionable, trackable targets.
- **Dynamic Targets:** Set and track specific targets (e.g., Availability, Downtime Reduction, Cost Reduction, Asset Health Improvement) per Financial Year.
- **Strategic Alignment:** Ensures your maintenance activities directly support top-level business goals (Value Realization, Alignment, Leadership, Assurance).

### 2. Preventive Maintenance Planner
A complete overhaul of traditional calendar scheduling to ensure proactive maintenance strategies:
- **Interactive Split-Pane:** View active maintenance programs on the left and a dynamically forecasted schedule on the right.
- **Automated Forecasting:** The system projects future work orders based on your defined frequency (e.g., every 30 days) and start dates.
- **Strategy Management:** Easily create new PM schedules (Asset selection, Frequency, Start Date) which immediately sync to the calendar.

### 3. Comprehensive Asset & Inventory Management
A robust database-driven foundation for tracking your physical assets and parts:
- **Asset Registry:** Track asset hierarchies, categorization, site locations, and lifecycle stages (Procurement -> Active -> Disposed).
- **Criticality Analysis:** Formally assess safety, environmental, production, and financial impacts to generate a weighted criticality score.
- **Inventory Tracking:** Manage spare parts, stock levels, reorder points, and unit costs.

### 4. Custom UI Components
A highly consistent, premium user experience utilizing reusable custom components (`Input`, `Select`, `Textarea`, `Label`) to ensure a standardized look and feel across all data entry forms.

## Tech Stack
- **Frontend / Fullstack:** Next.js (App Router), React, Tailwind CSS
- **Database ORM:** Prisma
- **Database:** PostgreSQL (via Neon)

## Getting Started

First, install the dependencies:
```bash
npm install
```

Ensure your `.env` is configured with the correct `DATABASE_URL`. Then, push the schema to your database and generate the Prisma client:
```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

*(Optional) Seed your database with mock data:*
```bash
npx tsx src/data/seed.ts
```

Finally, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
