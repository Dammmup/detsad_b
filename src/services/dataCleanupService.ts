import cron from 'node-cron';
import ChildAttendance from '../models/ChildAttendance';
import StaffAttendance from '../models/StaffAttendance';
import User from '../models/Users';
import Group from '../models/Group';
import EmailService, { ExcelReportData } from './emailService';

class DataCleanupService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Получение данных для отчетов
  private async getChildrenListData(): Promise<ExcelReportData> {
    try {
      const children = await User.find({ type: 'child' });
      const groups = await Group.find({});
      
      const data = children.map(child => {
        const group = groups.find(g => (g as any)?._id?.toString() === child.groupId?.toString());
        return [
          child.fullName || '',
          child.birthday ? (child.birthday as any).toLocaleDateString?.() || child.birthday.toString() : '',
          group?.name || '',
          child.parentName || '',
          child.parentPhone || '',
          (child as any).address || '',
          child.createdAt ? (child.createdAt as any).toLocaleDateString?.() || child.createdAt.toString() : '',
          'Активный'
        ];
      });

      return {
        filename: 'Список_детей',
        sheetName: 'Список детей',
        title: 'Список детей детского сада',
        headers: [
          'ФИО ребенка',
          'Дата рождения', 
          'Группа',
          'ФИО родителя',
          'Телефон',
          'Адрес',
          'Дата поступления',
          'Статус'
        ],
        data
      };
    } catch (error) {
      console.error('Error getting children list data:', error);
      throw error;
    }
  }

  private async getStaffListData(): Promise<ExcelReportData> {
    try {
      const staff = await User.find({ type: 'adult' });
      const groups = await Group.find({});
      
      const data = staff.map(member => {
        const group = groups.find(g => (g as any)?._id?.toString() === member.groupId?.toString());
        return [
          member.fullName || '',
          member.role || '',
          group?.name || '',
          member.phone || '',
          (member as any).email || '',
          member.createdAt ? (member.createdAt as any).toLocaleDateString?.() || member.createdAt.toString() : '',
          'Активный',
          member.salary ? `${member.salary} тенге` : ''
        ];
      });

      return {
        filename: 'Список_сотрудников',
        sheetName: 'Сотрудники',
        title: 'Список сотрудников детского сада',
        headers: [
          'ФИО сотрудника',
          'Должность',
          'Группа', 
          'Телефон',
          'Email',
          'Дата трудоустройства',
          'Статус',
          'Зарплата'
        ],
        data
      };
    } catch (error) {
      console.error('Error getting staff list data:', error);
      throw error;
    }
  }

  private async getChildrenAttendanceData(): Promise<ExcelReportData> {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      
      const attendance = await ChildAttendance.find({
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      const children = await User.find({ type: 'child' });
      const groups = await Group.find({});
      
      const data = attendance.map(record => {
        const child = children.find(c => (c as any)?._id?.toString() === record.childId.toString());
        const group = groups.find(g => (g as any)?._id?.toString() === record.groupId?.toString());
        
        const date = new Date(record.date);
        const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const formattedDate = `${date.toLocaleDateString('ru-RU')} (${weekdays[date.getDay()]})`;
        
        return [
          child?.fullName || '',
          formattedDate,
          record.status === 'present' ? 'Присутствовал' :
          record.status === 'absent' ? 'Отсутствовал' :
          record.status === 'late' ? 'Опоздал' :
          record.status === 'sick' ? 'Болел' : record.status || '',
          record.checkInTime || '',
          record.checkOutTime || '',
          group?.name || '',
          record.notes || ''
        ];
      });

      const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                         'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      const period = `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;

      return {
        filename: `Табель_посещаемости_детей`,
        sheetName: 'Табель посещаемости',
        title: 'Табель посещаемости детей',
        subtitle: `Период: ${period}`,
        headers: [
          'ФИО ребенка',
          'Дата',
          'Статус',
          'Время прихода',
          'Время ухода', 
          'Группа',
          'Примечания'
        ],
        data
      };
    } catch (error) {
      console.error('Error getting children attendance data:', error);
      throw error;
    }
  }

  private async getStaffAttendanceData(): Promise<ExcelReportData> {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
      
      const attendance = await StaffAttendance.find({
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      const staff = await User.find({ type: 'adult' });
      const groups = await Group.find({});
      
      const data = attendance.map(record => {
        const staffMember = staff.find(s => (s as any)?._id?.toString() === record.staffId.toString());
        const group = groups.find(g => (g as any)?._id?.toString() === record.groupId?.toString());
        
        const date = new Date(record.date);
        const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const formattedDate = `${date.toLocaleDateString('ru-RU')} (${weekdays[date.getDay()]})`;
        
        return [
          staffMember?.fullName || '',
          formattedDate,
          record.shiftType || '',
          `${record.scheduledStart || ''} - ${record.scheduledEnd || ''}`,
          `${record.actualStart || ''} - ${record.actualEnd || ''}`,
          record.lateMinutes || 0,
          record.overtimeMinutes || 0,
          record.status === 'completed' ? 'Завершено' :
          record.status === 'in_progress' ? 'В процессе' :
          record.status === 'late' ? 'Опоздание' :
          record.status === 'no_show' ? 'Не явился' : record.status || '',
          group?.name || '',
          record.notes || ''
        ];
      });

      const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                         'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      const period = `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;

      return {
        filename: `Табель_рабочего_времени`,
        sheetName: 'Табель рабочего времени',
        title: 'Табель учета рабочего времени сотрудников',
        subtitle: `Период: ${period}`,
        headers: [
          'ФИО сотрудника',
          'Дата',
          'Тип смены',
          'Плановое время',
          'Фактическое время',
          'Опоздание (мин)',
          'Сверхурочные (мин)',
          'Статус',
          'Группа',
          'Примечания'
        ],
        data
      };
    } catch (error) {
      console.error('Error getting staff attendance data:', error);
      throw error;
    }
  }

  // Удаление старых записей (старше месяца)
  private async cleanupOldRecords(): Promise<void> {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      console.log(`🧹 Starting cleanup of records older than ${oneMonthAgo.toLocaleDateString('ru-RU')}`);

      // Удаляем старые записи посещаемости детей
      const deletedChildAttendance = await ChildAttendance.deleteMany({
        date: { $lt: oneMonthAgo }
      });

      // Удаляем старые записи посещаемости сотрудников
      const deletedStaffAttendance = await StaffAttendance.deleteMany({
        date: { $lt: oneMonthAgo }
      });

      console.log(`✅ Cleanup completed:`);
      console.log(`   - Child attendance records deleted: ${deletedChildAttendance.deletedCount}`);
      console.log(`   - Staff attendance records deleted: ${deletedStaffAttendance.deletedCount}`);

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  // Основная функция месячной обработки
  async performMonthlyTasks(): Promise<void> {
    try {
      console.log('📊 Starting monthly tasks...');

      // Получаем данные для всех отчетов
      const [
        childrenListData,
        staffListData,
        childrenAttendanceData,
        staffAttendanceData
      ] = await Promise.all([
        this.getChildrenListData(),
        this.getStaffListData(),
        this.getChildrenAttendanceData(),
        this.getStaffAttendanceData()
      ]);

      const reportsData = [
        childrenListData,
        staffListData,
        childrenAttendanceData,
        staffAttendanceData
      ];

      // Получаем список администраторов для отправки отчетов
      const admins = await User.find({ role: 'admin' });
      const adminEmails = admins
        .filter(admin => (admin as any).email)
        .map(admin => (admin as any).email!);

      if (adminEmails.length === 0) {
        console.warn('⚠️ No admin emails found for sending reports');
        return;
      }

      // Отправляем месячные отчеты
      const emailSent = await this.emailService.sendMonthlyReports(adminEmails, reportsData);
      
      if (emailSent) {
        console.log('✅ Monthly reports sent successfully');
        
        // После успешной отправки отчетов очищаем старые данные
        await this.cleanupOldRecords();
      } else {
        console.error('❌ Failed to send monthly reports');
      }

    } catch (error) {
      console.error('❌ Error performing monthly tasks:', error);
    }
  }

  // Запуск планировщика задач
  startScheduler(): void {
    // Запуск в последний день каждого месяца в 23:00
    cron.schedule('0 23 28-31 * *', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Проверяем, что завтра будет первое число месяца
      if (tomorrow.getDate() === 1) {
        console.log('📅 End of month detected, starting monthly tasks...');
        await this.performMonthlyTasks();
      }
    });

    // Дополнительная проверка в первый день месяца в 00:30 (на случай если пропустили)
    cron.schedule('30 0 1 * *', async () => {
      console.log('📅 First day of month backup check...');
      await this.performMonthlyTasks();
    });

    console.log('⏰ Monthly scheduler started');
  }

  // Тестовая функция для немедленного выполнения месячных задач
  async testMonthlyTasks(): Promise<void> {
    console.log('🧪 Running test monthly tasks...');
    await this.performMonthlyTasks();
  }
}

export default DataCleanupService;
