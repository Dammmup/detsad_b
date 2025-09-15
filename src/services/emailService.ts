import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Интерфейсы
interface EmailConfig {
  to: string[];
  subject: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

interface ExcelReportData {
  filename: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
}

class EmailService {
  // Универсальная отправка Excel-файла по email
  async sendExcel({ to, subject, filename, sheetName, title, subtitle, headers, data }: {
    to: string | string[];
    subject: string;
    filename: string;
    sheetName: string;
    title: string;
    subtitle?: string;
    headers: string[];
    data: any[][];
  }): Promise<boolean> {
    const excelBuffer = this.createExcelBuffer({ filename, sheetName, title, subtitle, headers, data });
    return await this.sendEmail({
      to: Array.isArray(to) ? to : [to],
      subject,
      text: title,
      attachments: [
        {
          filename,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });
  }

  private transporter: nodemailer.Transporter;

  constructor() {
    // Настройка транспортера для отправки email
    this.transporter = nodemailer.createTransport({
      host: 'smtp.mail.ru', // Заменить на твой SMTP-сервер
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'dochky.1@mail.ru',
        pass: process.env.EMAIL_PASS || 'D1W0YffYmDPNtjRkWSgL'
      }
    });
  }

  // Создание Excel файла из данных
  private createExcelBuffer(reportData: ExcelReportData): Buffer {
    const workbook = XLSX.utils.book_new();
    
    // Подготавливаем данные для листа
    const worksheetData: any[][] = [];
    
    // Добавляем заголовок документа с датой
    const currentDate = new Date().toLocaleDateString('ru-RU');
    worksheetData.push([`${reportData.title} - ${currentDate}`]);
    worksheetData.push([]); // Пустая строка
    
    // Добавляем подзаголовок если есть
    if (reportData.subtitle) {
      worksheetData.push([reportData.subtitle]);
      worksheetData.push([]); // Пустая строка
    }
    
    // Добавляем заголовки колонок
    worksheetData.push(reportData.headers);
    
    // Добавляем данные
    worksheetData.push(...reportData.data);
    
    // Добавляем информацию о формировании документа
    worksheetData.push([]);
    worksheetData.push([`Документ сформирован автоматически: ${currentDate} в ${new Date().toLocaleTimeString('ru-RU')}`]);
    
    // Создаем лист
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Настраиваем ширину колонок
    const columnWidths = reportData.headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...reportData.data.map(row => String(row[index] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    
    worksheet['!cols'] = columnWidths;
    
    // Добавляем лист в книгу
    XLSX.utils.book_append_sheet(workbook, worksheet, reportData.sheetName);
    
    // Генерируем буфер
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  // Отправка email с вложениями
  async sendEmail(config: EmailConfig): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || process.env.EMAIL_USER,
        to: config.to.join(', '),
        subject: config.subject,
        text: config.text,
        attachments: config.attachments || []
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Отправка месячных отчетов
  async sendMonthlyReports(
    recipients: string[],
    reportsData: ExcelReportData[]
  ): Promise<boolean> {
    try {
      const currentDate = new Date();
      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];
      
      const monthName = monthNames[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      const period = `${monthName} ${year}`;

      // Создаем вложения из отчетов
      const attachments = reportsData.map(reportData => {
        const buffer = this.createExcelBuffer(reportData);
        const timestamp = currentDate.toISOString().slice(0, 10);
        
        return {
          filename: `${reportData.filename}_${timestamp}.xlsx`,
          content: buffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
      });

      const emailConfig: EmailConfig = {
        to: recipients,
        subject: `Месячные отчеты детского сада - ${period}`,
        text: `
Добрый день!

Направляем Вам автоматически сформированные месячные отчеты за ${period}:

${reportsData.map((report, index) => `${index + 1}. ${report.title}`).join('\n')}

Отчеты содержат:
- Актуальную информацию на момент формирования
- Даты с указанием дней недели (где применимо)
- Полную статистику за отчетный период

Документы сформированы автоматически ${currentDate.toLocaleDateString('ru-RU')} в ${currentDate.toLocaleTimeString('ru-RU')}.

С уважением,
Система управления детским садом
        `,
        attachments
      };

      return await this.sendEmail(emailConfig);
    } catch (error) {
      console.error('❌ Error sending monthly reports:', error);
      return false;
    }
  }

  // Тестирование подключения
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}

export default EmailService;
export { ExcelReportData, EmailConfig };
