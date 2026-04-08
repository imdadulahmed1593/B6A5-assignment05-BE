import { Router } from "express";
import { AdminController } from "./admin.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

// All admin routes require ADMIN role
router.use(auth(UserRole.ADMIN));

// Dashboard
router.get("/dashboard", AdminController.getDashboardStats);
router.get("/dashboard/trends", AdminController.getDashboardTrends);

// Users management
router.get("/users", AdminController.getAllUsers);
router.get("/users/:id", AdminController.getUserById);
router.patch("/users/:id/role", AdminController.updateUserRole);
router.patch("/users/:id/status", AdminController.updateUserStatus);

// Bookings management
router.get("/bookings", AdminController.getAllBookings);

export const adminRoutes = router;
