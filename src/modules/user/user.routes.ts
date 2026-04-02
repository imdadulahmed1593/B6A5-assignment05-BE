import { Router } from "express";
import { UserController } from "./user.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

// All user routes require authentication
router.use(auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN));

// Get current user profile
router.get("/me", UserController.getMyProfile);

// Get dashboard data for current user (bookings, reviews, etc.)
router.get("/dashboard", UserController.getDashboard);

// Update current user profile
router.put("/me", UserController.updateProfile);

export const userRoutes = router;
