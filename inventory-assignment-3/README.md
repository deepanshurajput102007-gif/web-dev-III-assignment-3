# Assignment 3: Inventory and Data Management System

**Course:** Web Dev III  
**Stack:** Node.js, Express.js, MongoDB, Mongoose, dotenv

A REST API for managing a store/warehouse product catalogue. It supports product CRUD, filtering, sorting, pagination, stock adjustments, low-stock alerts and category-wise inventory reports.

## 1. Requirements
- Node.js 18+
- MongoDB local service or MongoDB Atlas connection string
- Postman

## 2. Setup

```bash
npm install
```

Copy `.env.example` to `.env` and set your MongoDB connection string:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_db
NODE_ENV=development
```

For MongoDB Atlas, replace the URI with your Atlas connection string. Keep `.env` private; it is excluded through `.gitignore`.

Start the server:

```bash
npm run dev
```

or

```bash
npm start
```

Base URL: `http://localhost:5000`  
Health check: `GET http://localhost:5000/`

## 3. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create a product |
| GET | `/api/products` | List products with filtering, sorting and pagination |
| GET | `/api/products/:id` | Get one product by MongoDB ID |
| PUT | `/api/products/:id` | Update product details |
| PATCH | `/api/products/:id/stock` | Restock or record a sale |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/products/low-stock` | List products at/below reorder level |
| GET | `/api/products/summary` | Category-wise aggregation report |

### Product JSON example

```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 48,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```

Required fields: `name`, `sku`, `category`, `price`, `quantity`. `reorderLevel` defaults to `10`; `supplier` defaults to `Not specified`. SKU is unique. Price, quantity and reorder level cannot be negative; quantity and reorder level must be integers.

### Filtering, sorting and pagination

Example:

`GET /api/products?category=Stationery&search=pen&minPrice=50&maxPrice=500&sort=-price&page=1&limit=10`

- `category`: exact category match (case-insensitive)
- `search`: product-name search
- `minPrice`, `maxPrice`: price range
- `sort`: `name`, `price`, `quantity`, `category`, `createdAt`; prefix with `-` for descending order (default `-createdAt`)
- `page`: page number (default `1`)
- `limit`: results per page (default `10`, maximum `100`)

### Stock adjustment

`PATCH /api/products/:id/stock`

```json
{ "change": 10 }
```

A positive integer adds stock (restock); a negative integer subtracts stock (sale). The API prevents stock from becoming negative.

## 4. Postman testing

Import `postman/Inventory_API.postman_collection.json` into Postman. Run requests in this order:
1. Create Product (the collection saves the returned product ID automatically).
2. Get All Products / Get Single Product.
3. Update Product.
4. Restock Product.
5. Low-Stock Report and Category Summary.
6. Delete Product (run last because it removes the created record).

The collection includes a sample product body and automatically stores the created ID in a collection variable.

## 5. Mandatory Postman Screenshots for Submission

### 1. Create Product [Create Product]
![Create Product](./screenshots/Screenshot%20(1).png)

### 2. Get All Products [Get All Products]
![Get All Products](./screenshots/Screenshot%20(2).png)

### 3. Get Product by ID [Get Product by ID]
![Get Product by ID](./screenshots/Screenshot%20(3).png)

### 4. Update Product [Update Product]
![Update Product](./screenshots/Screenshot%20(4).png)

### 5. Stock Adjustment [Stock Adjustment]
![Stock Adjustment](./screenshots/Screenshot%20(5).png)

### 6. Low Stock Report [Low Stock]
![Low Stock](./screenshots/Screenshot%20(6).png)

### 7. Category-wise Inventory Summary [Category Summary]
![Category Summary](./screenshots/Screenshot%20(7).png)

### 8. Filtering, Sorting and Pagination
![Filtering, Sorting and Pagination](./screenshots/Screenshot%20(8).png)

## 6. Push to GitHub

```bash
git init
git add .
git commit -m "Complete Assignment 3 - Inventory Management API"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Before submitting, verify that the repository contains the complete source code, `README.md`, Postman collection and real Postman screenshots. Do not upload `.env` or `node_modules`.
