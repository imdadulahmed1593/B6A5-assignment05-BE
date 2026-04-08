import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TutorService } from "./tutor.service";

const getAllTutors = catchAsync(async (req: Request, res: Response) => {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    minRating,
    isAvailable,
    page,
    limit,
    sortBy,
    sortOrder,
  } = req.query;

  const filters: Record<string, any> = {};
  if (search) filters.search = search as string;
  if (categoryId) filters.categoryId = categoryId as string;
  if (minPrice) filters.minPrice = Number(minPrice);
  if (maxPrice) filters.maxPrice = Number(maxPrice);
  if (minRating) filters.minRating = Number(minRating);
  if (isAvailable !== undefined) filters.isAvailable = isAvailable === "true";
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);
  if (sortBy) filters.sortBy = sortBy as string;
  if (sortOrder) filters.sortOrder = sortOrder as "asc" | "desc";

  const result = await TutorService.getAllTutors(filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutors retrieved successfully",
    data: result.tutors,
    meta: result.meta,
  });
});

const getTutorById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const tutor = await TutorService.getTutorById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor retrieved successfully",
    data: tutor,
  });
});

const getSearchSuggestions = catchAsync(async (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  const limit = req.query.limit ? Number(req.query.limit) : 6;
  const suggestions = await TutorService.getSearchSuggestions(query, limit);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor suggestions retrieved successfully",
    data: suggestions,
  });
});

const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  const recommendations = await TutorService.getRecommendations({
    categoryId,
    limit,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor recommendations retrieved successfully",
    data: recommendations,
  });
});

const createTutorProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tutor = await TutorService.createTutorProfile(userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Tutor profile created successfully",
    data: tutor,
  });
});

const updateTutorProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tutor = await TutorService.updateTutorProfile(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor profile updated successfully",
    data: tutor,
  });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { availabilities } = req.body;
  const tutor = await TutorService.updateAvailability(userId, availabilities);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Availability updated successfully",
    data: tutor,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tutor = await TutorService.getMyProfile(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tutor profile retrieved successfully",
    data: tutor,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status, page, limit } = req.query;

  const filters: Record<string, any> = {};
  if (status) filters.status = status as string;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);

  const result = await TutorService.getMyBookings(userId, filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result.bookings,
    meta: result.meta,
  });
});

export const TutorController = {
  getAllTutors,
  getTutorById,
  getSearchSuggestions,
  getRecommendations,
  createTutorProfile,
  updateTutorProfile,
  updateAvailability,
  getMyProfile,
  getMyBookings,
};
