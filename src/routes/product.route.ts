import express from "express";
import { db } from "../db/index";
import { products } from "../db/schema";
import { eq } from "drizzle-orm";
import { hasRole, isAuthenticated } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validata.middleware";
import {
  CreateProductInput,
  createProductSchema,
  UpdateProductInput,
  updateProductSchema,
} from "../schemas/product.schema";

const productRouter = express.Router();

// GET /api/products - Get all products
productRouter.get("/", async (req, res) => {
  try {
    const allProducts = await db.select().from(products);
    return res.status(200).json({
      success: true,
      data: allProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
    });
  }
});

// GET /api/products/:id - Get a product by ID
productRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching product",
    });
  }
});

// POST /api/products - Create a new product admin only
productRouter.post(
  "/",
  isAuthenticated,
  hasRole("admin"),
  validateBody(createProductSchema),
  async (req, res) => {
    try {
      const data: CreateProductInput = req.body;

      const newProduct = await db.insert(products).values(data).returning();
      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: newProduct,
      });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "23505") {
        // Unique violation error code for PostgreSQL
        return res.status(409).json({
          success: false,
          message: "Product with this slug already exists",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error creating product",
      });
    }
  },
);

// PUT /api/products/:id - Update a product by ID (admin only)
productRouter.put(
  "/:id",
  isAuthenticated,
  hasRole("admin"),
  validateBody(updateProductSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string" || !id.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }
      const data: UpdateProductInput = req.body;

      const [updatedProduct] = await db
        .update(products)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      if (!updatedProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating product",
      });
    }
  },
);

// DELETE /api/products/:id - Delete a product by ID (admin only)
productRouter.delete(
  "/:id",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (typeof id !== "string" || !id.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      const [deletedProduct] = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning();

      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: deletedProduct,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting product",
      });
    }
  },
);
export default productRouter;
