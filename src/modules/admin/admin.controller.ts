import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { search, role, status, page, limit } = req.query;

  const filters: Record<string, any> = {};
  if (search) filters.search = search as string;
  if (role) filters.role = role as string;
  if (status) filters.status = status as string;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);

  const result = await AdminService.getAllUsers(filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: result.users,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await AdminService.getUserById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;

  const user = await AdminService.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User status updated successfully",
    data: user,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { role } = req.body;

  const user = await AdminService.updateUserRole(id, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role updated successfully",
    data: user,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query;

  const filters: Record<string, any> = {};
  if (status) filters.status = status as string;
  if (page) filters.page = Number(page);
  if (limit) filters.limit = Number(limit);

  const result = await AdminService.getAllBookings(filters);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result.bookings,
    meta: result.meta,
  });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await AdminService.getDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard stats retrieved successfully",
    data: stats,
  });
});

const getDashboardTrends = catchAsync(async (req: Request, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : 7;
  const trends = await AdminService.getDashboardTrends(days);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard trends retrieved successfully",
    data: trends,
  });
});

export const AdminController = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getAllBookings,
  getDashboardStats,
  getDashboardTrends,
};
