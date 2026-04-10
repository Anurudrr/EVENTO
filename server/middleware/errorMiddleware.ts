import type { Request, Response, NextFunction } from 'express';

interface ErrorResponse extends Error {
  statusCode?: number;
  code?: number;
  errors?: any;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
}

const getDuplicateKeyFields = (err: ErrorResponse) => (
  Object.keys(err.keyPattern || err.keyValue || {})
);

const errorHandler = (err: ErrorResponse, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new Error(message) as ErrorResponse;
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const duplicateFields = getDuplicateKeyFields(err);
    const isLegacyBookingField = duplicateFields.some((field) => ['email', 'phone'].includes(field));
    const message = isLegacyBookingField
      ? 'Duplicate field error fixed'
      : duplicateFields.length > 0
        ? `Duplicate field value entered for: ${duplicateFields.join(', ')}`
        : 'Duplicate field value entered';
    error = new Error(message) as ErrorResponse;
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new Error(message) as ErrorResponse;
    error.statusCode = 400;
  }

  if (err.name === 'MulterError') {
    const multerError = err as unknown as { code?: string; message: string };
    const message = multerError.code === 'LIMIT_FILE_SIZE'
      ? 'Image upload failed: maximum file size is 5MB.'
      : multerError.message;
    error = new Error(message) as ErrorResponse;
    error.statusCode = 400;
  }

  if (err.message === 'Images only!') {
    error = new Error('Image upload failed: only JPG and PNG files are allowed.') as ErrorResponse;
    error.statusCode = 400;
  }

  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 && isProduction
      ? 'Internal Server Error'
      : error.message || 'Server Error',
  });
};

export default errorHandler;
