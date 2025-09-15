import express from 'express';
import StaffAttendance from '../models/StaffAttendance';
import User from '../models/Users';
import Group from '../models/Group';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Debug endpoint to check collection status
router.get('/debug', authMiddleware, async (req: any, res) => {
  try {
    const totalRecords = await StaffAttendance.countDocuments();
    const recentRecords = await StaffAttendance.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`🔍 Debug: Total staff attendance records in DB: ${totalRecords}`);
    
    res.json({
      totalRecords,
      recentRecords,
      collectionName: 'staffattendances'
    });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ error: 'Debug error' });
  }
});

// Get staff attendance records with filters
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    console.log('📊 Staff attendance request:', req.query);
    console.log('👤 User:', req.user.fullName, 'Role:', req.user.role);
    
    const { 
      staffId, 
      groupId, 
      date, 
      startDate, 
      endDate, 
      status,
      shiftType 
    } = req.query;
    
    const filter: any = {};
    
    // Role-based filtering
    if (req.user.role === 'teacher' || req.user.role === 'assistant') {
      // Staff can only see their own attendance
      filter.staffId = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admins can see all attendance
      if (staffId) {
        filter.staffId = staffId;
      }
    }
    
    if (groupId) {
      filter.groupId = groupId;
    }
    
    if (date) {
      filter.date = new Date(date as string);
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (shiftType) {
      filter.shiftType = shiftType;
    }
    
    console.log('🔍 Filter used:', filter);
    
    const attendance = await StaffAttendance.find(filter)
      .sort({ date: -1, staffId: 1 });
    
    console.log(`📋 Found ${attendance.length} staff attendance records`);
    console.log('📊 Sample records:', attendance.slice(0, 2));
    
    res.json(attendance);
  } catch (err) {
    console.error('Error fetching staff attendance:', err);
    res.status(500).json({ error: 'Ошибка получения посещаемости сотрудников' });
  }
});

// Create or update staff attendance record
router.post('/', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), async (req: any, res) => {
  try {
    console.log('💾 Saving staff attendance record:', req.body);
    console.log('👤 Marked by:', req.user.fullName);
    
    const { 
      staffId, 
      groupId, 
      date, 
      shiftType, 
      scheduledStart, 
      scheduledEnd,
      actualStart,
      actualEnd,
      breakTime,
      status,
      location,
      notes 
    } = req.body;
    
    if (!staffId || !date || !shiftType || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ 
        error: 'Обязательные поля: staffId, date, shiftType, scheduledStart, scheduledEnd' 
      });
    }
    
    // Check if record already exists for this staff and date
    const existingRecord = await StaffAttendance.findOne({
      staffId,
      date: new Date(date)
    });
    
    const attendanceData = {
      staffId,
      groupId,
      date: new Date(date),
      shiftType,
      scheduledStart,
      scheduledEnd,
      actualStart,
      actualEnd,
      breakTime,
      status: status || 'scheduled',
      location,
      notes,
      markedBy: req.user.id
    };
    
    let attendance;
    if (existingRecord) {
      // Update existing record
      attendance = await StaffAttendance.findOneAndUpdate(
        { staffId, date: new Date(date) },
        attendanceData,
        { new: true }
      );
    } else {
      // Create new record
      attendance = new StaffAttendance(attendanceData);
      await attendance.save();
    }
    
    if (attendance) {
      console.log('✅ Staff attendance record saved successfully:', attendance._id);
      console.log('📅 Date:', attendance.date, 'Status:', attendance.status);
    }
    
    res.status(201).json(attendance);
  } catch (err) {
    console.error('Error creating/updating staff attendance:', err);
    res.status(400).json({ error: 'Ошибка сохранения посещаемости сотрудника' });
  }
});

// Bulk create/update staff attendance records
router.post('/bulk', authMiddleware, authorizeRole(['admin']), async (req: any, res) => {
  try {
    console.log('💾 Bulk saving staff attendance records');
    const { records } = req.body;
    
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Требуется массив records' });
    }
    
    const results = [];
    const errors = [];
    
    for (const record of records) {
      try {
        const attendanceData = {
          ...record,
          date: new Date(record.date),
          markedBy: req.user.id
        };
        
        const existingRecord = await StaffAttendance.findOne({
          staffId: record.staffId,
          date: new Date(record.date)
        });
        
        let attendance;
        if (existingRecord) {
          attendance = await StaffAttendance.findOneAndUpdate(
            { staffId: record.staffId, date: new Date(record.date) },
            attendanceData,
            { new: true }
          );
        } else {
          attendance = new StaffAttendance(attendanceData);
          await attendance.save();
        }
        
        results.push(attendance);
      } catch (error: any) {
        console.error('Error saving bulk record:', error);
        errors.push({
          record,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Bulk save completed: ${results.length} success, ${errors.length} errors`);
    
    res.status(201).json({
      success: results.length,
      errorCount: errors.length,
      errors,
      records: results
    });
  } catch (err) {
    console.error('Error bulk saving staff attendance:', err);
    res.status(400).json({ error: 'Ошибка массового сохранения посещаемости' });
  }
});

// Check-in endpoint
router.post('/check-in', authMiddleware, async (req: any, res) => {
  try {
    const { location } = req.body;
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log(`🕐 Check-in request from ${req.user.fullName} at ${today.toISOString()}`);
    
    // Find today's attendance record
    let attendance = await StaffAttendance.findOne({
      staffId: req.user.id,
      date: new Date(dateString)
    });
    
    if (!attendance) {
      return res.status(404).json({ 
        error: 'Смена на сегодня не найдена. Обратитесь к администратору.' 
      });
    }
    
    if (attendance.actualStart) {
      return res.status(400).json({ 
        error: 'Вы уже отметились на начало смены' 
      });
    }
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    attendance.actualStart = currentTime;
    attendance.status = 'in_progress';
    if (location) {
      attendance.location = { ...attendance.location, checkIn: location };
    }
    
    // Calculate lateness
    const lateMinutes = (attendance as any).calculateLateness();
    if (lateMinutes > 0) {
      attendance.lateMinutes = lateMinutes;
      attendance.status = 'late';
    }
    
    await attendance.save();
    
    console.log(`✅ Check-in successful for ${req.user.fullName}. Late: ${lateMinutes} minutes`);
    
    res.json({
      message: 'Успешно отмечен приход на работу',
      attendance,
      lateMinutes
    });
  } catch (err) {
    console.error('Error during check-in:', err);
    res.status(500).json({ error: 'Ошибка отметки прихода' });
  }
});

// Check-out endpoint
router.post('/check-out', authMiddleware, async (req: any, res) => {
  try {
    const { location } = req.body;
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log(`🕐 Check-out request from ${req.user.fullName} at ${today.toISOString()}`);
    
    // Find today's attendance record
    let attendance = await StaffAttendance.findOne({
      staffId: req.user.id,
      date: new Date(dateString)
    });
    
    if (!attendance) {
      return res.status(404).json({ 
        error: 'Смена на сегодня не найдена' 
      });
    }
    
    if (!attendance.actualStart) {
      return res.status(400).json({ 
        error: 'Сначала отметьтесь на начало смены' 
      });
    }
    
    if (attendance.actualEnd) {
      return res.status(400).json({ 
        error: 'Вы уже отметились на конец смены' 
      });
    }
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    attendance.actualEnd = currentTime;
    attendance.status = 'completed';
    if (location) {
      attendance.location = { ...attendance.location, checkOut: location };
    }
    
    // Calculate overtime and early leave
    const overtimeMinutes = (attendance as any).calculateOvertime();
    const earlyLeaveMinutes = (attendance as any).calculateEarlyLeave();
    
    attendance.overtimeMinutes = overtimeMinutes;
    attendance.earlyLeaveMinutes = earlyLeaveMinutes;
    
    await attendance.save();
    
    console.log(`✅ Check-out successful for ${req.user.fullName}. Overtime: ${overtimeMinutes}, Early leave: ${earlyLeaveMinutes} minutes`);
    
    res.json({
      message: 'Успешно отмечен уход с работы',
      attendance,
      overtimeMinutes,
      earlyLeaveMinutes,
      workHours: (attendance as any).workHours
    });
  } catch (err) {
    console.error('Error during check-out:', err);
    res.status(500).json({ error: 'Ошибка отметки ухода' });
  }
});

// Get attendance statistics
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    const { staffId, startDate, endDate, groupId } = req.query;
    
    const filter: any = {};
    
    // Role-based filtering
    if (req.user.role !== 'admin') {
      filter.staffId = req.user.id;
    } else if (staffId) {
      filter.staffId = staffId;
    }
    
    if (groupId) {
      filter.groupId = groupId;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    const records = await StaffAttendance.find(filter);
    
    const stats = {
      totalDays: records.length,
      presentDays: records.filter(r => r.status === 'completed' || r.status === 'in_progress').length,
      lateDays: records.filter(r => r.lateMinutes && r.lateMinutes > 0).length,
      totalLateMinutes: records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0),
      totalOvertimeMinutes: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0),
      totalEarlyLeaveMinutes: records.reduce((sum, r) => sum + (r.earlyLeaveMinutes || 0), 0),
      averageWorkHours: records.length > 0 
        ? records.reduce((sum, r) => sum + ((r as any).workMinutes || 0), 0) / records.length / 60
        : 0
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Error getting attendance stats:', err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Delete attendance record
router.delete('/:id', authMiddleware, authorizeRole(['admin']), async (req, res) => {
  try {
    const attendance = await StaffAttendance.findByIdAndDelete(req.params.id);
    if (!attendance) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    console.log('🗑️ Staff attendance record deleted:', req.params.id);
    res.json({ message: 'Запись удалена успешно' });
  } catch (err) {
    console.error('Error deleting staff attendance:', err);
    res.status(500).json({ error: 'Ошибка удаления записи' });
  }
});

export default router;
