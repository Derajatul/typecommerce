import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  slug: z.string().min(3, "Slug must be at least 3 characters long"),
  description: z.string().optional(),
  price: z.number().int().positive("Price must be a positive integer"),
  stock: z
    .number()
    .int()
    .nonnegative("Stock must be a non-negative integer")
    .default(0),
  categoryId: z.string().min(1, "Category ID is required"),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// TypeScript types for the product schemas
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;