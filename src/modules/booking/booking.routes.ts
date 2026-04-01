import { Router } from "express";
import { BookingController } from "./booking.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

// All booking routes require authentication
router.use(auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN));

// Create a new booking (Student/User)
router.post("/", BookingController.createBooking);

// Get user's bookings
router.get("/", BookingController.getMyBookings);

// Get booking by ID
router.get("/:id", BookingController.getBookingById);

// Cancel booking
router.patch("/:id/cancel", BookingController.cancelBooking);

// Complete booking (Tutor/Admin)
router.patch(
  "/:id/complete",
  auth(UserRole.TUTOR, UserRole.ADMIN),
  BookingController.completeBooking,
);

// Confirm booking (Tutor/Admin)
router.patch(
  "/:id/confirm",
  auth(UserRole.TUTOR, UserRole.ADMIN),
  BookingController.confirmBooking,
);

// Update booking status (Admin only)
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN),
  BookingController.updateStatus,
);

export const bookingRoutes = router;
