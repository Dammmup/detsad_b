import { Request, Response } from 'express';
import { ReportsService } from './service';
import { PayrollService } from '../payroll/service';
import Child from '../children/model';
import { IChild } from '../children/model';
import ChildAttendance from '../childAttendance/model';
import { IChildAttendance } from '../childAttendance/model';
import Group from '../groups/model';
import { IGroup } from '../groups/model';
import User from '../users/model';
import { IUser } from '../users/model';
import { AuthUser } from '../../middlewares/authMiddleware';

// Расширяем интерфейс Request для добавления свойства user
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// Импортируем библиотеки для генерации файлов
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { createObjectCsvWriter } from 'csv-writer';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';

const reportsService = new ReportsService();
const payrollService = new PayrollService();

export const getAllReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { type, status, generatedById } = req.query;
    
    const reports = await reportsService.getAll({
      type: type as string,
      status: status as string,
      generatedById: generatedById as string
    });
    
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Ошибка получения отчетов' });
  }
};

export const getReportById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const report = await reportsService.getById(req.params.id);
    res.json(report);
  } catch (err: any) {
    console.error('Error fetching report:', err);
    res.status(404).json({ error: err.message || 'Отчет не найден' });
 }
};

export const createReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Добавляем автора из аутентифицированного пользователя
    const reportData = {
      ...req.body,
      generatedBy: req.user.id
    };
    
    const report = await reportsService.create(reportData);
    res.status(201).json(report);
  } catch (err: any) {
    console.error('Error creating report:', err);
    res.status(400).json({ error: err.message || 'Ошибка создания отчета' });
  }
};

export const updateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const report = await reportsService.update(req.params.id, req.body);
    res.json(report);
  } catch (err: any) {
    console.error('Error updating report:', err);
    res.status(404).json({ error: err.message || 'Ошибка обновления отчета' });
 }
};

export const deleteReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await reportsService.delete(req.params.id);
    res.json(result);
  } catch (err: any) {
    console.error('Error deleting report:', err);
    res.status(404).json({ error: err.message || 'Ошибка удаления отчета' });
  }
};

export const generateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { data, filters } = req.body;
    
    const report = await reportsService.generateReport(req.params.id, data, filters);
    res.json(report);
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(404).json({ error: err.message || 'Ошибка генерации отчета' });
  }
};

export const sendReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { recipients } = req.body;
    
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Не указаны получатели' });
    }
    
    const report = await reportsService.sendReport(req.params.id, recipients);
    res.json(report);
  } catch (err: any) {
    console.error('Error sending report:', err);
    res.status(404).json({ error: err.message || 'Ошибка отправки отчета' });
  }
};

export const getReportsByType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { type } = req.params;
    const { generatedById } = req.query;
    
    const reports = await reportsService.getReportsByType(type, generatedById as string);
    res.json(reports);
  } catch (err: any) {
    console.error('Error fetching reports by type:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения отчетов по типу' });
  }
};

export const getRecentReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 10;
    
    const reports = await reportsService.getRecentReports(limitNum);
    res.json(reports);
  } catch (err: any) {
    console.error('Error fetching recent reports:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения последних отчетов' });
  }
};

// Контроллер для получения сводки по зарплатам
export const getSalarySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { month, startDate, endDate, userId } = req.query;
    
    // Проверяем наличие параметра month или диапазона дат
    if (!month && (!startDate || !endDate)) {
      return res.status(400).json({ error: 'Не указан параметр month или диапазон дат (startDate и endDate)' });
    }
    
    // Проверяем права доступа
    // Пользователь может просматривать только свою информацию, если у него нет роли admin или manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Если запрашивается информация о другом пользователе, возвращаем ошибку
      if (userId && userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access other user\'s salary data' });
      }
      // Ограничиваем доступ к данным только для текущего пользователя
      if (month) {
        // Для месяца - получаем сводку для текущего пользователя
        const summary = await reportsService.getSalarySummary(month as string, req.user.id as string);
        res.json(summary);
      } else {
        // Для диапазона дат - получаем сводку для текущего пользователя
        const summary = await reportsService.getSalarySummaryByDateRange(startDate as string, endDate as string, req.user.id as string);
        res.json(summary);
      }
    } else {
      // Для администраторов и менеджеров - доступ ко всем данным
      let summary;
      if (month) {
        // Если указан month, используем его
        summary = await reportsService.getSalarySummary(month as string, userId as string);
      } else {
        // Если указан диапазон дат, используем его
        summary = await reportsService.getSalarySummaryByDateRange(startDate as string, endDate as string, userId as string);
      }
      
      res.json(summary);
    }
  } catch (err: any) {
    console.error('Error fetching salary summary:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения сводки по зарплатам' });
 }
};

// Контроллер для экспорта отчета по зарплатам
export const exportSalaryReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { startDate, endDate, userId, format, includeDeductions, includeBonus } = req.body;
    
    // Проверяем, что формат указан и поддерживается
    if (!format || !['pdf', 'excel', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Неподдерживаемый формат. Поддерживаются: pdf, excel, csv' });
    }
    
    // В реальном приложении здесь будет логика генерации отчета по зарплатам
    // Включая получение данных из соответствующих коллекций
    const payrollData = await payrollService.getAllWithUsers({
      staffId: userId || undefined,
      period: startDate ? `${new Date(startDate).getFullYear()}-${String(new Date(startDate).getMonth() + 1).padStart(2, '0')}` : undefined,
      status: undefined
    });
    
    // Фильтруем данные по диапазону дат, если они предоставлены
    let filteredData = payrollData;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredData = payrollData.filter(item => {
        const itemDate = new Date(item.period ? item.period : item.createdAt);
        return itemDate >= start && itemDate <= end;
      });
    }
    
    // Формируем данные для отчета
    const reportData = {
      startDate,
      endDate,
      period: `${new Date(startDate).toLocaleDateString('ru-RU')} - ${new Date(endDate).toLocaleDateString('ru-RU')}`,
      data: filteredData.map(item => ({
        staffName: item.staffId && (item.staffId.fullName || item.staffId.name) || 'Неизвестный сотрудник',
        baseSalary: item.baseSalary || 0,
        bonuses: item.bonuses || 0,
        penalties: item.penalties || 0,
        total: item.total || 0,
        status: item.status || 'N/A',
        period: item.period || 'N/A'
      })),
      summary: {
        totalEmployees: filteredData.length,
        totalBaseSalary: filteredData.reduce((sum, item) => sum + (item.baseSalary || 0), 0),
        totalBonuses: filteredData.reduce((sum, item) => sum + (item.bonuses || 0), 0),
        totalPenalties: filteredData.reduce((sum, item) => sum + (item.penalties || 0), 0),
        totalPayout: filteredData.reduce((sum, item) => sum + (item.total || 0), 0)
      }
    };
    
    // В зависимости от формата, генерируем соответствующий тип файла
    switch (format) {
      case 'pdf':
        // Генерация PDF с использованием pdfkit
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });
        
        // Устанавливаем заголовки ответа
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=salary_report_${startDate}_${endDate}.pdf`);
        
        // Передаем PDF документ в поток ответа
        doc.pipe(res);
        
        // Добавляем заголовок
        doc.fontSize(20).text('Отчет по зарплатам', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Период: ${reportData.period}`, { align: 'center' });
        doc.moveDown(2);
        
        // Добавляем сводку
        doc.fontSize(16).text('Сводка:');
        doc.moveDown();
        doc.fontSize(12).text(`- Всего сотрудников: ${reportData.summary.totalEmployees}`);
        doc.text(`- Общий оклад: ${reportData.summary.totalBaseSalary} тг`);
        doc.text(`- Общие премии: ${reportData.summary.totalBonuses} тг`);
        doc.text(`- Общие штрафы: ${reportData.summary.totalPenalties} тг`);
        doc.text(`- Общая выплата: ${reportData.summary.totalPayout} тг`);
        doc.moveDown(2);
        
        // Добавляем таблицу с данными
        doc.fontSize(16).text('Детали:');
        doc.moveDown();
        
        // Заголовки таблицы
        const tableTop = doc.y;
        const rowHeight = 20;
        const colWidths = [150, 80, 60, 80];
        
        // Рисуем заголовки таблицы
        doc.fontSize(10).text('Сотрудник', 50, tableTop);
        doc.text('Оклад', 50 + colWidths[0], tableTop);
        doc.text('Премии', 50 + colWidths[0] + colWidths[1], tableTop);
        doc.text('Штрафы', 50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.text('Итого', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
        doc.text('Статус', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop);
        doc.text('Период', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], tableTop);
        
        // Рисуем горизонтальную линию под заголовками
        doc.moveTo(50, tableTop + 15).lineTo(50 + colWidths.reduce((a, b) => a + b, 0), tableTop + 15).stroke();
        
        // Добавляем строки данных
        let yPosition = tableTop + rowHeight;
        reportData.data.forEach((row: any) => {
          doc.fontSize(8).text(row.staffName, 50, yPosition);
          doc.text(row.baseSalary.toString(), 50 + colWidths[0], yPosition);
          doc.text(row.bonuses.toString(), 50 + colWidths[0] + colWidths[1], yPosition);
          doc.text(row.penalties.toString(), 50 + colWidths[0] + colWidths[1] + colWidths[2], yPosition);
          doc.text(row.total.toString(), 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPosition);
          doc.text(row.status, 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], yPosition);
          doc.text(row.period, 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], yPosition);
          
          yPosition += rowHeight;
          
          // Если достигли конца страницы, добавляем новую страницу
          if (yPosition > 750) {
            doc.addPage();
            yPosition = 50;
          }
        });
        
        // Завершаем документ
        doc.end();
        break;
      case 'excel':
        // Генерация Excel файла с использованием xlsx
        const wb = XLSX.utils.book_new();
        
        // Создаем лист со сводкой
        const summaryWs = XLSX.utils.aoa_to_sheet([
          ['Сводка по зарплатам'],
          [`Период: ${reportData.period}`],
          [],
          ['Показатель', 'Значение'],
          ['Всего сотрудников', reportData.summary.totalEmployees],
          ['Общий оклад', reportData.summary.totalBaseSalary],
          ['Общие премии', reportData.summary.totalBonuses],
          ['Общие штрафы', reportData.summary.totalPenalties],
          ['Общая выплата', reportData.summary.totalPayout]
        ]);
        
        // Добавляем лист со сводкой в книгу
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Сводка');
        
        // Создаем лист с деталями
        const detailsData = [
          ['Сотрудник', 'Оклад', 'Премии', 'Штрафы', 'Итого', 'Статус', 'Период'],
          ...reportData.data.map((row: any) => [
            row.staffName,
            row.baseSalary,
            row.bonuses,
            row.penalties,
            row.total,
            row.status,
            row.period
          ])
        ];
        
        const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
        
        // Добавляем лист с деталями в книгу
        XLSX.utils.book_append_sheet(wb, detailsWs, 'Детали');
        
        // Устанавливаем заголовки ответа
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=salary_report_${startDate}_${endDate}.xlsx`);
        
        // Преобразуем книгу в бинарный формат и отправляем
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buf);
        break;
      case 'csv':
        // Генерируем CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=salary_report_${startDate}_${endDate}.csv`);
        
        // Формируем CSV содержимое
        const csvHeader = 'Сотрудник,Оклад,Премии,Штрафы,Итого,Статус,Период\n';
        const csvContent = reportData.data.map((row: any) =>
          `"${row.staffName}",${row.baseSalary},${row.bonuses},${row.penalties},${row.total},"${row.status}","${row.period}"`
        ).join('\n');
        
        res.send(csvHeader + csvContent);
        break;
      default:
        res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
  } catch (err: any) {
    console.error('Error exporting salary report:', err);
    res.status(500).json({ error: err.message || 'Ошибка экспорта отчета по зарплатам' });
 }
};
  
// Контроллер для получения сводки по детям
export const getChildrenSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Проверяем права доступа
    // Пользователь может получать сводку только по своей группе, если он не администратор
    let { groupId } = req.query;
    
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Для воспитателей и помощников разрешаем доступ только к своей группе
      if (req.user.role === 'teacher' || req.user.role === 'assistant') {
        // Если не указана группа, используем группу пользователя
        if (!groupId && req.user.groupId) {
          groupId = req.user.groupId as string;
        }
        // Если указана другая группа, возвращаем ошибку
        else if (groupId && groupId !== req.user.groupId) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access other group\'s data' });
        }
      } else {
        // Для других ролей ограничиваем доступ
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access children summary' });
      }
    }
    
    const summary = await reportsService.getChildrenSummary(groupId as string);
    res.json(summary);
 } catch (err: any) {
    console.error('Error fetching children summary:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения сводки по детям' });
 }
};

// Контроллер для получения сводки по посещаемости
export const getAttendanceSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    let { startDate, endDate, groupId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать startDate и endDate' });
    }
    
    // Проверяем права доступа
    // Пользователь может получать сводку только по своей группе, если он не администратор
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Для воспитателей и помощников разрешаем доступ только к своей группе
      if (req.user.role === 'teacher' || req.user.role === 'assistant') {
        // Если не указана группа, используем группу пользователя
        if (!groupId && req.user.groupId) {
          groupId = req.user.groupId as string;
        }
        // Если указана другая группа, возвращаем ошибку
        else if (groupId && groupId !== req.user.groupId) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access other group\'s attendance data' });
        }
      } else {
        // Для других ролей ограничиваем доступ
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to access attendance summary' });
      }
    }
    
    const summary = await reportsService.getAttendanceSummary(startDate as string, endDate as string, groupId as string);
    res.json(summary);
  } catch (err: any) {
    console.error('Error fetching attendance summary:', err);
    res.status(500).json({ error: err.message || 'Ошибка получения сводки посещаемости' });
  }
};

// Контроллер для экспорта отчета по детям
export const exportChildrenReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { groupId, format, includeParentInfo, includeHealthInfo } = req.body;
    
    // Проверяем, что формат указан и поддерживается
    if (!format || !['pdf', 'excel', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Неподдерживаемый формат. Поддерживаются: pdf, excel, csv' });
    }
    
    // Формируем фильтр для поиска детей
    const filter: any = { active: true };
    if (groupId) {
      filter.groupId = groupId;
    }
    
    // Получаем детей с группами
    const children = await Child.find(filter)
      .populate('groupId', 'name description')
      .select('fullName birthday parentName parentPhone gender clinic bloodGroup rhesus allergy dispensary diagnosis');
    
    // Формируем данные для отчета
    const reportData = {
      data: children.map(child => ({
        fullName: child.fullName,
        birthday: child.birthday ? new Date(child.birthday).toLocaleDateString('ru-RU') : 'Не указан',
        age: child.birthday ? Math.floor((Date.now() - new Date(child.birthday).getTime()) / (365.25 * 24 * 60 * 1000)) : 'Не указан',
        group: child.groupId ? (child.groupId as any).name : 'Не указана',
        parentName: includeParentInfo ? child.parentName || 'Не указан' : undefined,
        parentPhone: includeParentInfo ? child.parentPhone || 'Не указан' : undefined,
        gender: includeHealthInfo ? child.gender || 'Не указан' : undefined,
        clinic: includeHealthInfo ? child.clinic || 'Не указан' : undefined,
        bloodGroup: includeHealthInfo ? child.bloodGroup || 'Не указана' : undefined,
        allergy: includeHealthInfo ? child.allergy || 'Не указаны' : undefined,
        dispensary: includeHealthInfo ? child.dispensary || 'Не указан' : undefined,
        diagnosis: includeHealthInfo ? child.diagnosis || 'Не указан' : undefined
      })),
      summary: {
        totalChildren: children.length,
        groups: [...new Set(children.map(child => child.groupId ? (child.groupId as any).name : 'Не указана'))].length
      }
    };
    
    // В зависимости от формата, генерируем соответствующий тип файла
    switch (format) {
      case 'pdf':
        // Генерация PDF с использованием pdfkit
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });
        
        // Устанавливаем заголовки ответа
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=children_report_${new Date().toISOString().split('T')[0]}.pdf`);
        
        // Передаем PDF документ в поток ответа
        doc.pipe(res);
        
        // Добавляем заголовок
        doc.fontSize(20).text('Отчет по детям', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
        doc.moveDown(2);
        
        // Добавляем сводку
        doc.fontSize(16).text('Сводка:');
        doc.moveDown();
        doc.fontSize(12).text(`- Всего детей: ${reportData.summary.totalChildren}`);
        doc.text(`- Всего групп: ${reportData.summary.groups}`);
        doc.moveDown(2);
        
        // Добавляем таблицу с данными
        doc.fontSize(16).text('Дети:');
        doc.moveDown();
        
        // Заголовки таблицы
        const tableTop = doc.y;
        const rowHeight = 20;
        const colWidths = [150, 80, 60, 80];
        
        // Рисуем заголовки таблицы
        doc.fontSize(10).text('ФИО ребенка', 50, tableTop);
        doc.text('Возраст', 50 + colWidths[0], tableTop);
        doc.text('Группа', 50 + colWidths[0] + colWidths[1], tableTop);
        if (includeParentInfo) {
          doc.text('ФИО родителя', 50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
          doc.text('Телефон родителя', 50 + colWidths[0] + colWidths[1] + colWidths[2] + 150, tableTop);
        }
        if (includeHealthInfo) {
          doc.text('Пол', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0), tableTop);
          doc.text('Клиника', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 60, tableTop);
          doc.text('Группа крови', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 120, tableTop);
          doc.text('Резус', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 180, tableTop);
          doc.text('Аллергии', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 240, tableTop);
          doc.text('Диспансер', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 300, tableTop);
          doc.text('Диагноз', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 360, tableTop);
        }
        
        // Рисуем горизонтальную линию под заголовками
        doc.moveTo(50, tableTop + 15).lineTo(50 + colWidths.reduce((a, b) => a + b, 0) + (includeParentInfo ? 300 : 0) + (includeHealthInfo ? 420 : 0), tableTop + 15).stroke();
        
        // Добавляем строки данных
        let yPosition = tableTop + rowHeight;
        reportData.data.forEach((child: any) => {
          doc.fontSize(8).text(child.fullName, 50, yPosition);
          doc.text(child.age.toString(), 50 + colWidths[0], yPosition);
          doc.text(child.group, 50 + colWidths[0] + colWidths[1], yPosition);
          if (includeParentInfo) {
            doc.text(child.parentName || 'Не указан', 50 + colWidths[0] + colWidths[1] + colWidths[2], yPosition);
            doc.text(child.parentPhone || 'Не указан', 50 + colWidths[0] + colWidths[1] + colWidths[2] + 150, yPosition);
          }
          if (includeHealthInfo) {
            doc.text(child.gender || 'Не указан', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0), yPosition);
            doc.text(child.clinic || 'Не указана', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 60, yPosition);
            doc.text(child.bloodGroup || 'Не указана', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 120, yPosition);
            doc.text((child as any).rhesus || 'Не указан', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 180, yPosition);
            doc.text(child.allergy || 'Не указаны', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 240, yPosition);
            doc.text(child.dispensary || 'Не указан', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 300, yPosition);
            doc.text(child.diagnosis || 'Не указан', 50 + colWidths[0] + colWidths[1] + colWidths[2] + (includeParentInfo ? 300 : 0) + 360, yPosition);
          }
          
          yPosition += rowHeight;
          
          // Если достигли конца страницы, добавляем новую страницу
          if (yPosition > 750) {
            doc.addPage();
            yPosition = 50;
          }
        });
        
        // Завершаем документ
        doc.end();
        break;
      case 'excel':
        // Генерация Excel файла с использованием xlsx
        const wb = XLSX.utils.book_new();
        
        // Создаем лист со сводкой
        const summaryWs = XLSX.utils.aoa_to_sheet([
          ['Сводка по детям'],
          [`Дата: ${new Date().toLocaleDateString('ru-RU')}`],
          [],
          ['Показатель', 'Значение'],
          ['Всего детей', reportData.summary.totalChildren],
          ['Всего групп', reportData.summary.groups]
        ]);
        
        // Добавляем лист со сводкой в книгу
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Сводка');
        
        // Создаем лист с деталями
        const headers = ['ФИО ребенка', 'Возраст', 'Группа'];
        if (includeParentInfo) {
          headers.push('ФИО родителя', 'Телефон родителя');
        }
        if (includeHealthInfo) {
          headers.push('Пол', 'Клиника', 'Группа крови', 'Резус', 'Аллергии', 'Диспансер', 'Диагноз');
        }
        
        const detailsData = [
          headers,
          ...reportData.data.map((child: any) => {
            const row = [child.fullName, child.age, child.group];
            if (includeParentInfo) {
              row.push(child.parentName || 'Не указан', child.parentPhone || 'Не указан');
            }
            if (includeHealthInfo) {
              row.push(
                child.gender || 'Не указан',
                child.clinic || 'Не указана',
                child.bloodGroup || 'Не указана',
                (child as any).rhesus || 'Не указан',
                child.allergy || 'Не указаны',
                child.dispensary || 'Не указан',
                child.diagnosis || 'Не указан'
              );
            }
            return row;
          })
        ];
        
        const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
        
        // Добавляем лист с деталями в книгу
        XLSX.utils.book_append_sheet(wb, detailsWs, 'Дети');
        
        // Устанавливаем заголовки ответа
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=children_report_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        // Преобразуем книгу в бинарный формат и отправляем
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buf);
        break;
      case 'csv':
        // Генерируем CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=children_report_${new Date().toISOString().split('T')[0]}.csv`);
        
        // Формируем CSV заголовки в зависимости от опций
        let csvHeader = 'ФИО ребенка,Возраст,Группа';
        if (includeParentInfo) {
          csvHeader += ',ФИО родителя,Телефон родителя';
        }
        if (includeHealthInfo) {
          csvHeader += ',Пол,Клиника,Группа крови,Резус,Аллергии,Диспансер,Диагноз';
        }
        csvHeader += '\n';
        
        // Формируем CSV содержимое
        const csvContent = reportData.data.map((child: any) => {
          let row = `"${child.fullName}",${child.age},"${child.group}"`;
          if (includeParentInfo) {
            row += `,"${child.parentName || 'Не указан'}","${child.parentPhone || 'Не указан'}"`;
          }
          if (includeHealthInfo) {
            row += `,"${child.gender || 'Не указан'}","${child.clinic || 'Не указана'}","${child.bloodGroup || 'Не указана'}","${(child as any).rhesus || 'Не указан'}","${child.allergy || 'Не указаны'}","${child.dispensary || 'Не указан'}","${child.diagnosis || 'Не указан'}"`;
          }
          return row;
        }).join('\n');
        
        res.send(csvHeader + csvContent);
        break;
      default:
        res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
  } catch (err: any) {
    console.error('Error exporting children report:', err);
    res.status(500).json({ error: err.message || 'Ошибка экспорта отчета по детям' });
  }
};

// Контроллер для экспорта отчета по посещаемости
export const exportAttendanceReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { startDate, endDate, userId, groupId, format, includeStatistics, includeCharts } = req.body;
    
    // Проверяем, что формат указан и поддерживается
    if (!format || !['pdf', 'excel', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Неподдерживаемый формат. Поддерживаются: pdf, excel, csv' });
    }
    
    // Проверяем наличие дат
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Необходимо указать startDate и endDate' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Формируем фильтр для посещаемости
    const filter: any = {
      date: { $gte: start, $lte: end }
    };
    
    if (groupId) {
      filter.groupId = groupId;
    }
    
    // Получаем посещаемость
    const attendanceRecords = await ChildAttendance.find(filter)
      .populate('childId', 'fullName')
      .populate('groupId', 'name');
    
    // Группируем посещаемость по детям
    const attendanceByChild: { [key: string]: IChildAttendance[] } = {};
    attendanceRecords.forEach(record => {
      const childId = (record.childId as any)._id.toString();
      if (!attendanceByChild[childId]) {
        attendanceByChild[childId] = [];
      }
      attendanceByChild[childId].push(record);
    });
    
    // Получаем информацию о детях
    const childIds = [...new Set(attendanceRecords.map(record =>
      (record.childId as any)._id.toString()
    ))];
    const children = await Child.find({ _id: { $in: childIds } })
      .populate('groupId', 'name');
    
    // Рассчитываем статистику посещаемости
    const attendanceStats = children.map(child => {
      const childAttendance = attendanceByChild[(child._id as any).toString()] || [];
      const totalDays = childAttendance.length;
      const presentDays = childAttendance.filter(record => record.status === 'present').length;
      const absentDays = childAttendance.filter(record => record.status === 'absent').length;
      const lateDays = childAttendance.filter(record => record.status === 'late').length;
      const sickDays = childAttendance.filter(record => record.status === 'sick').length;
      
      return {
        childId: child._id,
        fullName: child.fullName,
        group: (child.groupId as any)?.name || 'Не указана',
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        sickDays,
        attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
      };
    });
    
    // Формируем данные для отчета
    const reportData = {
      startDate: new Date(startDate).toLocaleDateString('ru-RU'),
      endDate: new Date(endDate).toLocaleDateString('ru-RU'),
      data: attendanceStats,
      summary: {
        totalChildren: attendanceStats.length,
        totalAttendanceRecords: attendanceRecords.length,
        averageAttendanceRate: attendanceStats.length > 0
          ? Math.round(attendanceStats.reduce((sum, stat) => sum + stat.attendanceRate, 0) / attendanceStats.length)
          : 0,
        presentCount: attendanceRecords.filter(r => r.status === 'present').length,
        absentCount: attendanceRecords.filter(r => r.status === 'absent').length,
        lateCount: attendanceRecords.filter(r => r.status === 'late').length,
        sickCount: attendanceRecords.filter(r => r.status === 'sick').length
      }
    };
    
    // В зависимости от формата, генерируем соответствующий тип файла
    switch (format) {
      case 'pdf':
        // Генерация PDF с использованием pdfkit
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });
        
        // Устанавливаем заголовки ответа
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${startDate}_${endDate}.pdf`);
        
        // Передаем PDF документ в поток ответа
        doc.pipe(res);
        
        // Добавляем заголовок
        doc.fontSize(20).text('Отчет по посещаемости', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Период: ${reportData.startDate} - ${reportData.endDate}`, { align: 'center' });
        doc.moveDown(2);
        
        // Добавляем сводку
        doc.fontSize(16).text('Сводка:');
        doc.moveDown();
        doc.fontSize(12).text(`- Всего детей: ${reportData.summary.totalChildren}`);
        doc.text(`- Средняя посещаемость: ${reportData.summary.averageAttendanceRate}%`);
        doc.text(`- Присутствий: ${reportData.summary.presentCount}`);
        doc.text(`- Отсутствий: ${reportData.summary.absentCount}`);
        doc.text(`- Опозданий: ${reportData.summary.lateCount}`);
        doc.text(`- Болезней: ${reportData.summary.sickCount}`);
        doc.moveDown(2);
        
        // Добавляем таблицу с данными
        doc.fontSize(16).text('Детали:');
        doc.moveDown();
        
        // Заголовки таблицы
        const tableTop = doc.y;
        const rowHeight = 20;
        const colWidths = [150, 80, 60, 80];
        
        // Рисуем заголовки таблицы
        doc.fontSize(10).text('ФИО ребенка', 50, tableTop);
        doc.text('Группа', 50 + colWidths[0], tableTop);
        doc.text('Всего дней', 50 + colWidths[0] + colWidths[1], tableTop);
        doc.text('Присутствий', 50 + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.text('Отсутствий', 50 + colWidths[0] + colWidths[1] + colWidths[2] + 80, tableTop);
        doc.text('Опозданий', 50 + colWidths[0] + colWidths[1] + colWidths[2] + 160, tableTop);
        doc.text('Болезней', 50 + colWidths[0] + colWidths[1] + colWidths[2] + 240, tableTop);
        doc.text('Процент посещаемости', 50 + colWidths[0] + colWidths[1] + colWidths[2] + 320, tableTop);
        
        // Рисуем горизонтальную линию под заголовками
        doc.moveTo(50, tableTop + 15).lineTo(50 + colWidths.reduce((a, b) => a + b, 0) + 320, tableTop + 15).stroke();
        
        // Добавляем строки данных
        let yPosition = tableTop + rowHeight;
        reportData.data.forEach((stat: any) => {
          doc.fontSize(8).text(stat.fullName, 50, yPosition);
          doc.text(stat.group, 50 + colWidths[0], yPosition);
          doc.text(stat.totalDays.toString(), 50 + colWidths[0] + colWidths[1], yPosition);
          doc.text(stat.presentDays.toString(), 50 + colWidths[0] + colWidths[1] + colWidths[2], yPosition);
          doc.text(stat.absentDays.toString(), 50 + colWidths[0] + colWidths[1] + colWidths[2] + 80, yPosition);
          doc.text(stat.lateDays.toString(), 50 + colWidths[0] + colWidths[1] + colWidths[2] + 160, yPosition);
          doc.text(stat.sickDays.toString(), 50 + colWidths[0] + colWidths[1] + colWidths[2] + 240, yPosition);
          doc.text(`${stat.attendanceRate}%`, 50 + colWidths[0] + colWidths[1] + colWidths[2] + 320, yPosition);
          
          yPosition += rowHeight;
          
          // Если достигли конца страницы, добавляем новую страницу
          if (yPosition > 750) {
            doc.addPage();
            yPosition = 50;
          }
        });
        
        // Завершаем документ
        doc.end();
        break;
      case 'excel':
        // Генерация Excel файла с использованием xlsx
        const wb = XLSX.utils.book_new();
        
        // Создаем лист со сводкой
        const summaryWs = XLSX.utils.aoa_to_sheet([
          ['Сводка по посещаемости'],
          [`Период: ${reportData.startDate} - ${reportData.endDate}`],
          [],
          ['Показатель', 'Значение'],
          ['Всего детей', reportData.summary.totalChildren],
          ['Средняя посещаемость', `${reportData.summary.averageAttendanceRate}%`],
          ['Присутствий', reportData.summary.presentCount],
          ['Отсутствий', reportData.summary.absentCount],
          ['Опозданий', reportData.summary.lateCount],
          ['Болезней', reportData.summary.sickCount]
        ]);
        
        // Добавляем лист со сводкой в книгу
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Сводка');
        
        // Создаем лист с деталями
        const detailsData = [
          ['ФИО ребенка', 'Группа', 'Всего дней', 'Присутствий', 'Отсутствий', 'Опозданий', 'Болезней', 'Процент посещаемости'],
          ...reportData.data.map((stat: any) => [
            stat.fullName,
            stat.group,
            stat.totalDays,
            stat.presentDays,
            stat.absentDays,
            stat.lateDays,
            stat.sickDays,
            `${stat.attendanceRate}%`
          ])
        ];
        
        const detailsWs = XLSX.utils.aoa_to_sheet(detailsData);
        
        // Добавляем лист с деталями в книгу
        XLSX.utils.book_append_sheet(wb, detailsWs, 'Детали');
        
        // Устанавливаем заголовки ответа
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${startDate}_${endDate}.xlsx`);
        
        // Преобразуем книгу в бинарный формат и отправляем
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buf);
        break;
      case 'csv':
        // Генерируем CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${startDate}_${endDate}.csv`);
        
        // Формируем CSV заголовки
        const csvHeader = 'ФИО ребенка,Группа,Всего дней,Присутствий,Отсутствий,Опозданий,Болезней,Процент посещаемости\n';
        
        // Формируем CSV содержимое
        const csvContent = reportData.data.map((stat: any) =>
          `"${stat.fullName}","${stat.group}",${stat.totalDays},${stat.presentDays},${stat.absentDays},${stat.lateDays},${stat.sickDays},${stat.attendanceRate}%`
        ).join('\n');
        
        res.send(csvHeader + csvContent);
        break;
      default:
        res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
  } catch (err: any) {
    console.error('Error exporting attendance report:', err);
    res.status(500).json({ error: err.message || 'Ошибка экспорта отчета по посещаемости' });
  }
};