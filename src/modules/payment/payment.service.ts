import Stripe from "stripe";
import { BookingStatus, PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { config } from "../../config";
import { getStripeClient } from "../../lib/stripe";

type WebhookResult = {
  outcome: "updated" | "no-op" | "ignored";
  reason?: string;
  bookingId?: string;
};

const getOrCreateStripeCustomerId = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

const createCheckoutSession = async (studentId: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutorProfile: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.studentId !== studentId) {
    throw new ApiError(403, "You are not allowed to pay for this booking");
  }

  if (booking.paymentStatus === PaymentStatus.PAID) {
    throw new ApiError(400, "Booking is already paid");
  }

  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    throw new ApiError(400, "You cannot pay for this booking anymore");
  }

  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomerId(studentId);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: booking.currency,
          unit_amount: booking.amount,
          product_data: {
            name: `Tutoring session with ${booking.tutorProfile.user.name}`,
            description: `${booking.duration} minutes`,
          },
        },
      },
    ],
    metadata: {
      bookingId: booking.id,
      studentId,
    },
    success_url: `${config.frontend_url}/dashboard/bookings?payment=success&bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend_url}/dashboard/bookings?payment=cancel&bookingId=${booking.id}`,
  });

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: PaymentStatus.PENDING,
        stripeCheckoutSessionId: checkoutSession.id,
      },
    }),
    prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        studentId,
        amount: booking.amount,
        currency: booking.currency,
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: checkoutSession.id,
      },
      update: {
        status: PaymentStatus.PENDING,
        stripeCheckoutSessionId: checkoutSession.id,
      },
    }),
  ]);

  return {
    checkoutUrl: checkoutSession.url,
    sessionId: checkoutSession.id,
  };
};

const confirmCheckoutSessionPayment = async (
  studentId: string,
  sessionId: string,
) => {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    throw new ApiError(400, "Checkout session is missing booking metadata");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      paymentStatus: true,
    },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found for this checkout session");
  }

  if (booking.studentId !== studentId) {
    throw new ApiError(403, "You are not allowed to confirm this payment");
  }

  if (booking.paymentStatus === PaymentStatus.PAID) {
    return {
      paymentStatus: PaymentStatus.PAID,
      bookingStatus: BookingStatus.CONFIRMED,
      bookingId,
    };
  }

  if (session.payment_status !== "paid") {
    throw new ApiError(
      400,
      "Payment is not completed yet. Please wait for confirmation.",
    );
  }

  await markBookingAsPaid(session);

  return {
    paymentStatus: PaymentStatus.PAID,
    bookingStatus: BookingStatus.CONFIRMED,
    bookingId,
  };
};

const constructWebhookEvent = (rawBody: Buffer, signature: string) => {
  if (!config.stripe.webhook_secret) {
    throw new ApiError(500, "Stripe webhook secret is not configured");
  }

  const stripe = getStripeClient();

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhook_secret,
    );
  } catch (error) {
    console.error("[StripeWebhook] signature verification failed", error);
    throw new ApiError(400, "Invalid Stripe webhook signature");
  }
};

const markBookingAsPaid = async (
  session: Stripe.Checkout.Session,
): Promise<WebhookResult> => {
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.warn(
      "[StripeWebhook] checkout session missing bookingId metadata",
      {
        sessionId: session.id,
      },
    );
    return { outcome: "no-op", reason: "missing-booking-id" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      status: true,
      paymentStatus: true,
      amount: true,
      currency: true,
    },
  });

  if (!booking) {
    console.warn("[StripeWebhook] booking not found", {
      bookingId,
      sessionId: session.id,
    });
    return { outcome: "no-op", reason: "booking-not-found", bookingId };
  }

  if (
    booking.paymentStatus === PaymentStatus.PAID &&
    booking.status === BookingStatus.CONFIRMED
  ) {
    return { outcome: "no-op", reason: "already-paid", bookingId };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const normalizedPaymentIntentId = paymentIntentId ?? null;

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: normalizedPaymentIntentId,
        paidAt: new Date(),
      },
    }),
    prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        studentId: booking.studentId,
        amount: session.amount_total || booking.amount,
        currency:
          session.currency || booking.currency || config.stripe.currency,
        status: PaymentStatus.PAID,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: normalizedPaymentIntentId,
        paidAt: new Date(),
      },
      update: {
        status: PaymentStatus.PAID,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: normalizedPaymentIntentId,
        paidAt: new Date(),
      },
    }),
  ]);

  console.info("[StripeWebhook] payment marked paid", {
    bookingId,
    sessionId: session.id,
  });

  return { outcome: "updated", bookingId };
};

const markBookingPaymentFailed = async (
  session: Stripe.Checkout.Session,
): Promise<WebhookResult> => {
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.warn("[StripeWebhook] failed session missing bookingId metadata", {
      sessionId: session.id,
    });
    return { outcome: "no-op", reason: "missing-booking-id" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      studentId: true,
      paymentStatus: true,
      amount: true,
      currency: true,
    },
  });

  if (!booking) {
    console.warn("[StripeWebhook] booking not found for failed payment", {
      bookingId,
      sessionId: session.id,
    });
    return { outcome: "no-op", reason: "booking-not-found", bookingId };
  }

  if (booking.paymentStatus === PaymentStatus.PAID) {
    return { outcome: "no-op", reason: "already-paid", bookingId };
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    }),
    prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        studentId: booking.studentId,
        amount: session.amount_total || booking.amount,
        currency:
          session.currency || booking.currency || config.stripe.currency,
        status: PaymentStatus.FAILED,
        stripeCheckoutSessionId: session.id,
      },
      update: {
        status: PaymentStatus.FAILED,
        stripeCheckoutSessionId: session.id,
      },
    }),
  ]);

  console.info("[StripeWebhook] payment marked failed", {
    bookingId,
    sessionId: session.id,
  });

  return { outcome: "updated", bookingId };
};

const handleWebhook = async (event: Stripe.Event): Promise<WebhookResult> => {
  console.info("[StripeWebhook] received event", {
    id: event.id,
    type: event.type,
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      return markBookingAsPaid(session);
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      return markBookingAsPaid(session);
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      return markBookingPaymentFailed(session);
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      return markBookingPaymentFailed(session);
    }
    default:
      console.info("[StripeWebhook] event ignored", {
        id: event.id,
        type: event.type,
      });
      return { outcome: "ignored", reason: "unhandled-event" };
  }
};

export const PaymentService = {
  createCheckoutSession,
  confirmCheckoutSessionPayment,
  constructWebhookEvent,
  handleWebhook,
};
