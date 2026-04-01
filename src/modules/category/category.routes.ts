import { Router } from "express";
import { CategoryController } from "./category.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

// Public routes
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getCategoryById);

// Admin only routes
router.post("/", auth(UserRole.ADMIN), CategoryController.createCategory);
router.put("/:id", auth(UserRole.ADMIN), CategoryController.updateCategory);
router.delete("/:id", auth(UserRole.ADMIN), CategoryController.deleteCategory);

export const categoryRoutes = router;
