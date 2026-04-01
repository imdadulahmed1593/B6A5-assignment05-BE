import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await UserService.getMyProfile(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await UserService.updateProfile(userId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const dashboard = await UserService.getDashboard(userId, userRole);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard data retrieved successfully",
    data: dashboard,
  });
});

export const UserController = {
  getMyProfile,
  updateProfile,
  getDashboard,
};
