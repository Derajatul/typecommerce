import express from "express";
import { hasRole, isAuthenticated } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validata.middleware";
import {
  CreateOrderInput,
  createOrderSchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema";
import { addresses, orderItems, orders, products } from "../db/schema";
import { db } from "../db/index";
import { and, eq, gte, inArray, sql } from "drizzle-orm";

const orderRouter = express.Router();

// POST /api/orders - Create a new order / checkout
orderRouter.post(
  "/",
  isAuthenticated,
  validateBody(createOrderSchema),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const { shippingAddressId, shippingFee, items }: CreateOrderInput =
        req.body;

      const [address] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, shippingAddressId))
        .limit(1);

      if (!address || address.userId !== user.id) {
        return res.status(400).json({
          success: false,
          message: "Invalid or unauthorized shipping address",
        });
      }

      const productIds = items.map((item) => item.productId);
      const dbProducts = await db
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      if (dbProducts.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more products are invalid",
        });
      }

      const productMap = new Map(
        dbProducts.map((product) => [product.id, product]),
      );

      // validate stock and calculate subtotal
      let calculatedSubtotal = 0;
      const preparedOrderItems: {
        productId: string;
        quantity: number;
        price: number;
        subtotal: number;
      }[] = [];

      for (const item of items) {
        const prod = productMap.get(item.productId);

        if (!prod) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${item.productId} not found`,
          });
        }

        if (prod.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product ${prod.name}`,
          });
        }

        const itemSubtotal = prod.price * item.quantity;
        calculatedSubtotal += itemSubtotal;

        preparedOrderItems.push({
          productId: prod.id,
          quantity: item.quantity,
          price: prod.price,
          subtotal: itemSubtotal,
        });
      }

      const calculatedTotal = calculatedSubtotal + shippingFee;

      const newOrder = await db.transaction(async (tx) => {
        // insert to order table
        const [order] = await tx
          .insert(orders)
          .values({
            userId: user.id,
            status: "pending",
            subtotal: calculatedSubtotal,
            shippingFee,
            total: calculatedTotal,
            shippingAddressId,
          })
          .returning();

        // insert to order_items table
        await tx.insert(orderItems).values(
          preparedOrderItems.map((item) => ({
            ...item,
            orderId: order.id,
          })),
        );

        // update product stock atomically (prevent race conditions & overselling)
        for (const item of items) {
          const prod = productMap.get(item.productId);

          if (prod) {
            const [deducted] = await tx
              .update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(
                and(
                  eq(products.id, prod.id),
                  gte(products.stock, item.quantity),
                ),
              )
              .returning();

            if (!deducted) {
              throw new Error(`Insufficient stock for product ${prod.name}`);
            }
          }
        }

        return order;
      });

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: newOrder,
      });
    } catch (error: any) {
      console.error("Error creating order:", error);
      if (error?.message?.startsWith("Insufficient stock")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error creating order",
      });
    }
  },
);

// GET User orders
orderRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const query =
      user.role === "admin"
        ? db.select().from(orders)
        : db.select().from(orders).where(eq(orders.userId, user.id));

    const userOrders = await query;

    return res.status(200).json({
      success: true,
      data: userOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
});

// get order details by order ID
orderRouter.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (typeof id !== "string" || id.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (user.role !== "admin" && order.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this order",
      });
    }

    // Fetch order items
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: products.name,
        price: orderItems.price,
        quantity: orderItems.quantity,
        subtotal: orderItems.subtotal,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return res.status(200).json({
      success: true,
      data: { ...order, items },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching order details",
    });
  }
});

// update order status (admin only)
orderRouter.patch(
  "/:id/status",
  isAuthenticated,
  hasRole("admin"),
  validateBody(updateOrderStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID",
        });
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating order status",
      });
    }
  },
);

export default orderRouter;
