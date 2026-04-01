import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingService } from "./booking.service";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const booking = await BookingService.createBooking(studentId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created successfully",
    data: booking,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { status, page, limit } = req.query;

  const filters: Record<string, any> = {};
  if (status) filters.status = status as string;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);

  const result = await BookingService.getMyBookings(userId, userRole, filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result.bookings,
    meta: result.meta,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const booking = await BookingService.getBookingById(id, userId, userRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking retrieved successfully",
    data: booking,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const booking = await BookingService.cancelBooking(id, userId, userRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking cancelled successfully",
    data: booking,
  });
});

const confirmBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const booking = await BookingService.confirmBooking(id, userId, userRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking confirmed successfully",
    data: booking,
  });
});

const completeBooking = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const booking = await BookingService.completeBooking(id, userId, userRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking marked as completed",
    data: booking,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  const booking = await BookingService.updateStatus(id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Booking status updated to ${status}`,
    data: booking,
  });
});

export const BookingController = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  confirmBooking,
  completeBooking,
  updateStatus,
};
