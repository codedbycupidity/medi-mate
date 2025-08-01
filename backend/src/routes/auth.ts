import { Router, Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { authenticate } from '../middleware/auth';

const router = Router();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_COOKIE_EXPIRES_IN = process.env.JWT_COOKIE_EXPIRES_IN || '7';

// Extended Request interface for authenticated routes
interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

// Generate JWT token
const signToken = (id: string): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign({ userId: id }, JWT_SECRET!, options);
};

// Create and send token with response
const createSendToken = (user: IUser, statusCode: number, res: Response, message: string) => {
  const token = signToken((user as any)._id.toString());
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  };

  res.cookie('token', token, cookieOptions);
  
  // Remove sensitive data
  user.password = undefined as any;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user,
    },
  });
};

// Signup/Register
router.post('/register', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !password) {
    return next(new AppError('All fields are required', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Create new user
  const newUser = await User.create({
    name,
    email,
    password,
  });

  createSendToken(newUser, 201, res, 'Registration successful');
}));

// Login
router.post('/login', catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res, 'Login successful');
}));

// Logout
router.post('/logout', catchAsync(async (_req: Request, res: Response) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
}));

// Get current user
router.get('/me', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.userId).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
}));

// Check authentication status
router.get('/check-auth', authenticate, catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.userId).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
}));

export default router;