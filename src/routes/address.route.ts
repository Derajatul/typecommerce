import express from "express";
import { isAuthenticated } from "../middlewares/auth.middleware";
import { db } from "../db/index";
import { addresses } from "../db/schema";
import { eq } from "drizzle-orm";
import { CreateAddressInput } from "../schemas/address.schema";

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
addressRouter.post("/", isAuthenticated, async (req, res) => {
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

    return res.status(200).json({
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
});

export default addressRouter;
