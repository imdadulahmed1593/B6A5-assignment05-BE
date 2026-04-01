import { Router } from "express";
import { categoryRoutes } from "../modules/category/category.routes";
import { tutorRoutes } from "../modules/tutor/tutor.routes";
import { bookingRoutes } from "../modules/booking/booking.routes";
import { reviewRoutes } from "../modules/review/review.routes";
import { adminRoutes } from "../modules/admin/admin.routes";
import { userRoutes } from "../modules/user/user.routes";

const router = Router();

// Public/Protected routes
router.use("/categories", categoryRoutes);
router.use("/tutors", tutorRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/users", userRoutes);

// Admin routes
router.use("/admin", adminRoutes);

export default router;
