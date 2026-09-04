import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validata.middleware";
import { db } from "../db/index";
import { addresses } from "../db/schema";
import { and, eq } from "drizzle-orm";
import {
  CreateAddressInput,
  createAddressSchema,
  UpdateAddressInput,
  updateAddressSchema,
} from "../schemas/address.schema";

const addressRouter = express.Router();

// get /api/addresses - Get all addresses for the authenticated user
addressRouter.get("/", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Fetch addresses for the authenticated user
    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id));

    return res.status(200).json({
      success: true,
      data: userAddresses,
    });
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// POST /api/addresses - Create a new address for the authenticated user
addressRouter.post(
  "/",
  isAuthenticated,
  validateBody(createAddressSchema),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const body: CreateAddressInput = req.body;

      const [newAddress] = await db
        .insert(addresses)
        .values({
          ...body,
          userId: user.id,
        })
        .returning();

      return res.status(201).json({
        success: true,
        data: newAddress,
      });
    } catch (error) {
      console.error("Error creating address:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
);

// PUT /api/addresses/:id - Update an address (owned by authenticated user)
addressRouter.put(
  "/:id",
  isAuthenticated,
  validateBody(updateAddressSchema),
  async (req, res) => {
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
          message: "Invalid address ID",
        });
      }

      const body: UpdateAddressInput = req.body;

      // Ensure address belongs to authenticated user (IDOR protection)
      const [updatedAddress] = await db
        .update(addresses)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
        .returning();

      if (!updatedAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found or unauthorized",
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedAddress,
      });
    } catch (error) {
      console.error("Error updating address:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },
);

// DELETE /api/addresses/:id - Delete an address (owned by authenticated user)
addressRouter.delete("/:id", isAuthenticated, async (req, res) => {
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
        message: "Invalid address ID",
      });
    }

    // Ensure address belongs to authenticated user before deletion (IDOR protection)
    const [deletedAddress] = await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning();

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default addressRouter;
