import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, "Shipping address ID is required"),
  shippingFee: z.number().int().nonnegative().default(0),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().positive("Quantity must be greater than 0"),
      })
    )
    .min(1, "Order must contain at least 1 item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;