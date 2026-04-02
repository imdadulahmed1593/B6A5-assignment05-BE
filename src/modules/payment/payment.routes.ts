import { Router } from "express";
import auth, { UserRole } from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";

const router = Router();

// all routes in this file are protected - only students and admins can access
router.post("/webhook", PaymentController.webhook);
router.post(
  "/checkout-session",
  auth(UserRole.STUDENT, UserRole.ADMIN),
  PaymentController.createCheckoutSession,
);
router.post(
  "/confirm-session",
  auth(UserRole.STUDENT, UserRole.ADMIN),
  PaymentController.confirmCheckoutSession,
);

export const paymentRoutes = router;
