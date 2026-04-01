import { Response } from "express";

interface ApiResponseOptions<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  options: ApiResponseOptions<T>,
) => {
  const { statusCode, success, message, data, meta } = options;

  res.status(statusCode).json({
    success,
    message,
    meta,
    data,
  });
};
