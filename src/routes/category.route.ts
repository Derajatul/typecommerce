import express from "express";
import { db } from "../db";
import { categories } from "../db/schema";
import { eq } from "drizzle-orm";
import { hasRole, isAuthenticated } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validata.middleware";
import {
  CreateCategoryInput,
  createCategorySchema,
  UpdateCategoryInput,
  updateCategorySchema,
} from "../schemas/category.schema";

const categoryRouter = express.Router();

// GET /api/categories - Get all categories
categoryRouter.get("/", async (req, res) => {
  try {
    const allCategories = await db.select().from(categories);
    return res.status(200).json({
      success: true,
      data: allCategories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching categories",
    });
  }
});

// GET /api/categories/:id - Get a category by ID
categoryRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching category",
    });
  }
});

// POST /api/categories - Create a new category
categoryRouter.post(
  "/",
  isAuthenticated,
  hasRole("admin"),
  validateBody(createCategorySchema),
  async (req, res) => {
    try {
      const body: CreateCategoryInput = req.body;
      const [newCategory] = await db
        .insert(categories)
        .values(body)
        .returning();
      return res.status(201).json({
        success: true,
        data: newCategory,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error creating category",
      });
    }
  },
);

// PUT /api/categories/:id - Update a category by ID
categoryRouter.put(
  "/:id",
  isAuthenticated,
  hasRole("admin"),
  validateBody(updateCategorySchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      const body: UpdateCategoryInput = req.body;
      const [updatedCategory] = await db
        .update(categories)
        .set(body)
        .where(eq(categories.id, id))
        .returning();
      if (!updatedCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: updatedCategory,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating category",
      });
    }
  },
);

// DELETE /api/categories/:id - Delete a category by ID
categoryRouter.delete(
  "/:id",
  isAuthenticated,
  hasRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string" || id.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      const [deletedCategory] = await db
        .delete(categories)
        .where(eq(categories.id, id))
        .returning();
      if (!deletedCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error deleting category",
      });
    }
  },
);

export default categoryRouter;
