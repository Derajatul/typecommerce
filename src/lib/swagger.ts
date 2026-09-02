import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

// Aktifkan ekstensi openapi pada Zod
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// Daftarkan Security Scheme
registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "better-auth.session_token",
  description: "Better Auth session cookie token",
});

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
  security: [{ cookieAuth: [] }],
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
          schema: z.object({ error: z.string().openapi({ example: "Unauthorized" }) }),
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
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "Berhasil logout",
    },
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
