import express from 'express';
import { Request, Response } from 'express';
import { authorizeRole } from '../middlewares/authRole';
import { authMiddleware } from '../middlewares/authMiddleware';
import childrenApi from '../entities/children/model';
import groupsApi from '../entities/groups/model';
import User from '../entities/users/model';
import { getChildAttendance } from '../entities/childAttendance/service';
import { staffAttendanceTrackingService } from '../entities/staffAttendanceTracking/controller';
import { ShiftsService } from '../entities/staffShifts/service';

import { createExcelBuffer } from '../utils/excelUtils';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import { promises as fs } from 'fs';

const router = express.Router();

router.post('/children', authMiddleware, authorizeRole(['admin', 'manager', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;

    const query: any = {};
    if (filters?.name) {
      query.fullName = { $regex: filters.name, $options: 'i' };
    }
    if (filters?.group) {
      query.groupId = filters.group;
    }

    const children = await childrenApi.find(query).populate('groupId');

    if (format === 'excel') {
      const data = children.map((child: any) => ({
        fullName: child.fullName,
        birthday: child.birthday ? new Date(child.birthday).toLocaleDateString() : '',
        parentName: child.parentName,
        parentPhone: child.parentPhone,
        iin: child.iin,
        group: child.groupId ? child.groupId.name : '-',
        notes: child.notes,
        active: child.active ? 'Да' : 'Нет',
      }));

      const headers = [
        { header: 'ФИО', key: 'fullName', width: 30 },
        { header: 'Дата рождения', key: 'birthday', width: 15 },
        { header: 'Имя родителя', key: 'parentName', width: 30 },
        { header: 'Телефон родителя', key: 'parentPhone', width: 20 },
        { header: 'ИИН', key: 'iin', width: 20 },
        { header: 'Группа', key: 'group', width: 15 },
        { header: 'Заметки', key: 'notes', width: 40 },
        { header: 'Активен', key: 'active', width: 10 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Список детей');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="children.xlsx"');
      res.send(buffer);

    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="children_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).text('Список детей', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['ФИО', 'Дата рождения', 'Группа', 'Активен'];
      const startY = doc.y;
      let currentY = startY;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + i * 120, currentY, { width: 100, align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      children.forEach((child: any) => {
        const rowData = [
          child.fullName,
          child.birthday ? new Date(child.birthday).toLocaleDateString() : '',
          child.groupId ? child.groupId.name : '-',
          child.active ? 'Да' : 'Нет',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, 50 + i * 120, currentY, { width: 100, align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + i * 120, currentY, { width: 100, align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const records = children.map((child: any) => ({
        fullName: child.fullName,
        birthday: child.birthday ? new Date(child.birthday).toLocaleDateString() : '',
        parentName: child.parentName,
        parentPhone: child.parentPhone,
        iin: child.iin,
        group: child.groupId ? child.groupId.name : '-',
        notes: child.notes,
        active: child.active ? 'Да' : 'Нет',
      }));

      const csvString = records.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="children_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting children list:', error);
    res.status(500).send('Error exporting children list');
  }
});

router.post('/groups', authMiddleware, authorizeRole(['admin', 'manager', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { format } = req.body;

    const groups = await groupsApi.find({});

    if (format === 'excel') {
      const data = groups.map((group: any) => ({
        name: group.name,
        description: group.description,
        maxStudents: group.maxStudents,
        ageGroup: Array.isArray(group.ageGroup) ? group.ageGroup.join(', ') : group.ageGroup,
        teacher: group.teacher ? group.teacher.fullName : '-',
      }));

      const headers = [
        { header: 'Название группы', key: 'name', width: 30 },
        { header: 'Описание', key: 'description', width: 40 },
        { header: 'Макс. студентов', key: 'maxStudents', width: 15 },
        { header: 'Возрастная группа', key: 'ageGroup', width: 20 },
        { header: 'Воспитатель', key: 'teacher', width: 30 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Список групп');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="groups.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="groups_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).text('Список групп', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Название группы', 'Описание', 'Макс. студентов', 'Возрастная группа'];
      const startY = doc.y;
      let currentY = startY;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + i * 120, currentY, { width: 100, align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      groups.forEach((group: any) => {
        const rowData = [
          group.name,
          group.description,
          group.maxStudents.toString(),
          group.ageGroup.join(', '),
        ];
        rowData.forEach((data, i) => {
          doc.text(data, 50 + i * 120, currentY, { width: 100, align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + i * 120, currentY, { width: 100, align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const records = groups.map((group: any) => ({
        name: group.name,
        description: group.description,
        maxStudents: group.maxStudents,
        ageGroup: group.ageGroup.join(', '),
        teacher: group.teacher ? group.teacher.fullName : '-',
      }));

      const csvString = records.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="groups_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting groups list:', error);
    res.status(500).send('Error exporting groups list');
  }
});

router.post('/children-attendance', authMiddleware, authorizeRole(['admin', 'manager', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { format, groupId, startDate, endDate } = req.body;

    const attendanceRecords = await getChildAttendance({
      groupId,
      startDate,
      endDate
    }, (req as any).user.id, (req as any).user.role);

    const children = await childrenApi.find(groupId ? { groupId } : {});
    const groups = await groupsApi.find(groupId ? { _id: groupId } : {});

    const data = attendanceRecords.map((record: any) => {
      const child = children.find((c: any) => c._id.toString() === record.childId.toString());
      const group = groups.find((g: any) => g._id.toString() === record.groupId.toString());
      return {
        childName: child ? child.fullName : '-',
        groupName: group ? group.name : '-',
        date: new Date(record.date).toLocaleDateString(),
        status: record.status,
        notes: record.notes || '-',
      };
    });

    if (format === 'excel') {
      const headers = [
        { header: 'Имя ребенка', key: 'childName', width: 30 },
        { header: 'Группа', key: 'groupName', width: 15 },
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Заметки', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Посещаемость детей');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="children_attendance.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="children_attendance_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).text('Посещаемость детей', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Имя ребенка', 'Группа', 'Дата', 'Статус', 'Заметки'];
      const startY = doc.y;
      let currentY = startY;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + i * 100, currentY, { width: 90, align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      data.forEach((record: any) => {
        const rowData = [
          record.childName,
          record.groupName,
          record.date,
          record.status,
          record.notes,
        ];
        rowData.forEach((data, i) => {
          doc.text(data, 50 + i * 100, currentY, { width: 90, align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + i * 100, currentY, { width: 90, align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const records = data.map((record: any) => ({
        childName: record.childName,
        groupName: record.groupName,
        date: record.date,
        status: record.status,
        notes: record.notes,
      }));

      const csvString = records.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="children_attendance_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting children attendance list:', error);
    res.status(500).send('Error exporting children attendance list');
  }
});

router.post('/staff', authMiddleware, authorizeRole(['admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;


    const roleTranslations: Record<string, string> = {
      'admin': 'Администратор',
      'manager': 'Менеджер',
      'director': 'Директор',
      'teacher': 'Воспитатель',
      'assistant': 'Помощник воспитателя',
      'psychologist': 'Психолог',
      'speech_therapist': 'Логопед',
      'music_teacher': 'Музыкальный руководитель',
      'physical_education': 'Инструктор по физкультуре',
      'nurse': 'Медсестра',
      'doctor': 'Врач',
      'cook': 'Повар',
      'cleaner': 'Уборщица',
      'security': 'Охранник',
      'maintenance': 'Завхоз',
      'laundry': 'Прачка',
      'staff': 'Сотрудник',
      'substitute': 'Подменный сотрудник',
      'intern': 'Стажер',
      'tenant': 'Арендатор'
    };

    const query: any = {};
    if (filters?.name) {
      query.fullName = { $regex: filters.name, $options: 'i' };
    }
    if (filters?.role) {

      if (Array.isArray(filters.role)) {

        const englishRoles = filters.role.map((r: string) => {

          const englishRole = Object.keys(roleTranslations).find(key => roleTranslations[key] === r);
          return englishRole || r;
        });
        query.role = { $in: englishRoles };
      } else {
        query.role = filters.role;
      }
    }


    if (filters?.type === 'tenant') {
      query.role = 'tenant';
    }

    const staff = await User.find(query);

    if (format === 'excel') {
      const data = staff.map((s: any) => ({
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        role: s.role ? roleTranslations[s.role] || s.role : 'Не указана',
        iin: s.iin || '',
        active: s.active ? 'Да' : 'Нет',
      }));

      const headers = [
        { header: 'ФИО', key: 'fullName', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Телефон', key: 'phone', width: 20 },
        { header: 'ИИН', key: 'iin', width: 20 },
        { header: 'Роль', key: 'role', width: 20 },
        { header: 'Активен', key: 'active', width: 10 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Список сотрудников');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="staff.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="staff_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).text('Список сотрудников', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['ФИО', 'Email', 'Телефон', 'ИИН', 'Роль', 'Активен'];
      const startY = doc.y;
      let currentY = startY;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + i * 80, currentY, { width: 70, align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      staff.forEach((s: any) => {
        const rowData = [
          s.fullName,
          s.email,
          s.phone,
          s.iin || '',
          s.role ? roleTranslations[s.role] || s.role : 'Не указана',
          s.active ? 'Да' : 'Нет',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, 50 + i * 80, currentY, { width: 70, align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + i * 80, currentY, { width: 70, align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const records = staff.map((s: any) => ({
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        iin: s.iin || '',
        role: s.role ? roleTranslations[s.role] || s.role : 'Не указана',
        active: s.active ? 'Да' : 'Нет',
      }));

      const csvString = records.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="staff_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting staff list:', error);
    res.status(500).send('Error exporting staff list');
  }
});

router.post('/staff-schedule', authMiddleware, authorizeRole(['admin', 'manager', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { format, startDate, endDate, staffId, groupId, status } = req.body;

    const query: any = {};
    if (startDate) {
      query.startDate = startDate;
    }
    if (endDate) {
      query.endDate = endDate;
    }
    if (staffId) {
      query.staffId = staffId;
    }
    if (groupId) {
      query.groupId = groupId;
    }
    if (status) {
      query.status = status;
    }

    const shiftsService = new ShiftsService();
    const shifts = await shiftsService.getAll(query, (req as any).user.id, (req as any).user.role);


    if (format === 'excel') {
      const data = shifts.map((shift: any) => ({
        staffName: shift.staffName,
        date: new Date(shift.date).toLocaleDateString(),
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status,
        notes: shift.notes,
      }));

      const headers = [
        { header: 'Сотрудник', key: 'staffName', width: 30 },
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Время начала', key: 'startTime', width: 15 },
        { header: 'Время окончания', key: 'endTime', width: 15 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Примечания', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'График смен');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="staff_schedule.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="staff_schedule_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).text('График смен', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Сотрудник', 'Дата', 'Начало', 'Окончание', 'Статус', 'Примечания'];
      const startY = doc.y;
      let currentY = startY;

      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + i * 90, currentY, { width: 80, align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;

      doc.fontSize(10).font('Helvetica');
      shifts.forEach((shift: any) => {
        const rowData = [
          shift.staffName,
          new Date(shift.date).toLocaleDateString(),
          shift.startTime,
          shift.endTime,
          shift.status,
          shift.notes,
        ];
        rowData.forEach((data, i) => {
          doc.text(data, 50 + i * 90, currentY, { width: 80, align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + i * 90, currentY, { width: 80, align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });
      doc.end();
    } else if (format === 'csv') {
      const records = shifts.map((shift: any) => ({
        staffName: shift.staffName,
        date: new Date(shift.date).toLocaleDateString(),
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status,
        notes: shift.notes,
      }));

      const csvString = records.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="staff_schedule_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting staff schedule:', error);
    res.status(500).send('Error exporting staff schedule');
  }
});

router.post('/staff-attendance-tracking', authMiddleware, authorizeRole(['admin', 'manager', 'teacher']), async (req: Request, res: Response) => {
  try {
    const { format, startDate, endDate, staffId, status } = req.body;

    const filters: any = {};
    if (staffId) filters.staffId = staffId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const attendanceRecords = await staffAttendanceTrackingService.getAll(filters);

    const records = (attendanceRecords as any[]).map((record: any) => ({
      staffName: record.staffId.fullName || 'Неизвестно',
      date: new Date(record.date).toLocaleDateString(),
      actualStart: record.actualStart ? new Date(record.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-',
      actualEnd: record.actualEnd ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-',
      status: record.status,
      workDuration: record.workDuration ? `${Math.floor(record.workDuration / 60)}ч ${record.workDuration % 60}м` : '-',
      notes: record.notes || '-',
      penalties: (record.penalties?.late?.amount || 0) + (record.penalties?.earlyLeave?.amount || 0) + (record.penalties?.unauthorized?.amount || 0),
      bonuses: (record.bonuses?.overtime?.amount || 0) + (record.bonuses?.punctuality?.amount || 0),
    }));

    if (format === 'excel') {
      const headers = [
        { header: 'Сотрудник', key: 'staffName', width: 30 },
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Приход', key: 'actualStart', width: 15 },
        { header: 'Уход', key: 'actualEnd', width: 15 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Время работы', key: 'workDuration', width: 15 },
        { header: 'Вычеты', key: 'penalties', width: 15 },
        { header: 'Бонусы', key: 'bonuses', width: 15 },
        { header: 'Примечания', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, records, 'Учет рабочего времени');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="staff_attendance_tracking.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="staff_attendance_tracking_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).text('Учет рабочего времени', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Сотрудник', 'Дата', 'Приход', 'Уход', 'Статус', 'Время работы', 'Вычеты', 'Бонусы', 'Примечания'];
      const startY = doc.y;
      let currentY = startY;

      doc.fontSize(8).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, 50 + i * 60, currentY, { width: 55, align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;

      doc.fontSize(8).font('Helvetica');
      records.forEach((record: any) => {
        const rowData = [
          record.staffName,
          record.date,
          record.actualStart,
          record.actualEnd,
          record.status,
          record.workDuration,
          record.penalties.toString(),
          record.bonuses.toString(),
          record.notes,
        ];
        rowData.forEach((data, i) => {
          doc.text(data, 50 + i * 60, currentY, { width: 55, align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(8).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, 50 + i * 60, currentY, { width: 55, align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(8).font('Helvetica');
        }
      });
      doc.end();
    } else if (format === 'csv') {
      const csvString = records.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="staff_attendance_tracking_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting staff attendance tracking:', error);
    res.status(500).send('Error exporting staff attendance tracking');
  }
});

router.post('/organoleptic-journal', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'nurse']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    const { date, group, responsibleSignature, records } = filters;

    if (format === 'excel') {
      const data = records.map((r: any) => ({
        dish: r.dish,
        group: r.group,
        appearance: r.appearance,
        taste: r.taste,
        smell: r.smell,
        decision: r.decision,
      }));

      const headers = [
        { header: 'Блюдо', key: 'dish', width: 30 },
        { header: 'Группа', key: 'group', width: 15 },
        { header: 'Внешний вид', key: 'appearance', width: 25 },
        { header: 'Вкус', key: 'taste', width: 25 },
        { header: 'Запах', key: 'smell', width: 25 },
        { header: 'Решение', key: 'decision', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Журнал органолептической оценки');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="organoleptic_journal_${Date.now()}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="organoleptic_journal_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(20).text('Журнал органолептической оценки качества блюд', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Дата: ${date}`);
      doc.fontSize(12).text(`Подпись ответственного: ${responsibleSignature || 'Не указана'}`);
      doc.moveDown();

      const tableHeaders = ['Блюдо', 'Группа', 'Внешний вид', 'Вкус', 'Запах', 'Решение'];
      const columnWidths = [100, 70, 90, 80, 80, 120];
      const startX = 50;
      let currentY = doc.y;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      records.forEach((r: any) => {
        const rowData = [
          r.dish || '',
          r.group || '',
          r.appearance || '',
          r.taste || '',
          r.smell || '',
          r.decision || '',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const csvString = records.map((r: any) =>
        [`"${r.dish}"`, `"${r.group}"`, `"${r.appearance}"`, `"${r.taste}"`, `"${r.smell}"`, `"${r.decision}"`].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="organoleptic_journal_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting organoleptic journal:', error);
    res.status(500).send('Error exporting organoleptic journal');
  }
});

router.post('/food-norms-control', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'nurse']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    const { rows, note, month, year, group } = filters;

    if (format === 'excel') {
      const data = rows.map((r: any) => ({
        product: r.product,
        norm: r.norm,
        actual: r.actual,
        deviation: r.deviation,
        status: r.status,
      }));

      const headers = [
        { header: 'Наименование пищевой продукции', key: 'product', width: 40 },
        { header: 'Норма (г/мл)', key: 'norm', width: 20 },
        { header: 'Фактически', key: 'actual', width: 20 },
        { header: 'Отклонение (%)', key: 'deviation', width: 20 },
        { header: 'Статус', key: 'status', width: 20 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Ведомость контроля норм питания', [
        ['Ведомость контроля за выполнением норм пищевой продукции (Форма 4)'],
        [`Месяц: ${month}, Год: ${year}, Группа: ${group}`],
        [`Примечание: ${note}`],
        [],
      ]);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="food_norms_control_${Date.now()}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="food_norms_control_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(16).text('Ведомость контроля за выполнением норм пищевой продукции (Форма 4)', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Месяц: ${month}, Год: ${year}, Группа: ${group}`);
      doc.fontSize(12).text(`Примечание: ${note}`);
      doc.moveDown();

      const tableHeaders = ['Наименование пищевой продукции', 'Норма (г/мл)', 'Фактически', 'Отклонение (%)', 'Статус'];
      const columnWidths = [150, 80, 80, 80, 80];
      const startX = 50;
      let currentY = doc.y;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      rows.forEach((r: any) => {
        const rowData = [
          r.product || '',
          r.norm ? r.norm.toString() : '',
          r.actual ? r.actual.toString() : '',
          r.deviation ? r.deviation.toString() : '',
          r.status || '',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const csvHeader = ['Наименование пищевой продукции', 'Норма (г/мл)', 'Фактически', 'Отклонение (%)', 'Статус'];
      const metadata = [
        ['Ведомость контроля за выполнением норм пищевой продукции (Форма 4)'],
        [`Месяц: ${month}`, `Год: ${year}`, `Группа: ${group}`],
        [`Примечание: ${note}`],
        [],
      ];

      const csvRows = rows.map((r: any) =>
        [`"${r.product}"`, `"${r.norm}"`, `"${r.actual}"`, `"${r.deviation}"`, `"${r.status}"`].join(',')
      );

      const csvString = metadata.map(row => row.join(',')).join('\n') + '\n' + csvHeader.join(',') + '\n' + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="food_norms_control_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting food norms control:', error);
    res.status(500).send('Error exporting food norms control');
  }
});

router.post('/perishable-brak', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'nurse']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    const { rows } = filters;

    if (format === 'excel') {
      const data = rows.map((r: any) => ({
        date: r.date,
        product: r.product,
        assessment: r.assessment,
        expiry: r.expiry,
        notes: r.notes,
      }));

      const headers = [
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Продукт', key: 'product', width: 30 },
        { header: 'Оценка', key: 'assessment', width: 25 },
        { header: 'Срок годности', key: 'expiry', width: 15 },
        { header: 'Примечания', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Бракераж скоропортящихся');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="perishable_brak_${Date.now()}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="perishable_brak_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(16).text('Бракераж скоропортящейся продукции и полуфабрикатов', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Дата', 'Продукт', 'Оценка', 'Срок годности', 'Примечания'];
      const columnWidths = [80, 120, 100, 80, 150];
      const startX = 50;
      let currentY = doc.y;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      rows.forEach((r: any) => {
        const rowData = [
          r.date || '',
          r.product || '',
          r.assessment || '',
          r.expiry || '',
          r.notes || '',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const csvString = rows.map((r: any) =>
        [`"${r.date}"`, `"${r.product}"`, `"${r.assessment}"`, `"${r.expiry}"`, `"${r.notes}"`].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="perishable_brak_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting perishable brak:', error);
    res.status(500).send('Error exporting perishable brak');
  }
});

router.post('/product-certificate', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'nurse']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    const { rows } = filters;

    if (format === 'excel') {
      const data = rows.map((r: any) => ({
        date: r.date,
        product: r.product,
        certificateNumber: r.certificateNumber,
        issuedBy: r.issuedBy,
        expiry: r.expiry,
        notes: r.notes,
      }));

      const headers = [
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Продукт', key: 'product', width: 30 },
        { header: 'Номер сертификата', key: 'certificateNumber', width: 25 },
        { header: 'Кем выдан', key: 'issuedBy', width: 25 },
        { header: 'Срок годности', key: 'expiry', width: 15 },
        { header: 'Примечания', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Сертификаты продуктов');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="product_certificates_${Date.now()}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="product_certificates_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(16).text('Журнал регистрации сертификатов годности продуктов питания', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Дата', 'Продукт', 'Номер сертификата', 'Кем выдан', 'Срок годности', 'Примечания'];
      const columnWidths = [70, 100, 100, 80, 70, 120];
      const startX = 50;
      let currentY = doc.y;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      rows.forEach((r: any) => {
        const rowData = [
          r.date || '',
          r.product || '',
          r.certificateNumber || '',
          r.issuedBy || '',
          r.expiry || '',
          r.notes || '',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const csvString = rows.map((r: any) =>
        [`"${r.date}"`, `"${r.product}"`, `"${r.certificateNumber}"`, `"${r.issuedBy}"`, `"${r.expiry}"`, `"${r.notes}"`].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="product_certificates_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting product certificates:', error);
    res.status(500).send('Error exporting product certificates');
  }
});

router.post('/detergent-log', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'nurse']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    const { rows } = filters;

    if (format === 'excel') {
      const data = rows.map((r: any) => ({
        date: r.date,
        detergent: r.detergent,
        quantity: r.quantity,
        responsible: r.responsible,
        notes: r.notes,
      }));

      const headers = [
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Моющее средство', key: 'detergent', width: 30 },
        { header: 'Количество', key: 'quantity', width: 15 },
        { header: 'Ответственный', key: 'responsible', width: 25 },
        { header: 'Примечания', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Журнал учета моющих средств');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="detergent_log_${Date.now()}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="detergent_log_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(16).text('Журнал учета моющих средств', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Дата', 'Моющее средство', 'Количество', 'Ответственный', 'Примечания'];
      const columnWidths = [80, 120, 80, 100, 150];
      const startX = 50;
      let currentY = doc.y;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      rows.forEach((r: any) => {
        const rowData = [
          r.date || '',
          r.detergent || '',
          r.quantity ? r.quantity.toString() : '',
          r.responsible || '',
          r.notes || '',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const csvString = rows.map((r: any) =>
        [`"${r.date}"`, `"${r.detergent}"`, `"${r.quantity}"`, `"${r.responsible}"`, `"${r.notes}"`].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="detergent_log_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting detergent log:', error);
    res.status(500).send('Error exporting detergent log');
  }
});

router.post('/food-stock-log', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'nurse']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    const { rows } = filters;

    if (format === 'excel') {
      const data = rows.map((r: any) => ({
        date: r.date,
        product: r.product,
        quantity: r.quantity,
        unit: r.unit,
        responsible: r.responsible,
        notes: r.notes,
      }));

      const headers = [
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Продукт', key: 'product', width: 30 },
        { header: 'Количество', key: 'quantity', width: 15 },
        { header: 'Ед. изм.', key: 'unit', width: 15 },
        { header: 'Ответственный', key: 'responsible', width: 25 },
        { header: 'Примечания', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Журнал учета продуктов');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="food_stock_log_${Date.now()}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="food_stock_log_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(16).text('Журнал учета приходов, расходов и остатков ежедневных продуктов', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Дата', 'Продукт', 'Количество', 'Ед. изм.', 'Ответственный', 'Примечания'];
      const columnWidths = [70, 100, 80, 70, 100, 150];
      const startX = 50;
      let currentY = doc.y;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      rows.forEach((r: any) => {
        const rowData = [
          r.date || '',
          r.product || '',
          r.quantity ? r.quantity.toString() : '',
          r.unit || '',
          r.responsible || '',
          r.notes || '',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const csvString = rows.map((r: any) =>
        [`"${r.date}"`, `"${r.product}"`, `"${r.quantity}"`, `"${r.unit}"`, `"${r.responsible}"`, `"${r.notes}"`].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="food_stock_log_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting food stock log:', error);
    res.status(500).send('Error exporting food stock log');
  }
});

router.post('/food-staff-health', authMiddleware, authorizeRole(['admin', 'manager', 'teacher', 'nurse']), async (req: Request, res: Response) => {
  try {
    const { format, filters } = req.body;
    const { rows } = filters;

    if (format === 'excel') {
      const data = rows.map((r: any) => ({
        date: r.date,
        staffName: r.staffName,
        healthStatus: r.healthStatus,
        notes: r.notes,
      }));

      const headers = [
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'ФИО работника', key: 'staffName', width: 30 },
        { header: 'Состояние здоровья', key: 'healthStatus', width: 30 },
        { header: 'Примечания', key: 'notes', width: 40 },
      ];

      const buffer = await createExcelBuffer(headers, data, 'Журнал здоровья работников пищеблока');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="food_staff_health_${Date.now()}.xlsx"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="food_staff_health_${Date.now()}.pdf"`);

      doc.pipe(res);

      doc.fontSize(16).text('Журнал регистрации состояния здоровья работников пищеблока', { align: 'center' });
      doc.moveDown();

      const tableHeaders = ['Дата', 'ФИО работника', 'Состояние здоровья', 'Примечания'];
      const columnWidths = [80, 120, 120, 150];
      const startX = 50;
      let currentY = doc.y;


      doc.fontSize(10).font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
      });
      doc.moveDown();
      currentY = doc.y;


      doc.fontSize(10).font('Helvetica');
      rows.forEach((r: any) => {
        const rowData = [
          r.date || '',
          r.staffName || '',
          r.healthStatus || '',
          r.notes || '',
        ];
        rowData.forEach((data, i) => {
          doc.text(data, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
        });
        doc.moveDown();
        currentY = doc.y;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(10).font('Helvetica-Bold');
          tableHeaders.forEach((header, i) => {
            doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, { width: columnWidths[i], align: 'left' });
          });
          doc.moveDown();
          currentY = doc.y;
          doc.fontSize(10).font('Helvetica');
        }
      });

      doc.end();
    } else if (format === 'csv') {
      const csvString = rows.map((r: any) =>
        [`"${r.date}"`, `"${r.staffName}"`, `"${r.healthStatus}"`, `"${r.notes}"`].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="food_staff_health_${Date.now()}.csv"`);
      res.send(csvString);
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting food staff health:', error);
    res.status(500).send('Error exporting food staff health');
  }
});

export default router;
