import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const review = await ReviewService.createReview(studentId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

const getTutorReviews = catchAsync(async (req: Request, res: Response) => {
  const tutorProfileId = req.params.tutorProfileId as string;
  const { page, limit } = req.query;

  const filters: Record<string, any> = {};
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);

  const result = await ReviewService.getTutorReviews(tutorProfileId, filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    data: result.reviews,
    meta: result.meta,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!.id;
  const { page, limit } = req.query;

  const filters: Record<string, any> = {};
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);

  const result = await ReviewService.getMyReviews(studentId, filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    data: result.reviews,
    meta: result.meta,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const studentId = req.user!.id;

  const review = await ReviewService.updateReview(id, studentId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: review,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await ReviewService.deleteReview(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
});

export const ReviewController = {
  createReview,
  getTutorReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};
