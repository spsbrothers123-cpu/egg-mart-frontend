# 🥚 Egg Mart POS

A full-featured Point of Sale system for egg retail businesses. Built with React + Vite.

## Features

- **Admin & Cashier roles** with separate permissions
- **Billing / POS** — product grid, cart, payment (Cash/Card/UPI), hold bills
- **Dashboard** — sales stats, charts, low stock alerts, recent transactions
- **Products** — add, edit, delete, filter by category
- **Inventory** — stock levels, adjustments, status badges
- **Customers** — walk-in & named customers, credit tracking
- **Suppliers** — supplier records and purchase tracking
- **Expenses** — add/delete expense entries
- **Reports** — daily/weekly/monthly/profit summaries
- **Settings** — store info, GST, receipt config, POS preferences

## Credentials

| Role    | Password  |
|---------|-----------|
| Admin   | admin123  |
| Cashier | 1234      |

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── App.jsx                 # Root component, routing
├── main.jsx                # Entry point
├── index.css               # Global styles & CSS variables
├── data/
│   └── index.js            # Mock data (products, customers, etc.)
├── components/
│   ├── LoginPage.jsx       # Login screen
│   ├── Sidebar.jsx         # Navigation sidebar
│   └── UI.jsx              # Shared components (Modal, Badge, etc.)
└── pages/
    ├── BillingPage.jsx     # Main POS billing screen
    ├── DashboardPage.jsx   # Admin dashboard
    ├── ProductsPage.jsx    # Product management
    └── OtherPages.jsx      # Customers, Expenses, Reports, Inventory,
                            #   Suppliers, History, Settings
```

## Tech Stack

- React 18
- Vite 5
- Tabler Icons (webfont)
- DM Sans + DM Mono fonts
- Pure CSS (no UI library)

## Next Steps / Enhancements

- Connect to a backend (Supabase, Firebase, or Node.js API)
- Add real barcode scanner integration
- Implement thermal receipt printing
- Add GST invoice generation (PDF)
- Multi-store / multi-terminal support
- Offline mode with sync
