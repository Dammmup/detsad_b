import express from 'express';
import Payroll from '../models/Payroll';
import { createObjectCsvStringifier } from 'csv-writer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/auth';

const router = express.Router();

// GET /payroll — список расчетных листов (с фильтрами)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Запрос получения расчетных листов:', req.query);
    const { staffId, month } = req.query;
    const user = (req as any).user;
    
    // Фильтр по умолчанию
    const filter: any = {};
    
    // Если пользователь не администратор, он может видеть только свои данные
    if (user.role !== 'admin') {
      filter.staffId = user._id;
    } else {
      // Администратор может фильтровать по staffId
      if (staffId) filter.staffId = staffId;
    }
    
    // Фильтр по месяцу
    if (month) filter.month = month;
    
    console.log('🔍 Фильтр для поиска расчетных листов:', filter);
    const data = await Payroll.find(filter).populate({ path: 'staffId', select: 'fullName role email', model: 'users' });
    console.log('🔍 Найдено расчетных листов:', data.length);
    
    res.json({ success: true, data });
  } catch (e) {
    console.error('❌ Ошибка получения расчетных листов:', e);
    res.status(500).json({ success: false, message: 'Ошибка получения расчетных листов', error: e });
  }
});

// POST /payroll — создать расчетный лист
router.post('/', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const payroll = new Payroll(req.body);
    await payroll.save();
    res.status(201).json({ success: true, data: payroll });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка создания расчетного листа', error: e });
  }
});

// PUT /payroll/:id — обновить расчетный лист
router.put('/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const updated = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка обновления расчетного листа', error: e });
  }
});

// DELETE /payroll/:id — удалить расчетный лист
router.delete('/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    await Payroll.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Ошибка удаления расчетного листа', error: e });
  }
});

// POST /payroll/export — экспорт отчета по зарплатам
router.post('/export', authMiddleware, async (req, res) => {
  try {
    const { format, startDate, endDate, staffId } = req.body;
    const user = (req as any).user;
    
    // Фильтрация данных
    const filter: any = {};
    
    // Если пользователь не администратор, он может экспортировать только свои данные
    if (user.role !== 'admin') {
      filter.staffId = user._id;
    } else {
      // Администратор может фильтровать по staffId
      if (staffId) filter.staffId = staffId;
    }
    
    if (startDate && endDate) {
      const startMonth = String(startDate).slice(0, 7);
      const endMonth = String(endDate).slice(0, 7);
      filter.month = { $gte: startMonth, $lte: endMonth };
    }
    
    // Получение данных
    const payrolls = await Payroll.find(filter).populate({ path: 'staffId', select: 'fullName role email', model: 'users' });
    
    if (format === 'csv') {
      // Экспорт в CSV
      const csvWriter = createObjectCsvStringifier({
        header: [
          { id: 'staffName', title: 'Сотрудник' },
          { id: 'month', title: 'Месяц' },
          { id: 'accruals', title: 'Начисления' },
          { id: 'penalties', title: 'Штрафы' },
          { id: 'total', title: 'Итого' }
        ]
      });
      
      const records = payrolls.map(payroll => ({
        staffName: (payroll.staffId as any)?.fullName || 'Неизвестно',
        month: payroll.month,
        accruals: payroll.accruals,
        bonuses: payroll.bonuses,
        penalties: payroll.penalties,
        total: payroll.total
      }));
      
      const csvContent = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('salary_report.csv');
      return res.send(csvContent);
    } else if (format === 'excel') {
      // Экспорт в Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Отчет по зарплатам');
      
      // Заголовки
      worksheet.columns = [
        { header: 'Сотрудник', key: 'staffName', width: 30 },
        { header: 'Месяц', key: 'month', width: 15 },
        { header: 'Начисления', key: 'accruals', width: 15 },
        { header: 'Штрафы', key: 'penalties', width: 15 },
        { header: 'Итого', key: 'total', width: 15 }
      ];
      
      // Данные
      payrolls.forEach(payroll => {
        worksheet.addRow({
          staffName: (payroll.staffId as any)?.fullName || 'Неизвестно',
          month: payroll.month,
          accruals: payroll.accruals,
          bonuses: payroll.bonuses,
          penalties: payroll.penalties,
          total: payroll.total
        });
      });
      
      // Создание временного файла
      const tempFilePath = path.join(__dirname, `../temp/salary_report_${Date.now()}.xlsx`);
      
      // Создаем директорию если она не существует
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      await workbook.xlsx.writeFile(tempFilePath);
      
      // Отправка файла
      res.download(tempFilePath, 'salary_report.xlsx', (err) => {
        // Удаление временного файла после отправки
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        
        if (err) {
          console.error('Error sending file:', err);
        }
      });
    } else {
      // По умолчанию возвращаем JSON
      res.json({ success: true, data: payrolls });
    }
  } catch (e) {
    console.error('Error exporting payroll report:', e);
    res.status(500).json({ success: false, message: 'Ошибка экспорта отчета по зарплатам', error: e });
  }
});

export default router;
