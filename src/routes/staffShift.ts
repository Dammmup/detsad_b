import express from 'express';
import StaffShift from '../models/StaffShift';
import StaffTimeTracking from '../models/StaffTimeTracking';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Get all shifts (with filters)
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    const { staffId, date, status, startDate, endDate } = req.query;
    
    const filter: any = {};
    
    // Role-based filtering
    if (req.user.role === 'teacher' || req.user.role === 'assistant') {
      filter.staffId = req.user.id;
    } else if (staffId) {
      filter.staffId = staffId;
    }
    
    if (date) {
      filter.date = new Date(date as string);
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (status) {
      filter.status = status;
    }
    
    const shifts = await StaffShift.find(filter)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName')
      .sort({ date: -1 });
    
    res.json(shifts);
  } catch (err) {
    console.error('Error fetching shifts:', err);
    res.status(500).json({ error: 'Ошибка получения смен' });
  }
});

// Create new shift
router.post('/', authMiddleware, authorizeRole(['admin', 'manager']), async (req: any, res) => {
  try {
    const shiftData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const shift = new StaffShift(shiftData);
    await shift.save();
    
    const populatedShift = await StaffShift.findById(shift._id)
      .populate('staffId', 'fullName role')
      .populate('createdBy', 'fullName');
    
    res.status(201).json(populatedShift);
  } catch (err) {
    console.error('Error creating shift:', err);
    res.status(400).json({ error: 'Ошибка создания смены' });
  }
});

// Update shift
router.put('/:id', authMiddleware, authorizeRole(['admin', 'manager']), async (req: any, res) => {
  try {
    const shift = await StaffShift.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!shift) {
      return res.status(404).json({ error: 'Смена не найдена' });
    }
    
    res.json(shift);
  } catch (err) {
    console.error('Error updating shift:', err);
    res.status(400).json({ error: 'Ошибка обновления смены' });
  }
});

// Check in/out for staff
router.post('/checkin/:shiftId', authMiddleware, async (req: any, res) => {
  try {
    const { shiftId } = req.params;
    const { location } = req.body;
    
    const shift = await StaffShift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Смена не найдена' });
    }
    
    // Check if user can check in to this shift
    if (shift.staffId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав для отметки в этой смене' });
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Update shift
    shift.actualStart = currentTime;
    shift.status = 'in_progress';
    
    // Calculate lateness
    const scheduledStart = new Date(`${shift.date.toDateString()} ${shift.scheduledStart}`);
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - scheduledStart.getTime()) / (1000 * 60)));
    
    if (lateMinutes > 0) {
      shift.lateMinutes = lateMinutes;
    }
    
    await shift.save();
    
    // Create or update time tracking record
    let timeTracking = await StaffTimeTracking.findOne({
      staffId: req.user.id,
      date: shift.date,
      shiftId: shift._id
    });
    
    if (!timeTracking) {
      timeTracking = new StaffTimeTracking({
        staffId: req.user.id,
        shiftId: shift._id,
        date: shift.date
      });
    }
    
    timeTracking.checkInTime = now;
    timeTracking.checkInLocation = location;
    timeTracking.status = 'checked_in';
    
    // Calculate late penalty
    if (lateMinutes > 0) {
      const penaltyAmount = lateMinutes * 500; // 500 тенге за минуту
      timeTracking.penalties.late = {
        minutes: lateMinutes,
        amount: penaltyAmount,
        reason: `Опоздание на ${lateMinutes} минут`
      };
    }
    
    await timeTracking.save();
    
    res.json({ shift, timeTracking, message: 'Успешно отмечен приход' });
  } catch (err) {
    console.error('Error checking in:', err);
    res.status(500).json({ error: 'Ошибка отметки прихода' });
  }
});

// Check out
router.post('/checkout/:shiftId', authMiddleware, async (req: any, res) => {
  try {
    const { shiftId } = req.params;
    const { location } = req.body;
    
    const shift = await StaffShift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ error: 'Смена не найдена' });
    }
    
    if (shift.staffId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав для отметки в этой смене' });
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Update shift
    shift.actualEnd = currentTime;
    shift.status = 'completed';
    
    // Calculate early leave
    const scheduledEnd = new Date(`${shift.date.toDateString()} ${shift.scheduledEnd}`);
    const earlyMinutes = Math.max(0, Math.floor((scheduledEnd.getTime() - now.getTime()) / (1000 * 60)));
    
    if (earlyMinutes > 0) {
      shift.earlyLeaveMinutes = earlyMinutes;
    }
    
    // Calculate overtime
    const overtimeMinutes = Math.max(0, Math.floor((now.getTime() - scheduledEnd.getTime()) / (1000 * 60)));
    if (overtimeMinutes > 0) {
      shift.overtimeMinutes = overtimeMinutes;
    }
    
    await shift.save();
    
    // Update time tracking
    const timeTracking = await StaffTimeTracking.findOne({
      staffId: req.user.id,
      date: shift.date,
      shiftId: shift._id
    });
    
    if (timeTracking) {
      timeTracking.checkOutTime = now;
      timeTracking.checkOutLocation = location;
      timeTracking.status = 'checked_out';
      // Calculate work duration manually
      if (timeTracking.checkInTime) {
        const duration = now.getTime() - timeTracking.checkInTime.getTime();
        timeTracking.workDuration = Math.floor(duration / (1000 * 60)) - (timeTracking.breakDuration || 0);
      }
      timeTracking.overtimeDuration = overtimeMinutes;
      
      // Calculate early leave penalty
      if (earlyMinutes > 0) {
        const penaltyAmount = earlyMinutes * 500;
        timeTracking.penalties.earlyLeave = {
          minutes: earlyMinutes,
          amount: penaltyAmount,
          reason: `Ранний уход на ${earlyMinutes} минут`
        };
      }
      
      // Calculate overtime bonus
      if (overtimeMinutes > 0) {
        const bonusAmount = overtimeMinutes * 750; // 750 тенге за минуту сверхурочных
        timeTracking.bonuses.overtime = {
          minutes: overtimeMinutes,
          amount: bonusAmount
        };
      }
      
      await timeTracking.save();
    }
    
    res.json({ shift, timeTracking, message: 'Успешно отмечен уход' });
  } catch (err) {
    console.error('Error checking out:', err);
    res.status(500).json({ error: 'Ошибка отметки ухода' });
  }
});

// Get time tracking records
router.get('/timetracking', authMiddleware, async (req: any, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    
    const filter: any = {};
    
    if (req.user.role === 'teacher' || req.user.role === 'assistant') {
      filter.staffId = req.user.id;
    } else if (staffId) {
      filter.staffId = staffId;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    const records = await StaffTimeTracking.find(filter)
      .populate('staffId', 'fullName role')
      .populate('shiftId')
      .sort({ date: -1 });
    
    res.json(records);
  } catch (err) {
    console.error('Error fetching time tracking:', err);
    res.status(500).json({ error: 'Ошибка получения учета времени' });
  }
});

// Update penalties/bonuses (admin only)
router.put('/timetracking/:id/adjustments', authMiddleware, authorizeRole(['admin', 'manager']), async (req: any, res) => {
  try {
    const { penalties, bonuses, notes } = req.body;
    
    const record = await StaffTimeTracking.findByIdAndUpdate(
      req.params.id,
      {
        penalties,
        bonuses,
        notes,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('staffId', 'fullName role');
    
    if (!record) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    res.json(record);
  } catch (err) {
    console.error('Error updating adjustments:', err);
    res.status(400).json({ error: 'Ошибка обновления корректировок' });
  }
});

export default router;
