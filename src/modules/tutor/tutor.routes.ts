import { Router } from "express";
import { TutorController } from "./tutor.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = Router();

// Public routes
router.get("/", TutorController.getAllTutors);
router.get("/suggestions", TutorController.getSearchSuggestions);
router.get("/recommendations", TutorController.getRecommendations);

// Protected routes - Any authenticated user can create a tutor profile
router.post(
  "/profile",
  auth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  TutorController.createTutorProfile,
);

// Tutor only routes - Get/update own profile, manage availability, view bookings
router.get("/me/profile", auth(UserRole.TUTOR), TutorController.getMyProfile);

router.put(
  "/me/profile",
  auth(UserRole.TUTOR),
  TutorController.updateTutorProfile,
);

router.put(
  "/me/availability",
  auth(UserRole.TUTOR),
  TutorController.updateAvailability,
);

router.get("/me/bookings", auth(UserRole.TUTOR), TutorController.getMyBookings);

router.get("/:id", TutorController.getTutorById);

export const tutorRoutes = router;
