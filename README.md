# Inventory Management System

A full-stack inventory management app built to handle thousands of products while keeping a complete history of every stock movement.

**Stack:** React (Vite) · Express · PostgreSQL · Tailwind CSS

## Features

- Product CRUD (soft delete, so history is never lost)
- Categories (with optional parent category)
- Supplier management (many-to-many with products, per-supplier supply price)
- Stock management: **IN / OUT / ADJUST**, protected by database transactions
- Inventory history for every product and a global movements feed
- Product images (multiple uploads, primary image, delete)
- Pagination, search (name / SKU), sorting and filtering (category, supplier, price range, low stock)
- CSV export (streamed in batches, respects the same filters)
- Dashboard: totals, low stock, out of stock, inventory value, restock list, recent movements
- Swagger / OpenAPI documentation

## Project Structure

```
inventory-management/
├── backend/
│   ├── db/
│   │   ├── migrations/001_init.sql
│   │   ├── seeds/seed.js
│   │   └── migrate.js
│   ├── src/
│   │   ├── config/        # DB pool + transaction helper
│   │   ├── controllers/
│   │   ├── docs/          # OpenAPI spec
│   │   ├── middlewares/   # upload, validate, error handler
│   │   ├── routes/
│   │   ├── services/      # product, stock, export logic
│   │   ├── utils/
│   │   ├── validators/    # Zod schemas
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/products/  # uploaded images
│   └── docs/              # Postman collection
└── frontend/
    └── src/ (api, components, hooks, pages)
```

## Getting Started

### Prerequisites

- Node.js (LTS)
- PostgreSQL 14+

### 1. Clone

```bash
git clone https://github.com/YOUR-USERNAME/inventory-management-system.git
cd inventory-management-system
```

### 2. Database

Create an empty database:

```sql
CREATE DATABASE inventory_db;
```

### 3. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (copy from `.env.example`):

```
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=inventory_db
MAX_FILE_SIZE_MB=5
```

Run migrations, load sample data (150 products across 10 categories) and start the server:

```bash
npm run migrate
npm run seed
npm run dev
```

- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON (importable in Postman): http://localhost:3000/api-docs.json

### 4. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:3000/api
VITE_FILE_URL=http://localhost:3000
```

```bash
npm run dev
```

Open http://localhost:5173

## Database Design

The schema is normalized (3NF). Categories, suppliers and images live in their own tables, and the product/supplier many-to-many relation uses a join table.

| Table | Purpose |
|---|---|
| `categories` | id, name (unique), parent_id |
| `suppliers` | id, name, email (unique), phone, address |
| `products` | id, sku (unique), name, description, price, category_id, quantity, reorder_level, deleted_at |
| `product_suppliers` | product_id, supplier_id, supply_price (composite PK) |
| `product_images` | id, product_id, file_path, is_primary |
| `inventory_history` | id, product_id, change_type (IN/OUT/ADJUST), quantity_change, quantity_after, reason, created_at |

Integrity is also enforced in the database with `CHECK` constraints (`quantity >= 0`, `price >= 0`), unique constraints and foreign keys.

### Query optimization

- `pg_trgm` GIN index on `products.name` for fast `ILIKE '%term%'` search
- Indexes on `products(category_id)`, `products(price)`, `products(created_at DESC)`
- Partial index on active products (`WHERE deleted_at IS NULL`)
- Composite index `inventory_history(product_id, created_at DESC)` for history pages
- Index on `product_suppliers(supplier_id)` for supplier filtering
- Server-side pagination (`LIMIT/OFFSET`), whitelisted sort columns, parameterized queries
- CSV export reads in batches of 1,000 rows using keyset pagination (`id > last_id`) and streams the response, so memory stays flat

Use `EXPLAIN ANALYZE` on any list query to inspect the plan, for example:

```sql
EXPLAIN ANALYZE
SELECT * FROM products
WHERE deleted_at IS NULL AND name ILIKE '%laptop%'
ORDER BY created_at DESC LIMIT 12;
```

### Transactions

Stock changes run in a single transaction: the product row is locked with `SELECT ... FOR UPDATE`, the new quantity is validated, then the product update and the `inventory_history` insert are committed together (or rolled back together). This prevents overselling when two requests hit the same product at once. Product creation (product + initial stock history + supplier links) and image uploads also use transactions.

## API Overview

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/dashboard` | Dashboard statistics |
| GET, POST | `/categories` | List / create |
| GET, PUT, DELETE | `/categories/:id` | Read / update / delete |
| GET, POST | `/suppliers` | List / create |
| GET, PUT, DELETE | `/suppliers/:id` | Read / update / delete |
| GET | `/products` | List with pagination, search, filter, sort |
| POST | `/products` | Create product |
| GET, PUT, DELETE | `/products/:id` | Read / update / soft delete |
| GET | `/products/export/csv` | Export CSV |
| POST | `/products/:id/stock` | Stock IN / OUT / ADJUST |
| GET | `/products/:id/history` | Inventory history of a product |
| GET | `/stock/history` | All stock movements |
| POST | `/products/:id/images` | Upload images (form-data field `images`, max 5) |
| PATCH | `/products/:id/images/:imageId/primary` | Set primary image |
| DELETE | `/products/:id/images/:imageId` | Delete image |

### Product list query parameters

| Param | Example | Description |
|---|---|---|
| `page`, `limit` | `page=2&limit=12` | Pagination (limit max 100) |
| `search` | `search=laptop` | Matches name or SKU |
| `category_id` | `category_id=3` | Filter by category |
| `supplier_id` | `supplier_id=1` | Filter by supplier |
| `min_price`, `max_price` | `min_price=10&max_price=100` | Price range |
| `low_stock` | `low_stock=true` | Quantity <= reorder level |
| `sort`, `order` | `sort=price&order=asc` | Sort by name, sku, price, quantity, created_at |

### Example: stock movement

```http
POST /api/products/1/stock
Content-Type: application/json

{ "change_type": "OUT", "quantity": 5, "reason": "Sale" }
```

- `IN` adds the quantity, `OUT` subtracts it (rejected with `400` if stock is insufficient), `ADJUST` sets the exact quantity.

### Response and error format

```json
{ "success": true, "data": {}, "pagination": { "page": 1, "limit": 12, "total": 150, "totalPages": 13 } }
```

```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "price", "message": "..." }] }
```

| Status | Meaning |
|---|---|
| 400 | Validation error or insufficient stock |
| 404 | Resource not found |
| 409 | Duplicate value (e.g. SKU) or record in use |

## Testing the API

- **Swagger UI:** `/api-docs` (supports "Try it out")
- **Postman:** import `http://localhost:3000/api-docs.json`, or import the collection in `backend/docs/`. Set an environment variable `baseUrl = http://localhost:3000/api`.

## Notes

- Initial stock is added from the product detail page via **Update Stock -> IN**, so every quantity change is recorded in the history.
- A product is "low stock" when `quantity <= reorder_level`.
- Inventory value on the dashboard is `SUM(quantity * price)`.

## Scripts

| Location | Command | Description |
|---|---|---|
| backend | `npm run dev` | Start API with nodemon |
| backend | `npm start` | Start API |
| backend | `npm run migrate` | Apply SQL migrations |
| backend | `npm run seed` | Load 150 sample products |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm run build` | Production build |
