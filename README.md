<div align="center">
<pre>
████████╗██╗   ██╗██████╗ ███████╗ ██████╗ ██████╗ ███╗   ███╗███╗   ███╗███████╗██████╗  ██████╗███████╗
╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔════╝██╔══██╗██╔════╝██╔════╝
   ██║    ╚████╔╝ ██████╔╝█████╗  ██║     ██║   ██║██╔████╔██║██╔████╔██║█████╗  ██████╔╝██║     █████╗  
   ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██╔══██╗██║     ██╔══╝  
   ██║      ██║   ██║     ███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██║  ██║╚██████╗███████╗
   ╚═╝      ╚═╝   ╚═╝     ╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝
</pre>
<p><strong>Type-Safe RESTful E-Commerce Backend with Express, Better Auth, Drizzle ORM, and Zod</strong></p>
</div>

---

## Overview

**TypeCommerce** is a modern, production-grade e-commerce backend built with TypeScript. It leverages **Better Auth** for robust authentication and role-based access control, **Drizzle ORM** with PostgreSQL for type-safe database queries, and **Zod** for schema validation and automated OpenAPI/Swagger documentation.

---

## Database Architecture

```text
users
│
├── addresses
│
└── orders
    │
    └── order_items ─── products ─── categories
                             │
                             └── product_images
```

---

## Project Structure

- `src/index.ts`: Application entry point, CORS configuration, and route registrations.
- `src/lib/`: Core libraries (Better Auth config, database connection, and OpenAPI/Swagger generator).
- `src/db/`: Database configuration, Drizzle ORM schemas (`auth-schema.ts`, `schema.ts`).
- `src/routes/`: Express route handlers (`product`, `category`, `address`, `order`).
- `src/schemas/`: Zod runtime validation schemas for request bodies.
- `src/middlewares/`: Authentication (`isAuthenticated`, `hasRole`) and Zod request body validation (`validateBody`).
- `src/types/`: Custom TypeScript declarations (Express session and user extension).

---

## Technologies Used

- **Runtime & Language**: [Node.js](https://nodejs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/) v5
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL (`pg`)
- **Authentication**: [Better Auth](https://www.better-auth.com/) with Bearer Token & Cookie support
- **Validation & Docs**: [Zod](https://zod.dev/) v4, `@asteasolutions/zod-to-openapi`, [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)

---

## Requirements & Prerequisites

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database instance
- npm or pnpm package manager

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/typecommerce.git
cd typecommerce
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/typecommerce_db
BETTER_AUTH_SECRET=your_super_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### 4. Push Database Schema

Run Drizzle Kit to apply migrations and schema to PostgreSQL:

```bash
npx drizzle-kit push
```

### 5. Run the Application

#### Development mode (Hot Reload):

```bash
npm run dev
```

#### Production mode:

```bash
npm run build
npm start
```

---

## Interactive API Documentation

Once the server is running, you can explore and test all API endpoints via the interactive Swagger UI:

- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI JSON Spec**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

---

## API Endpoints Summary

### Authentication (`Better Auth`)

| Endpoint                  | Method |    Access     | Description                                |
| ------------------------- | :----: | :-----------: | ------------------------------------------ |
| `/api/auth/sign-up/email` | `POST` |    Public     | Register new user                          |
| `/api/auth/sign-in/email` | `POST` |    Public     | Login with email and password              |
| `/api/auth/sign-out`      | `POST` | Authenticated | Logout session                             |
| `/api/me`                 | `GET`  | Authenticated | Get current authenticated user and session |

### Categories

| Endpoint              |  Method  |   Access   | Description               |
| --------------------- | :------: | :--------: | ------------------------- |
| `/api/categories`     |  `GET`   |   Public   | List all categories       |
| `/api/categories/:id` |  `GET`   |   Public   | Get single category by ID |
| `/api/categories`     |  `POST`  | Admin Only | Create a new category     |
| `/api/categories/:id` |  `PUT`   | Admin Only | Update category by ID     |
| `/api/categories/:id` | `DELETE` | Admin Only | Delete category by ID     |

### Products

| Endpoint            |  Method  |   Access   | Description                            |
| ------------------- | :------: | :--------: | -------------------------------------- |
| `/api/products`     |  `GET`   |   Public   | List all products                      |
| `/api/products/:id` |  `GET`   |   Public   | Get product details by ID              |
| `/api/products`     |  `POST`  | Admin Only | Create product with category reference |
| `/api/products/:id` |  `PUT`   | Admin Only | Update product details                 |
| `/api/products/:id` | `DELETE` | Admin Only | Delete product by ID                   |

### Addresses

| Endpoint             |  Method  |    Access     | Description                      |
| -------------------- | :------: | :-----------: | -------------------------------- |
| `/api/addresses`     |  `GET`   | Authenticated | List all addresses owned by user |
| `/api/addresses`     |  `POST`  | Authenticated | Add a new shipping address       |
| `/api/addresses/:id` |  `PUT`   | Authenticated | Update user's shipping address   |
| `/api/addresses/:id` | `DELETE` | Authenticated | Delete user's shipping address   |

### Orders & Checkout

| Endpoint                 | Method  |    Access     | Description                                              |
| ------------------------ | :-----: | :-----------: | -------------------------------------------------------- |
| `/api/orders`            | `POST`  | Authenticated | Checkout (Atomic stock deduction & order creation)       |
| `/api/orders`            |  `GET`  | Authenticated | List orders (Customer sees own, Admin sees all)          |
| `/api/orders/:id`        |  `GET`  | Authenticated | Get order details with items                             |
| `/api/orders/:id/status` | `PATCH` |  Admin Only   | Update order status (`pending`, `paid`, `shipped`, etc.) |

---

## Example API Requests using cURL

#### 1. Register User

```bash
curl -i -X POST 'http://localhost:3000/api/auth/sign-up/email' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "customer@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

#### 2. Create Order / Checkout

```bash
curl -i -X POST 'http://localhost:3000/api/orders' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_SESSION_TOKEN>' \
  -d '{
    "shippingAddressId": "address-uuid-here",
    "shippingFee": 15000,
    "items": [
      {
        "productId": "product-uuid-here",
        "quantity": 2
      }
    ]
  }'
```

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## License

This project is licensed under the [ISC License](LICENSE).
