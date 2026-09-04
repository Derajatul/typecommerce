import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.schema";
import {
  createAddressSchema,
  updateAddressSchema,
} from "../schemas/address.schema";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema";

// Aktifkan ekstensi openapi pada Zod
extendZodWithOpenApi(z);

// Kompatibilitas Zod 4: di Zod 4, kelas seperti ZodObject dan ZodString tidak lagi mewarisi ZodType.prototype secara langsung.
for (const key in z) {
  const item = (z as any)[key];
  if (
    key.startsWith("Zod") &&
    typeof item === "function" &&
    item.prototype &&
    !item.prototype.openapi
  ) {
    item.prototype.openapi = (z.ZodType.prototype as any).openapi;
  }
}

export const registry = new OpenAPIRegistry();

// Daftarkan Security Scheme
registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "better-auth.session_token",
  description: "Better Auth session cookie token",
});

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Bearer token authentication",
});

const security: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { bearerAuth: [] },
];

// --- 1. Definisi Schema Menggunakan Zod Murni (Bukan komentar YAML) -------------

export const SignUpBodySchema = registry.register(
  "SignUpBody",
  z.object({
    email: z.string().email().openapi({ example: "test@example.com" }),
    password: z.string().min(8).openapi({ example: "Password123!" }),
    name: z.string().openapi({ example: "Test User" }),
  }),
);

export const SignInBodySchema = registry.register(
  "SignInBody",
  z.object({
    email: z.string().email().openapi({ example: "test@example.com" }),
    password: z.string().openapi({ example: "Password123!" }),
  }),
);

export const UserSchema = registry.register(
  "User",
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    role: z.string().default("customer"),
    image: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const SessionResponseSchema = registry.register(
  "SessionResponse",
  z.object({
    session: z.object({
      id: z.string(),
      userId: z.string(),
      token: z.string(),
      expiresAt: z.string(),
      ipAddress: z.string().nullable().optional(),
      userAgent: z.string().nullable().optional(),
    }),
    user: UserSchema,
  }),
);

export const ProductSchema = registry.register(
  "Product",
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    price: z.number(),
    stock: z.number(),
    categoryId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const CategorySchema = registry.register(
  "Category",
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const AddressSchema = registry.register(
  "Address",
  z.object({
    id: z.string(),
    userId: z.string(),
    label: z.string(),
    recipientName: z.string(),
    phoneNumber: z.string(),
    streetAddress: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    isDefault: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const OrderItemSchema = registry.register(
  "OrderItem",
  z.object({
    id: z.string(),
    productId: z.string(),
    productName: z.string().optional(),
    price: z.number(),
    quantity: z.number(),
    subtotal: z.number(),
  }),
);

export const OrderSchema = registry.register(
  "Order",
  z.object({
    id: z.string(),
    userId: z.string(),
    status: z.string(),
    subtotal: z.number(),
    shippingFee: z.number(),
    total: z.number(),
    shippingAddressId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    items: z.array(OrderItemSchema).optional(),
  }),
);

export const CreateProductRequest = registry.register(
  "CreateProductInput",
  createProductSchema,
);
export const UpdateProductRequest = registry.register(
  "UpdateProductInput",
  updateProductSchema,
);
export const CreateCategoryRequest = registry.register(
  "CreateCategoryInput",
  createCategorySchema,
);
export const UpdateCategoryRequest = registry.register(
  "UpdateCategoryInput",
  updateCategorySchema,
);
export const CreateAddressRequest = registry.register(
  "CreateAddressInput",
  createAddressSchema,
);
export const UpdateAddressRequest = registry.register(
  "UpdateAddressInput",
  updateAddressSchema,
);
export const CreateOrderRequest = registry.register(
  "CreateOrderInput",
  createOrderSchema,
);
export const UpdateOrderStatusRequest = registry.register(
  "UpdateOrderStatusInput",
  updateOrderStatusSchema,
);

// --- 2. Daftarkan Endpoint Menggunakan TypeScript Object Murni ------------------

registry.registerPath({
  method: "get",
  path: "/",
  tags: ["General"],
  summary: "Health check endpoint",
  responses: {
    200: {
      description: "Server berjalan normal",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/me",
  tags: ["Authentication"],
  summary: "Mendapatkan session user saat ini",
  security,
  responses: {
    200: {
      description: "Session valid",
      content: {
        "application/json": {
          schema: SessionResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({ example: "Unauthorized" }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/sign-up/email",
  tags: ["Authentication"],
  summary: "Register user baru dengan email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignUpBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User berhasil didaftarkan",
    },
    400: {
      description: "Validasi input gagal",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/sign-in/email",
  tags: ["Authentication"],
  summary: "Login menggunakan email & password",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SignInBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login berhasil, session dibuat",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/sign-out",
  tags: ["Authentication"],
  summary: "Logout dari akun",
  security,
  responses: {
    200: {
      description: "Berhasil logout",
    },
  },
});

// --- Categories ---
registry.registerPath({
  method: "get",
  path: "/api/categories",
  tags: ["Categories"],
  summary: "Mendapatkan semua kategori",
  responses: {
    200: {
      description: "Daftar kategori",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(CategorySchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/categories/{id}",
  tags: ["Categories"],
  summary: "Mendapatkan kategori berdasarkan ID",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: {
      description: "Detail kategori",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), data: CategorySchema }),
        },
      },
    },
    404: { description: "Category not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/categories",
  tags: ["Categories"],
  summary: "Menambah kategori baru (Admin only)",
  security,
  request: {
    body: {
      content: { "application/json": { schema: CreateCategoryRequest } },
    },
  },
  responses: {
    201: {
      description: "Kategori berhasil dibuat",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), data: CategorySchema }),
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden - Admin only" },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/categories/{id}",
  tags: ["Categories"],
  summary: "Update kategori (Admin only)",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  request: {
    body: {
      content: { "application/json": { schema: UpdateCategoryRequest } },
    },
  },
  responses: {
    200: {
      description: "Kategori berhasil diupdate",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), data: CategorySchema }),
        },
      },
    },
    404: { description: "Category not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/categories/{id}",
  tags: ["Categories"],
  summary: "Hapus kategori (Admin only)",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: { description: "Kategori berhasil dihapus" },
    404: { description: "Category not found" },
  },
});

// --- Products ---
registry.registerPath({
  method: "get",
  path: "/api/products",
  tags: ["Products"],
  summary: "Mendapatkan semua produk",
  responses: {
    200: {
      description: "Daftar produk",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(ProductSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/products/{id}",
  tags: ["Products"],
  summary: "Mendapatkan detail produk berdasarkan ID",
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: {
      description: "Detail produk",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), data: ProductSchema }),
        },
      },
    },
    404: { description: "Product not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/products",
  tags: ["Products"],
  summary: "Menambah produk baru (Admin only)",
  security,
  request: {
    body: {
      content: { "application/json": { schema: CreateProductRequest } },
    },
  },
  responses: {
    201: {
      description: "Produk berhasil dibuat",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: ProductSchema,
          }),
        },
      },
    },
    400: { description: "Validation error" },
    409: { description: "Product slug already exists" },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/products/{id}",
  tags: ["Products"],
  summary: "Update produk (Admin only)",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  request: {
    body: {
      content: { "application/json": { schema: UpdateProductRequest } },
    },
  },
  responses: {
    200: {
      description: "Produk berhasil diupdate",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: ProductSchema,
          }),
        },
      },
    },
    404: { description: "Product not found" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/products/{id}",
  tags: ["Products"],
  summary: "Hapus produk (Admin only)",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: { description: "Produk berhasil dihapus" },
    404: { description: "Product not found" },
  },
});

// --- Addresses ---
registry.registerPath({
  method: "get",
  path: "/api/addresses",
  tags: ["Addresses"],
  summary: "Mendapatkan semua alamat milik user yang sedang login",
  security,
  responses: {
    200: {
      description: "Daftar alamat user",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(AddressSchema),
          }),
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/addresses",
  tags: ["Addresses"],
  summary: "Menambah alamat pengiriman baru",
  security,
  request: {
    body: {
      content: { "application/json": { schema: CreateAddressRequest } },
    },
  },
  responses: {
    201: {
      description: "Alamat berhasil ditambahkan",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), data: AddressSchema }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/addresses/{id}",
  tags: ["Addresses"],
  summary: "Update alamat pengiriman",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  request: {
    body: {
      content: { "application/json": { schema: UpdateAddressRequest } },
    },
  },
  responses: {
    200: {
      description: "Alamat berhasil diperbarui",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), data: AddressSchema }),
        },
      },
    },
    404: { description: "Address not found or unauthorized" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/addresses/{id}",
  tags: ["Addresses"],
  summary: "Hapus alamat pengiriman",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: { description: "Alamat berhasil dihapus" },
    404: { description: "Address not found or unauthorized" },
  },
});

// --- Orders ---
registry.registerPath({
  method: "get",
  path: "/api/orders",
  tags: ["Orders"],
  summary:
    "Mendapatkan daftar pesanan (User melihat miliknya, Admin melihat semua)",
  security,
  responses: {
    200: {
      description: "Daftar pesanan",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(OrderSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/orders/{id}",
  tags: ["Orders"],
  summary: "Mendapatkan rincian pesanan dan item",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  responses: {
    200: {
      description: "Detail pesanan dan items",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: OrderSchema,
          }),
        },
      },
    },
    404: { description: "Order not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/orders",
  tags: ["Orders"],
  summary: "Checkout / membuat pesanan baru",
  security,
  request: {
    body: {
      content: { "application/json": { schema: CreateOrderRequest } },
    },
  },
  responses: {
    201: {
      description: "Pesanan berhasil dibuat",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrderSchema,
          }),
        },
      },
    },
    400: { description: "Stok kurang atau data pesanan tidak valid" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/orders/{id}/status",
  tags: ["Orders"],
  summary: "Update status pesanan (Admin only)",
  security,
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  request: {
    body: {
      content: { "application/json": { schema: UpdateOrderStatusRequest } },
    },
  },
  responses: {
    200: {
      description: "Status pesanan berhasil diupdate",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: OrderSchema,
          }),
        },
      },
    },
    404: { description: "Order not found" },
  },
});

// --- 3. Generate OpenAPI Document & Setup Express UI ---------------------------

export function setupSwagger(app: Express) {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const openApiDoc = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "TypeCommerce API Documentation",
      version: "1.0.0",
      description: "Dokumentasi API TypeCommerce otomatis dari Zod Schema",
    },
    servers: [{ url: "http://localhost:3000" }],
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));
  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiDoc);
  });
}
