import express from 'express';
import ChildAttendance from '../models/ChildAttendance';
import User from '../models/Users';
import Group from '../models/Group';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authRole';

const router = express.Router();

// Debug endpoint to check collection status
router.get('/debug', authMiddleware, async (req: any, res) => {
  try {
    const totalRecords = await ChildAttendance.countDocuments();
    const recentRecords = await ChildAttendance.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`🔍 Debug: Total attendance records in DB: ${totalRecords}`);
    
    res.json({
      totalRecords,
      recentRecords,
      collectionName: 'childattendances'
    });
  } catch (err) {
    console.error('Debug endpoint error:', err);
    res.status(500).json({ error: 'Debug error' });
  }
});

// Get attendance records with filters
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    console.log('📊 Child attendance request:', req.query);
    console.log('👤 User:', req.user.fullName, 'Role:', req.user.role);
    
    const { 
      groupId, 
      childId, 
      date, 
      startDate, 
      endDate, 
      status 
    } = req.query;
    
    const filter: any = {};
    
    // Role-based filtering
    if (req.user.role === 'teacher' || req.user.role === 'assistant') {
      // Teachers can only see their group's attendance
      if (groupId) {
        filter.groupId = groupId;
      } else {
        // Find teacher's groups and filter by them
        const Group = await import('../models/Group');
        const teacherGroups = await Group.default.find({ teacher: req.user.id });
        filter.groupId = { $in: teacherGroups.map(g => g._id) };
      }
    } else if (groupId) {
      filter.groupId = groupId;
    }
    
    if (childId) {
      filter.childId = childId;
    }
    
    if (date) {
      const targetDate = new Date(date as string);
      filter.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    if (status) {
      filter.status = status;
    }
    
    console.log('🔍 Filter used:', filter);
    
    const attendance = await ChildAttendance.find(filter)
      .sort({ date: -1, childId: 1 });
    
    console.log(`📋 Found ${attendance.length} attendance records`);
    console.log('📊 Sample records:', attendance.slice(0, 2));
    
    res.json(attendance);
  } catch (err) {
    console.error('Error fetching child attendance:', err);
    res.status(500).json({ error: 'Ошибка получения посещаемости' });
  }
});

// Create or update attendance record
router.post('/', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), async (req: any, res) => {
  try {
    console.log('💾 Saving attendance record:', req.body);
    console.log('👤 Marked by:', req.user.fullName);
    
    const { childId, groupId, date, status, checkInTime, checkOutTime, notes } = req.body;
    
    if (!childId || !groupId || !date || !status) {
      return res.status(400).json({ error: 'Обязательные поля: childId, groupId, date, status' });
    }
    
    // Check if record already exists for this child and date
    const existingRecord = await ChildAttendance.findOne({
      childId,
      date: new Date(date)
    });
    
    const attendanceData = {
      childId,
      groupId,
      date: new Date(date),
      status,
      checkInTime: checkInTime ? new Date(checkInTime) : undefined,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : undefined,
      notes,
      markedBy: req.user.id
    };
    
    let attendance;
    if (existingRecord) {
      // Update existing record
      attendance = await ChildAttendance.findOneAndUpdate(
        { childId, date: new Date(date) },
        attendanceData,
        { new: true }
      );
    } else {
      // Create new record
      attendance = new ChildAttendance(attendanceData);
      await attendance.save();
    }
    
    if (attendance) {
      console.log('✅ Attendance record saved successfully:', attendance._id);
      console.log('📅 Date:', attendance.date, 'Status:', attendance.status);
    }
    
    res.status(201).json(attendance);
  } catch (err) {
    console.error('Error creating/updating attendance:', err);
    res.status(400).json({ error: 'Ошибка сохранения посещаемости' });
  }
});

// Bulk create/update attendance records (for grid save)
router.post('/bulk', authMiddleware, authorizeRole(['admin', 'teacher', 'assistant']), async (req: any, res) => {
  try {
    const { records, groupId } = req.body;
    
    if (!Array.isArray(records) || !groupId) {
      return res.status(400).json({ error: 'Требуется массив records и groupId' });
    }
    
    const results = [];
    const errors = [];
    
    for (const record of records) {
      try {
        const { childId, date, status, notes } = record;
        
        if (!childId || !date || !status) {
          errors.push({ record, error: 'Отсутствуют обязательные поля' });
          continue;
        }
        
        // Check if record exists
        const existingRecord = await ChildAttendance.findOne({
          childId,
          date: new Date(date)
        });
        
        const attendanceData = {
          childId,
          groupId,
          date: new Date(date),
          status,
          notes,
          markedBy: req.user.id
        };
        
        let attendance;
        if (existingRecord) {
          attendance = await ChildAttendance.findByIdAndUpdate(
            existingRecord._id,
            attendanceData,
            { new: true }
          );
        } else {
          attendance = new ChildAttendance(attendanceData);
          await attendance.save();
        }
        
        results.push(attendance);
      } catch (err: any) {
        errors.push({ record, error: err.message });
      }
    }
    
    res.json({
      success: results.length,
      errorCount: errors.length,
      results,
      errors
    });
  } catch (err) {
    console.error('Error bulk saving attendance:', err);
    res.status(500).json({ error: 'Ошибка массового сохранения' });
  }
});

// Get attendance statistics
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    const { groupId, startDate, endDate } = req.query;
    
    const filter: any = {};
    
    if (groupId) {
      filter.groupId = groupId;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }
    
    const stats = await ChildAttendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalRecords = await ChildAttendance.countDocuments(filter);
    
    const result = {
      total: totalRecords,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      attendanceRate: totalRecords > 0 
        ? Math.round(((stats.find(s => s._id === 'present')?.count || 0) / totalRecords) * 100)
        : 0
    };
    
    res.json(result);
  } catch (err) {
    console.error('Error getting attendance stats:', err);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Delete attendance record
router.delete('/:id', authMiddleware, authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    const attendance = await ChildAttendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    res.json({ message: 'Запись удалена успешно' });
  } catch (err) {
    console.error('Error deleting attendance:', err);
    res.status(500).json({ error: 'Ошибка удаления записи' });
  }
});

export default router;
