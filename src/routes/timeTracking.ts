import express, { Router, Request, Response } from 'express';
import TimeEntry from '../models/TimeEntry';
import Schedule from '../models/Schedule';
import Location from '../models/Location';
import User from '../models/Users';
import { body, param, query, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../types/express/index';

const router = express.Router();

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Temporary auth middleware (replace with proper implementation)
const authenticateToken = (req: Request, res: Response, next: any) => {
  // TODO: Implement proper JWT authentication
  // For now, mock authentication
  req.user = {
    id: '507f1f77bcf86cd799439011',
    role: 'teacher',
    phone: '+77777777777',
    fullName: 'Test User'
  };
  next();
};

// Middleware to check validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /time-tracking/status - Get current time tracking status for user
// router.get('/status', authenticateToken, async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }
//     const userId = req.user.id;
    
//     // Find active time entry
//     const activeEntry = await TimeEntry.findOne({
//       userId,
//       status: 'active'
//     }).populate('userId', 'fullName role');
    
//     // Get today's schedule
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     const todaySchedule = await Schedule.findOne({
//       userId,
//       date: { $gte: today, $lt: tomorrow },
//       status: { $in: ['scheduled', 'completed'] }
//     }).populate('shiftId', 'name startTime endTime');
    
//     res.json({
//       isActive: !!activeEntry,
//       activeEntry,
//       todaySchedule,
//       currentTime: new Date()
//     });
//   } catch (error) {
//     console.error('Error getting time tracking status:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// POST /time-tracking/clock-in - Clock in
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
      return res.status(400).json({
        error: 'You already have an active time entry. Please clock out first.'
      });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find nearby locations for validation
    const nearbyLocations = await Location.find({
      isActive: true,
      allowedRoles: { $in: [user.role] }
    });
    
    const validLocation = nearbyLocations.find((location: any) => {
      const distance = calculateDistance(latitude, longitude, location.latitude, location.longitude);
      return distance <= location.radius;
    });
    
    if (!validLocation) {
      return res.status(400).json({
        error: 'Clock-in not allowed from this location',
        nearbyLocations: nearbyLocations.map((loc: any) => ({
          id: loc._id,
          name: loc.name,
          distance: calculateDistance(latitude, longitude, loc.latitude, loc.longitude)
        }))
      });
    }
    
    // Create time entry
    const timeEntry = new TimeEntry({
      userId,
      clockIn: new Date(),
      clockInLocation: {
        name: validLocation.name,
        coordinates: { latitude, longitude },
        radius: validLocation.radius,
        timestamp: new Date()
      },
      photoClockIn: photo,
      notes,
      status: 'active'
    });
    
    await timeEntry.save();
    
    // Update today's schedule if exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const schedule = await Schedule.findOne({
      userId,
      date: { $gte: today, $lt: tomorrow },
      status: 'scheduled'
    });
    
    if (schedule) {
      schedule.actualClockIn = timeEntry.clockIn;
      schedule.status = timeEntry.clockIn > new Date(schedule.startTime.getTime() + 15 * 60 * 1000) ? 'late' : 'completed';
      schedule.timeEntryId = timeEntry._id as any;
      await schedule.save();
    }
    
    await timeEntry.populate('userId', 'fullName role');
    
    res.status(201).json({
      message: 'Successfully clocked in',
      timeEntry,
      location: validLocation.name
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /time-tracking/clock-out - Clock out
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
      return res.status(400).json({
        error: 'No active time entry found. Please clock in first.'
      });
    }
    
    // Get user details
    // Update time entry
    timeEntry.clockOut = new Date();
    // Simplified clock-out without location validation
    timeEntry.status = 'completed';
    timeEntry.photoClockOut = photo;
    if (notes) {
      timeEntry.notes = timeEntry.notes ? `${timeEntry.notes}\n${notes}` : notes;
    }
    
    await timeEntry.save(); // This will trigger pre-save middleware to calculate hours
    
    // Update schedule
    // Removed the following lines
    // if (timeEntry.timeEntryId) {
    //   const schedule = await Schedule.findById(timeEntry.timeEntryId);
    //   if (schedule) {
    //     schedule.actualClockOut = timeEntry.clockOut;
    //     await schedule.save();
    //   }
    // }
    
    await timeEntry.populate('userId', 'fullName role');
    
    res.json({
      message: 'Successfully clocked out',
      timeEntry,
      totalHours: timeEntry.totalHours,
      regularHours: timeEntry.regularHours,
      overtimeHours: timeEntry.overtimeHours
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /time-tracking/break-start - Start break
router.post('/break-start', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.id;
    
    const timeEntry = await TimeEntry.findOne({
      userId,
      status: 'active'
    });
    
    if (!timeEntry) {
      return res.status(400).json({ error: 'No active time entry found' });
    }
    
    if (timeEntry.breakStart) {
      return res.status(400).json({ error: 'Break already started' });
    }
    
    timeEntry.breakStart = new Date();
    await timeEntry.save();
    
    res.json({
      message: 'Break started',
      breakStart: timeEntry.breakStart
    });
  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /time-tracking/break-end - End break
router.post('/break-end', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user.id;
    
    const timeEntry = await TimeEntry.findOne({
      userId,
      status: 'active'
    });
    
    if (!timeEntry) {
      return res.status(400).json({ error: 'No active time entry found' });
    }
    
    if (!timeEntry.breakStart) {
      return res.status(400).json({ error: 'No break to end' });
    }
    
    if (timeEntry.breakEnd) {
      return res.status(400).json({ error: 'Break already ended' });
    }
    
    timeEntry.breakEnd = new Date();
    
    // Calculate break duration
    const breakMs = timeEntry.breakEnd.getTime() - timeEntry.breakStart.getTime();
    timeEntry.breakDuration = Math.floor(breakMs / (1000 * 60)); // Convert to minutes
    
    await timeEntry.save();
    
    res.json({
      message: 'Break ended',
      breakEnd: timeEntry.breakEnd,
      breakDuration: timeEntry.breakDuration
    });
  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /time-tracking/entries - Get time entries with pagination
router.get('/entries', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('status').optional().isIn(['active', 'completed', 'missed', 'pending_approval']).withMessage('Invalid status')
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
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Get entries with pagination
    const entries = await TimeEntry.find(query)
      .sort({ clockIn: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName role')
      .populate('approvedBy', 'fullName');
    
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
    console.error('Error getting time entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /time-tracking/summary - Get time summary for period
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
      clockIn: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });
    
    const summary = {
      totalEntries: entries.length,
      totalHours: entries.reduce((sum, entry) => sum + entry.totalHours, 0),
      regularHours: entries.reduce((sum, entry) => sum + entry.regularHours, 0),
      overtimeHours: entries.reduce((sum, entry) => sum + entry.overtimeHours, 0),
      totalBreakTime: entries.reduce((sum, entry) => sum + (entry.breakDuration || 0), 0),
      averageHoursPerDay: 0,
      daysWorked: entries.length
    };
    
    if (summary.daysWorked > 0) {
      summary.averageHoursPerDay = summary.totalHours / summary.daysWorked;
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error getting time summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
