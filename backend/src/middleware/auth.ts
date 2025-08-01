import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

// Extend Express Request interface
interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

export const authenticate = catchAsync(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET) as any;

  // Check if user still exists
  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // Grant access to protected route
  req.userId = (user as any)._id.toString();
  req.user = user;
  next();
});