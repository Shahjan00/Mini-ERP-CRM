import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  const prismaError = err as Error & { code?: string };

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  if (prismaError.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate value violates a unique constraint',
    });
  }

  if (prismaError.code === 'P2025') {
    return res.status(404).json({
      error: 'Requested resource was not found',
    });
  }

  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};
