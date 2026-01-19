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
    } else {
      res.status(400).send('Invalid format');
    }
  } catch (error) {
    console.error('Error exporting food staff health:', error);
    res.status(500).send('Error exporting food staff health');
  }
});

export default router;
