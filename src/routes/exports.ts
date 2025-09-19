import express from 'express';
import User from '../models/Users';
import Group from '../models/Group';
import ChildAttendance from '../models/ChildAttendance';
import StaffAttendance from '../models/StaffAttendance';
import { authMiddleware } from '../middlewares/authMiddleware';
import { authorizeRole } from '../middlewares/authRole';
import DataCleanupService from '../services/dataCleanupService';
import EmailService from '../services/emailService';
import Schedule from '../models/Schedule';

const router = express.Router();

// Инициализируем сервисы
const dataCleanupService = new DataCleanupService();
const emailService = new EmailService();

// Экспорт списка детей
// Экспорт сотрудников на email
router.post('/staff', authMiddleware, async (req: any, res) => {
  try {
    const staff = await User.find({ type: 'adult' });
    const groups = await Group.find({});
    const exportData = staff.map(member => {
      const group = groups.find(g => (g as any)._id.toString() === member.groupId?.toString());
      return {
        fullName: member.fullName || '',
        role: member.role || '',
        groupName: group?.name || '',
        phone: member.phone || '',
        email: (member as any).email || '',
        hireDate: member.createdAt ? (member.createdAt as any).toLocaleDateString?.() || member.createdAt.toString() : '',
        status: 'Активный',
        salary: member.salary ? `${member.salary} тенге` : ''
      };
    });
    const adminEmails = ['aldamiram@mail.ru'];
    await emailService.sendExcel({
      to: adminEmails,
      subject: 'Экспорт списка сотрудников',
      filename: `staff_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Сотрудники',
      title: 'Список сотрудников',
      headers: ['ФИО', 'Должность', 'Группа', 'Телефон', 'Email', 'Дата приема', 'Статус', 'Зарплата'],
      data: exportData.map(row => [
        row.fullName,
        row.role,
        row.groupName,
        row.phone,
        row.email,
        row.hireDate,
        row.status,
        row.salary
      ])
    });
    res.json({ success: true, message: 'Экспорт отправлен на email.' });
  } catch (e) {
    console.error('Ошибка экспорта/отправки на email:', e);
    res.status(500).json({ success: false, message: 'Ошибка экспорта/отправки на email.' });
  }
});

// Экспорт расписания на email
router.post('/schedule', authMiddleware, async (req: any, res) => {
  try {
    const events = await Schedule.find({});
    const exportData = events.map(ev => [
      ev.date,
      ev.startTime || '',
      ev.endTime || '',
      ev.status || '',
      ev.userId || '',
      ev.notes || ''
    ]);
    const adminEmails = ['aldamiram@mail.ru'];
    await emailService.sendExcel({
      to: adminEmails,
      subject: 'Экспорт расписания смен',
      filename: `schedule_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Расписание',
      title: 'Расписание смен',
      headers: ['Дата', 'Начало', 'Конец', 'Тип смены', 'Сотрудник', 'Заметки'],
      data: exportData
    });
    res.json({ success: true, message: 'Экспорт отправлен на email.' });
  } catch (e) {
    console.error('Ошибка экспорта/отправки на email:', e);
    res.status(500).json({ success: false, message: 'Ошибка экспорта/отправки на email.' });
  }
});

// Экспорт табеля посещаемости детей на email
router.post('/children-attendance', authMiddleware, async (req: any, res) => {
  try {
    const attendance = await ChildAttendance.find({});
    const children = await User.find({ type: 'child' });
    const groups = await Group.find({});
    const exportData = attendance.map(record => {
      const child = children.find(c => (c as any)._id.toString() === record.childId.toString());
      const group = groups.find(g => (g as any)._id.toString() === record.groupId?.toString());
      return [
        child?.fullName || '',
        group?.name || '',
        record.date,
        record.status,
        record.checkInTime || '',
        record.checkOutTime || '',
        record.notes || ''
      ];
    });
    const adminEmails = ['aldamiram@mail.ru'];
    await emailService.sendExcel({
      to: adminEmails,
      subject: 'Экспорт табеля посещаемости детей',
      filename: `children_attendance_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Табель детей',
      title: 'Табель посещаемости детей',
      headers: ['ФИО', 'Группа', 'Дата', 'Статус', 'Вход', 'Выход', 'Заметки'],
      data: exportData
    });
    res.json({ success: true, message: 'Экспорт отправлен на email.' });
  } catch (e) {
    console.error('Ошибка экспорта/отправки на email:', e);
    res.status(500).json({ success: false, message: 'Ошибка экспорта/отправки на email.' });
  }
});

// Экспорт табеля посещаемости сотрудников на email
router.post('/staff-attendance', authMiddleware, async (req: any, res) => {
  try {
    const attendance = await StaffAttendance.find({});
    const staff = await User.find({ type: 'adult' });
    const groups = await Group.find({});
    const exportData = attendance.map(record => {
      const staffMember = staff.find(s => (s as any)._id.toString() === record.staffId.toString());
      const group = groups.find(g => (g as any)._id.toString() === record.groupId?.toString());
      return [
        staffMember?.fullName || '',
        group?.name || '',
        record.date,
        record.status,
        record.location?.checkIn || '',
        record.location?.checkOut || '',
        record.notes || ''
      ];
    });
    const adminEmails = ['aldamiram@mail.ru'];
    await emailService.sendExcel({
      to: adminEmails,
      subject: 'Экспорт табеля сотрудников',
      filename: `staff_attendance_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Табель сотрудников',
      title: 'Табель посещаемости сотрудников',
      headers: ['ФИО', 'Группа', 'Дата', 'Статус', 'Вход', 'Выход', 'Заметки'],
      data: exportData
    });
    res.json({ success: true, message: 'Экспорт отправлен на email.' });
  } catch (e) {
    console.error('Ошибка экспорта/отправки на email:', e);
    res.status(500).json({ success: false, message: 'Ошибка экспорта/отправки на email.' });
  }
});

// Отправка Excel на email админов
router.post('/children', authMiddleware, async (req: any, res) => {
  try {
    const groupId = req.body.groupId || req.query.groupId || 'all';
    const users = await User.find({ type: 'child', ...(groupId !== 'all' ? { groupId } : {}) });
    const groups = await Group.find({});
    const exportData = users.map(child => {
      const group = groups.find(g => (g as any)._id.toString() === child.groupId?.toString());
      return {
        fullName: child.fullName || '',
        birthDate: child.birthday ? (child.birthday as any).toLocaleDateString?.() || child.birthday.toString() : '',
        groupName: group?.name || '',
        parentName: child.parentName || '',
        parentPhone: child.parentPhone || '',
        address: (child as any).address || '',
        enrollmentDate: child.createdAt ? (child.createdAt as any).toLocaleDateString?.() || child.createdAt.toString() : '',
        status: 'Активный'
      };
    });
    // Используем конкретный email для отправки
    const adminEmails = ['aldamiram@mail.ru'];
    // Формируем Excel и отправляем на email
    await emailService.sendExcel({
      to: adminEmails,
      subject: 'Экспорт списка детей',
      filename: `children_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Дети',
      title: 'Список детей',
      headers: ['ФИО', 'Дата рождения', 'Группа', 'Родитель', 'Телефон родителя', 'Адрес', 'Дата поступления', 'Статус'],
      data: exportData.map(row => [
        row.fullName,
        row.birthDate,
        row.groupName,
        row.parentName,
        row.parentPhone,
        row.address,
        row.enrollmentDate,
        row.status
      ])
    });
    res.json({ success: true, message: 'Экспорт отправлен на email администраторов.' });
  } catch (e) {
    console.error('Ошибка экспорта/отправки на email:', e);
    res.status(500).json({ success: false, message: 'Ошибка экспорта/отправки на email.' });
  }
});

router.get('/children', authMiddleware, authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    console.log('📊 Export children list request from:', req.user.fullName);
    
    const { groupId } = req.query;
    
    // Фильтр для детей
    const filter: any = { type: 'child' };
    if (groupId && groupId !== 'all') {
      filter.groupId = groupId;
    }
    
    const children = await User.find(filter);
    const groups = await Group.find({});
    
    // Подготавливаем данные для экспорта
    const exportData = children.map(child => {
      const group = groups.find(g => (g as any)._id.toString() === child.groupId?.toString());
      return {
        fullName: child.fullName || '',
        birthDate: child.birthday ? (child.birthday as any).toLocaleDateString?.() || child.birthday.toString() : '',
        groupName: group?.name || '',
        parentName: child.parentName || '',
        parentPhone: child.parentPhone || '',
        address: (child as any).address || '',
        enrollmentDate: child.createdAt ? (child.createdAt as any).toLocaleDateString?.() || child.createdAt.toString() : '',
        status: 'Активный'
      };
    });
    
    const groupName = groupId && groupId !== 'all' 
      ? groups.find(g => g?._id?.toString() === groupId)?.name 
      : null;
    
    res.json({
      success: true,
      data: exportData,
      groupName,
      totalCount: children.length,
      exportDate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error exporting children list:', error);
    res.status(500).json({ error: 'Ошибка экспорта списка детей' });
  }
});

// Экспорт списка сотрудников
router.get('/staff', authMiddleware, authorizeRole(['admin']), async (req: any, res) => {
  try {
    console.log('📊 Export staff list request from:', req.user.fullName);
    
    const staff = await User.find({ type: 'adult' });
    const groups = await Group.find({});
    
    // Подготавливаем данные для экспорта
    const exportData = staff.map(member => {
      const group = groups.find(g => (g as any)._id.toString() === member.groupId?.toString());
      return {
        fullName: member.fullName || '',
        role: member.role || '',
        groupName: group?.name || '',
        phone: member.phone || '',
        email: (member as any).email || '',
        hireDate: member.createdAt ? (member.createdAt as any).toLocaleDateString?.() || member.createdAt.toString() : '',
        status: 'Активный',
        salary: member.salary ? `${member.salary} тенге` : '',
        password: (member as any).initialPassword || '' // Только для админов
      };
    });
    
    res.json({
      success: true,
      data: exportData,
      totalCount: staff.length,
      exportDate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error exporting staff list:', error);
    res.status(500).json({ error: 'Ошибка экспорта списка сотрудников' });
  }
});

// Экспорт расписания/смен
router.get('/schedule', authMiddleware, authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    console.log('📊 Export schedule request from:', req.user.fullName);
    
    const { startDate, endDate, staffId, groupId } = req.query;
    
    // Фильтр для расписания
    const filter: any = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else {
      // По умолчанию текущий месяц
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    if (staffId && staffId !== 'all') {
      filter.staffId = staffId;
    }
    
    if (groupId && groupId !== 'all') {
      filter.groupId = groupId;
    }
    
    const scheduleData = await StaffAttendance.find(filter).sort({ date: 1, staffId: 1 });
    const staff = await User.find({ type: 'adult' });
    const groups = await Group.find({});
    
    // Подготавливаем данные для экспорта
    const exportData = scheduleData.map(item => {
      const staffMember = staff.find(s => (s as any)._id.toString() === item.staffId.toString());
      const group = groups.find(g => (g as any)._id.toString() === item.groupId?.toString());
      
      const date = new Date(item.date);
      const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const formattedDate = `${date.toLocaleDateString('ru-RU')} (${weekdays[date.getDay()]})`;
      
      return {
        date: formattedDate,
        staffName: staffMember?.fullName || '',
        groupName: group?.name || '',
        shiftType: item.shiftType || '',
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        actualStart: item.actualStart || '',
        actualEnd: item.actualEnd || '',
        status: item.status || '',
        notes: item.notes || ''
      };
    });
    
    res.json({
      success: true,
      data: exportData,
      totalCount: scheduleData.length,
      period: { startDate, endDate },
      exportDate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error exporting schedule:', error);
    res.status(500).json({ error: 'Ошибка экспорта расписания' });
  }
});

// Экспорт табеля посещаемости детей
router.get('/children-attendance', authMiddleware, authorizeRole(['admin', 'teacher']), async (req: any, res) => {
  try {
    console.log('📊 Export children attendance request from:', req.user.fullName);
    
    const { startDate, endDate, groupId, childId } = req.query;
    
    // Фильтр для посещаемости
    const filter: any = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else {
      // По умолчанию текущий месяц
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    if (groupId && groupId !== 'all') {
      filter.groupId = groupId;
    }
    
    if (childId && childId !== 'all') {
      filter.childId = childId;
    }
    
    const attendanceData = await ChildAttendance.find(filter).sort({ date: 1, childId: 1 });
    const children = await User.find({ type: 'child' });
    const groups = await Group.find({});
    
    // Подготавливаем данные для экспорта
    const exportData = attendanceData.map(record => {
      const child = children.find(c => (c as any)._id.toString() === record.childId.toString());
      const group = groups.find(g => (g as any)._id.toString() === record.groupId?.toString());
      
      const date = new Date(record.date);
      const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const formattedDate = `${date.toLocaleDateString('ru-RU')} (${weekdays[date.getDay()]})`;
      
      return {
        childName: child?.fullName || '',
        date: formattedDate,
        status: record.status === 'present' ? 'Присутствовал' :
                record.status === 'absent' ? 'Отсутствовал' :
                record.status === 'late' ? 'Опоздал' :
                record.status === 'sick' ? 'Болел' :
                record.status === 'vacation' ? 'Отпуск' : record.status || '',
        checkInTime: record.checkInTime || '',
        checkOutTime: record.checkOutTime || '',
        groupName: group?.name || '',
        notes: record.notes || ''
      };
    });
    
    const groupName = groupId && groupId !== 'all' 
      ? groups.find(g => g?._id?.toString() === groupId)?.name 
      : null;
    
    res.json({
      success: true,
      data: exportData,
      groupName,
      totalCount: attendanceData.length,
      period: { startDate, endDate },
      exportDate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error exporting children attendance:', error);
    res.status(500).json({ error: 'Ошибка экспорта табеля посещаемости детей' });
  }
});

// Экспорт табеля рабочего времени сотрудников
router.get('/staff-attendance', authMiddleware, authorizeRole(['admin']), async (req: any, res) => {
  try {
    console.log('📊 Export staff attendance request from:', req.user.fullName);
    
    const { startDate, endDate, staffId, groupId } = req.query;
    
    // Фильтр для посещаемости
    const filter: any = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    } else {
      // По умолчанию текущий месяц
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    if (staffId && staffId !== 'all') {
      filter.staffId = staffId;
    }
    
    if (groupId && groupId !== 'all') {
      filter.groupId = groupId;
    }
    
    const attendanceData = await StaffAttendance.find(filter).sort({ date: 1, staffId: 1 });
    const staff = await User.find({ type: 'adult' });
    const groups = await Group.find({});
    
    // Подготавливаем данные для экспорта
    const exportData = attendanceData.map(record => {
      const staffMember = staff.find(s => (s as any)._id.toString() === record.staffId.toString());
      const group = groups.find(g => (g as any)._id.toString() === record.groupId?.toString());
      
      const date = new Date(record.date);
      const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const formattedDate = `${date.toLocaleDateString('ru-RU')} (${weekdays[date.getDay()]})`;
      
      return {
        staffName: staffMember?.fullName || '',
        date: formattedDate,
        shiftType: record.shiftType || '',
        scheduledTime: `${record.startTime || ''} - ${record.endTime || ''}`,
        actualTime: `${record.actualStart || ''} - ${record.actualEnd || ''}`,
        lateMinutes: record.lateMinutes || 0,
        overtimeMinutes: record.overtimeMinutes || 0,
        status: record.status === 'completed' ? 'Завершено' :
                record.status === 'in_progress' ? 'В процессе' :
                record.status === 'late' ? 'Опоздание' :
                record.status === 'no_show' ? 'Не явился' : record.status || '',
        groupName: group?.name || '',
        notes: record.notes || ''
      };
    });
    
    res.json({
      success: true,
      data: exportData,
      totalCount: attendanceData.length,
      period: { startDate, endDate },
      exportDate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error exporting staff attendance:', error);
    res.status(500).json({ error: 'Ошибка экспорта табеля рабочего времени' });
  }
});

// Тестирование отправки месячных отчетов
router.post('/test-monthly-reports', authMiddleware, authorizeRole(['admin']), async (req: any, res) => {
  try {
    console.log('🧪 Test monthly reports request from:', req.user.fullName);
    
    await dataCleanupService.testMonthlyTasks();
    
    res.json({
      success: true,
      message: 'Тестовая отправка месячных отчетов выполнена'
    });
    
  } catch (error) {
    console.error('Error testing monthly reports:', error);
    res.status(500).json({ error: 'Ошибка тестирования месячных отчетов' });
  }
});

// Тестирование email соединения
router.get('/test-email', authMiddleware, authorizeRole(['admin']), async (req: any, res) => {
  try {
    console.log('📧 Test email connection request from:', req.user.fullName);
    
    const isConnected = await emailService.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? 'Email соединение работает' : 'Ошибка подключения к email'
    });
    
  } catch (error) {
    console.error('Error testing email connection:', error);
    res.status(500).json({ error: 'Ошибка тестирования email соединения' });
  }
});

export default router;
