import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🔥 Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendResponse(
    res,
    statusCode,
    false,
    message,
    null,
    undefined,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};
