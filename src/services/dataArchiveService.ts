import ExcelJS from 'exceljs';
import ChildAttendance from '../entities/childAttendance/model';
import ChildPayment from '../entities/childPayment/model';
import StaffAttendanceTracking from '../entities/staffAttendanceTracking/model';
import StaffShift from '../entities/staffShifts/model';
import Payroll from '../entities/payroll/model';
import EmailService from './emailService';
import { SettingsService } from '../entities/settings/service';
import { sendLogToTelegram } from '../utils/telegramLogger';

const emailService = new EmailService();
const settingsService = new SettingsService();

/**
 * Возвращает дату 3 месяца назад от сегодня
 */
export const getArchiveDate = (): Date => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    date.setHours(0, 0, 0, 0);
    return date;
};

/**
 * Получает период 3 месяца назад в формате YYYY-MM
 */
export const getArchivePeriod = (): string => {
    const date = getArchiveDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

interface CollectionExportResult {
    name: string;
    count: number;
    excelBuffer: Buffer;
    jsonData: string;
}

/**
 * Экспортирует записи посещаемости детей старше 3 месяцев
 */
async function exportChildAttendance(): Promise<CollectionExportResult> {
    const archiveDate = getArchiveDate();

    const records = await ChildAttendance.find({
        date: { $lt: archiveDate }
    }).populate('childId', 'fullName').populate('groupId', 'name');

    const data = records.map((r: any) => ({
        childName: r.childId?.fullName || 'Неизвестно',
        groupName: r.groupId?.name || '-',
        date: new Date(r.date).toLocaleDateString('ru-RU'),
        status: r.status,
        notes: r.notes || '-'
    }));

    // Создаём Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Посещаемость детей');

    worksheet.columns = [
        { header: 'Ребёнок', key: 'childName', width: 30 },
        { header: 'Группа', key: 'groupName', width: 20 },
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Заметки', key: 'notes', width: 40 }
    ];

    data.forEach(row => worksheet.addRow(row));

    const excelBuffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const jsonData = JSON.stringify(data, null, 2);

    return {
        name: 'childAttendance',
        count: records.length,
        excelBuffer,
        jsonData
    };
}

/**
 * Экспортирует оплаты детей старше 3 месяцев
 */
async function exportChildPayments(): Promise<CollectionExportResult> {
    const archiveDate = getArchiveDate();

    const records = await ChildPayment.find({
        createdAt: { $lt: archiveDate }
    }).populate('childId', 'fullName');

    const data = records.map((r: any) => ({
        childName: r.childId?.fullName || 'Неизвестно',
        amount: r.amount || 0,
        accruals: r.accruals || 0,
        deductions: r.deductions || 0,
        total: r.total || 0,
        status: r.status || '-',
        createdAt: new Date(r.createdAt).toLocaleDateString('ru-RU')
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Оплаты детей');

    worksheet.columns = [
        { header: 'Ребёнок', key: 'childName', width: 30 },
        { header: 'Сумма', key: 'amount', width: 15 },
        { header: 'Начисления', key: 'accruals', width: 15 },
        { header: 'Вычеты', key: 'deductions', width: 15 },
        { header: 'Итого', key: 'total', width: 15 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Дата', key: 'createdAt', width: 15 }
    ];

    data.forEach(row => worksheet.addRow(row));

    const excelBuffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const jsonData = JSON.stringify(data, null, 2);

    return {
        name: 'childPayments',
        count: records.length,
        excelBuffer,
        jsonData
    };
}

/**
 * Экспортирует учёт посещаемости сотрудников старше 3 месяцев
 */
async function exportStaffAttendanceTracking(): Promise<CollectionExportResult> {
    const archiveDate = getArchiveDate();

    const records = await StaffAttendanceTracking.find({
        date: { $lt: archiveDate }
    }).populate('staffId', 'fullName');

    const data = records.map((r: any) => ({
        staffName: r.staffId?.fullName || 'Неизвестно',
        date: r.date ? new Date(r.date).toLocaleDateString('ru-RU') : '-',
        actualStart: r.actualStart ? new Date(r.actualStart).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-',
        actualEnd: r.actualEnd ? new Date(r.actualEnd).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-',
        status: r.status || '-',
        lateMinutes: r.lateMinutes || 0,
        notes: r.notes || '-'
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Учёт рабочего времени');

    worksheet.columns = [
        { header: 'Сотрудник', key: 'staffName', width: 30 },
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Приход', key: 'actualStart', width: 12 },
        { header: 'Уход', key: 'actualEnd', width: 12 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Опоздание (мин)', key: 'lateMinutes', width: 18 },
        { header: 'Заметки', key: 'notes', width: 40 }
    ];

    data.forEach(row => worksheet.addRow(row));

    const excelBuffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const jsonData = JSON.stringify(data, null, 2);

    return {
        name: 'staffAttendanceTracking',
        count: records.length,
        excelBuffer,
        jsonData
    };
}

/**
 * Экспортирует смены сотрудников старше 3 месяцев
 */
async function exportStaffShifts(): Promise<CollectionExportResult> {
    const archiveDate = getArchiveDate();
    const archiveDateStr = archiveDate.toISOString().split('T')[0];

    const records = await StaffShift.find({
        date: { $lt: archiveDateStr }
    }).populate('staffId', 'fullName');

    const data = records.map((r: any) => ({
        staffName: r.staffId?.fullName || 'Неизвестно',
        date: r.date,
        startTime: r.startTime || '-',
        endTime: r.endTime || '-',
        status: r.status || '-',
        notes: r.notes || '-'
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Смены сотрудников');

    worksheet.columns = [
        { header: 'Сотрудник', key: 'staffName', width: 30 },
        { header: 'Дата', key: 'date', width: 15 },
        { header: 'Начало', key: 'startTime', width: 12 },
        { header: 'Окончание', key: 'endTime', width: 12 },
        { header: 'Статус', key: 'status', width: 15 },
        { header: 'Заметки', key: 'notes', width: 40 }
    ];

    data.forEach(row => worksheet.addRow(row));

    const excelBuffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const jsonData = JSON.stringify(data, null, 2);

    return {
        name: 'staffShifts',
        count: records.length,
        excelBuffer,
        jsonData
    };
}

/**
 * Экспортирует зарплаты старше 3 месяцев
 */
async function exportPayrolls(): Promise<CollectionExportResult> {
    const archivePeriod = getArchivePeriod();

    const records = await Payroll.find({
        period: { $lt: archivePeriod }
    }).populate('staffId', 'fullName');

    const data = records.map((r: any) => ({
        staffName: r.staffId?.fullName || 'Неизвестно',
        period: r.period,
        baseSalary: r.baseSalary || 0,
        accruals: r.accruals || 0,
        bonuses: r.bonuses || 0,
        penalties: r.penalties || 0,
        advance: r.advance || 0,
        total: r.total || 0,
        status: r.status || '-'
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Зарплаты');

    worksheet.columns = [
        { header: 'Сотрудник', key: 'staffName', width: 30 },
        { header: 'Период', key: 'period', width: 12 },
        { header: 'Оклад', key: 'baseSalary', width: 15 },
        { header: 'Начисления', key: 'accruals', width: 15 },
        { header: 'Бонусы', key: 'bonuses', width: 12 },
        { header: 'Вычеты', key: 'penalties', width: 12 },
        { header: 'Аванс', key: 'advance', width: 12 },
        { header: 'Итого', key: 'total', width: 15 },
        { header: 'Статус', key: 'status', width: 12 }
    ];

    data.forEach(row => worksheet.addRow(row));

    const excelBuffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;
    const jsonData = JSON.stringify(data, null, 2);

    return {
        name: 'payrolls',
        count: records.length,
        excelBuffer,
        jsonData
    };
}

/**
 * Удаляет экспортированные записи из коллекций
 */
async function deleteArchivedRecords(): Promise<void> {
    const archiveDate = getArchiveDate();
    const archivePeriod = getArchivePeriod();
    const archiveDateStr = archiveDate.toISOString().split('T')[0];

    console.log(`🗑️ Удаление записей старше ${archiveDate.toLocaleDateString('ru-RU')}...`);

    // Удаляем посещаемость детей
    const childAttendanceResult = await ChildAttendance.deleteMany({
        date: { $lt: archiveDate }
    });
    console.log(`  - childAttendance: удалено ${childAttendanceResult.deletedCount} записей`);

    // Удаляем оплаты детей
    const childPaymentResult = await ChildPayment.deleteMany({
        createdAt: { $lt: archiveDate }
    });
    console.log(`  - childPayments: удалено ${childPaymentResult.deletedCount} записей`);

    // Удаляём учёт посещаемости сотрудников
    const staffAttendanceResult = await StaffAttendanceTracking.deleteMany({
        date: { $lt: archiveDate }
    });
    console.log(`  - staffAttendanceTracking: удалено ${staffAttendanceResult.deletedCount} записей`);

    // Удаляём смены сотрудников
    const shiftsResult = await StaffShift.deleteMany({
        date: { $lt: archiveDateStr }
    });
    console.log(`  - staffShifts: удалено ${shiftsResult.deletedCount} записей`);

    // Удаляём зарплаты
    const payrollResult = await Payroll.deleteMany({
        period: { $lt: archivePeriod }
    });
    console.log(`  - payrolls: удалено ${payrollResult.deletedCount} записей`);
}

/**
 * Главная функция: архивирует и удаляет старые записи
 */
export async function archiveAndDeleteRecords(): Promise<void> {
    console.log('📦 Начало автоматического архивирования данных...');
    console.log(`📅 Архивируем записи старше 3 месяцев (до ${getArchiveDate().toLocaleDateString('ru-RU')})`);

    // Уведомление о начале архивирования
    await sendLogToTelegram(`📦 <b>Начало автоматического архивирования</b>\n\nАрхивируем записи старше ${getArchiveDate().toLocaleDateString('ru-RU')}`);

    try {
        // Получаем email из настроек детского сада
        const settings = await settingsService.getKindergartenSettings();
        const recipientEmail = settings?.email;

        if (!recipientEmail) {
            console.error('❌ Email не найден в настройках детского сада. Архивирование отменено.');
            await sendLogToTelegram('❌ <b>Архивирование отменено</b>\n\nEmail не найден в настройках детского сада.');
            return;
        }

        console.log(`📧 Отчёты будут отправлены на: ${recipientEmail}`);

        // Экспортируем все коллекции
        const exports: CollectionExportResult[] = [];

        console.log('📊 Экспорт коллекций...');

        const childAttendanceExport = await exportChildAttendance();
        exports.push(childAttendanceExport);
        console.log(`  - childAttendance: ${childAttendanceExport.count} записей`);

        const childPaymentsExport = await exportChildPayments();
        exports.push(childPaymentsExport);
        console.log(`  - childPayments: ${childPaymentsExport.count} записей`);

        const staffAttendanceExport = await exportStaffAttendanceTracking();
        exports.push(staffAttendanceExport);
        console.log(`  - staffAttendanceTracking: ${staffAttendanceExport.count} записей`);

        const shiftsExport = await exportStaffShifts();
        exports.push(shiftsExport);
        console.log(`  - staffShifts: ${shiftsExport.count} записей`);

        const payrollsExport = await exportPayrolls();
        exports.push(payrollsExport);
        console.log(`  - payrolls: ${payrollsExport.count} записей`);

        // Проверяем, есть ли что архивировать
        const totalRecords = exports.reduce((sum, e) => sum + e.count, 0);
        if (totalRecords === 0) {
            console.log('ℹ️ Нет записей для архивирования. Пропускаем.');
            await sendLogToTelegram('ℹ️ <b>Архивирование завершено</b>\n\nНет записей старше 3 месяцев для архивирования.');
            return;
        }

        // Формируем вложения для email
        const attachments: Array<{ filename: string; content: Buffer | string }> = [];

        for (const exp of exports) {
            if (exp.count > 0) {
                // Excel файл
                attachments.push({
                    filename: `archive_${exp.name}_${getArchivePeriod()}.xlsx`,
                    content: exp.excelBuffer
                });
                // JSON файл
                attachments.push({
                    filename: `archive_${exp.name}_${getArchivePeriod()}.json`,
                    content: exp.jsonData
                });
            }
        }

        // Отправляем email с архивами
        console.log('📧 Отправка архивов на email...');
        await emailService.sendArchiveEmail(recipientEmail, attachments, exports);

        // Удаляем экспортированные записи
        await deleteArchivedRecords();

        console.log('✅ Автоматическое архивирование завершено успешно!');

        // Формируем отчёт для Telegram
        const collectionNames: Record<string, string> = {
            'childAttendance': 'Посещаемость детей',
            'childPayments': 'Оплаты детей',
            'staffAttendanceTracking': 'Учёт рабочего времени',
            'staffShifts': 'Смены сотрудников',
            'payrolls': 'Зарплаты'
        };

        let telegramMessage = `✅ <b>Архивирование завершено</b>\n\n`;
        telegramMessage += `📧 Архив отправлен на: ${recipientEmail}\n\n`;
        telegramMessage += `<b>Удалено записей:</b>\n`;
        exports.filter(e => e.count > 0).forEach(e => {
            telegramMessage += `• ${collectionNames[e.name] || e.name}: ${e.count}\n`;
        });
        telegramMessage += `\n<b>Всего:</b> ${totalRecords} записей`;

        await sendLogToTelegram(telegramMessage);

    } catch (error: any) {
        console.error('❌ Ошибка при архивировании данных:', error);
        await sendLogToTelegram(`❌ <b>Ошибка архивирования</b>\n\n${error?.message || 'Неизвестная ошибка'}`);
        throw error;
    }
}
