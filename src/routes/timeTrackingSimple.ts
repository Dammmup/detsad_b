import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import TimeEntry from '../models/TimeEntry';
import User from '../models/Users';

const router = express.Router();

// Temporary auth middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
  req.user = {
    id: '507f1f77bcf86cd799439011',
    role: 'teacher',
    phone: '+77777777777',
    fullName: 'Test User'
  };
  next();
};

// Validation error handler
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /status - Get current time tracking status
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    
    // Find active time entry
    const activeEntry = await TimeEntry.findOne({
      userId,
      status: 'active'
    });

    res.json({
      isActive: !!activeEntry,
      activeEntry,
      currentTime: new Date()
    });
  } catch (error) {
    console.error('Error getting time status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /clock-in - Clock in
router.post('/clock-in', [
  authenticateToken,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('photo').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const { latitude, longitude, photo, notes } = req.body;

    // Check if user already has an active time entry
    const existingEntry = await TimeEntry.findOne({
      userId,
      status: 'active'
    });

    if (existingEntry) {
      return res.status(400).json({ error: 'Already clocked in' });
    }

    // Create new time entry
    const timeEntry = new TimeEntry({
      userId,
      clockIn: new Date(),
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      breakDuration: 0,
      notes,
      status: 'active'
    });

    await timeEntry.save();

    res.json({
      message: 'Successfully clocked in',
      timeEntry
    });
  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /clock-out - Clock out
router.post('/clock-out', [
  authenticateToken,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('photo').optional().isString(),
  body('notes').optional().isString().isLength({ max: 500 })
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const { latitude, longitude, photo, notes } = req.body;

    // Find active time entry
    const timeEntry = await TimeEntry.findOne({
      userId,
      status: 'active'
    });

    if (!timeEntry) {
      return res.status(400).json({ error: 'No active time entry found' });
    }

    // Update time entry
    timeEntry.clockOut = new Date();
    timeEntry.status = 'completed';
    
    if (notes) timeEntry.notes = notes;

    // Calculate total hours
    const clockInTime = new Date(timeEntry.clockIn);
    const clockOutTime = new Date(timeEntry.clockOut);
    const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    
    timeEntry.totalHours = Number(totalHours.toFixed(2));

    await timeEntry.save();

    res.json({
      message: 'Successfully clocked out',
      timeEntry
    });
  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /entries - Get time entries
router.get('/entries', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { userId };
    
    if (req.query.startDate || req.query.endDate) {
      query.clockIn = {};
      if (req.query.startDate) {
        query.clockIn.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        query.clockIn.$lte = new Date(req.query.endDate as string);
      }
    }

    const entries = await TimeEntry.find(query)
      .sort({ clockIn: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TimeEntry.countDocuments(query);

    res.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /summary - Get time summary
router.get('/summary', [
  authenticateToken,
  query('startDate').isISO8601().withMessage('Invalid start date format'),
  query('endDate').isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    const startDate = new Date(req.query.startDate as string);
    const endDate = new Date(req.query.endDate as string);

    const entries = await TimeEntry.find({
      userId,
      clockIn: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'completed'
    });

    const totalHours = entries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    const totalDays = entries.length;

    res.json({
      totalHours: Number(totalHours.toFixed(2)),
      totalDays,
      averageHoursPerDay: totalDays > 0 ? Number((totalHours / totalDays).toFixed(2)) : 0,
      entries: entries.length
    });
  } catch (error) {
    console.error('Error fetching time summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
