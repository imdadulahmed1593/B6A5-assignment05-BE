import { Router } from "express";
import { ReviewController } from "./review.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

// Public route - Get reviews for a tutor
router.get("/tutor/:tutorProfileId", ReviewController.getTutorReviews);

// Protected routes - Students, Tutors, and Admins can create/update their reviews
router.post(
  "/",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  ReviewController.createReview,
);

router.put(
  "/:id",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  ReviewController.updateReview,
);

router.get(
  "/me",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  ReviewController.getMyReviews,
);

// Admin only
router.delete("/:id", auth(UserRole.ADMIN), ReviewController.deleteReview);

export const reviewRoutes = router;
