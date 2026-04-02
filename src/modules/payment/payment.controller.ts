import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ApiError } from "../../utils/ApiError";
import { PaymentService } from "./payment.service";

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { bookingId } = req.body;

    if (!bookingId) {
      throw new ApiError(400, "bookingId is required");
    }

    const data = await PaymentService.createCheckoutSession(
      studentId,
      bookingId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Checkout session created successfully",
      data,
    });
  },
);

const confirmCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.id;
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new ApiError(400, "sessionId is required");
    }

    const data = await PaymentService.confirmCheckoutSessionPayment(
      studentId,
      sessionId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Checkout session confirmed successfully",
      data,
    });
  },
);

const webhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || Array.isArray(signature)) {
    throw new ApiError(400, "Missing Stripe signature header");
  }

  const rawBody = req.body as Buffer;
  const event = PaymentService.constructWebhookEvent(rawBody, signature);
  const result = await PaymentService.handleWebhook(event);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Webhook processed",
    data: {
      received: true,
      eventId: event.id,
      eventType: event.type,
      result,
    },
  });
});

export const PaymentController = {
  createCheckoutSession,
  confirmCheckoutSession,
  webhook,
};
