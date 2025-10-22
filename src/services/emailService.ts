import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

/**
 * Интерфейс для данных Excel отчета
 */
export interface ExcelReportData {
  filename: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
}

/**
 * Интерфейс для данных отчета о зарплате
 */
interface PayrollReportData {
  month: string;
  totalEmployees: number;
  totalPayroll: number;
  details: Array<{
    staffName: string;
    baseSalary: number;
    penalties: number;
    total: number;
    status: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Настройки SMTP из переменных окружения
    const smtpConfig: SMTPTransport.Options = {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true для порта 465, false для других портов
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password'
      }
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  /**
   * Тестирование подключения к SMTP серверу
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Отправка Excel файла по email
   */
  async sendExcel(options: {
    to: string | string[];
    subject: string;
    filename: string;
    sheetName: string;
    title: string;
    subtitle?: string;
    headers: string[];
    data: any[][];
  }): Promise<any> {
    try {
      // Создаем Excel файл
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName);

      // Добавляем заголовок
      worksheet.mergeCells('A1', `${String.fromCharCode(64 + options.headers.length)}1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = options.title;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };

      // Добавляем подзаголовок, если есть
      if (options.subtitle) {
        worksheet.mergeCells('A2', `${String.fromCharCode(64 + options.headers.length)}2`);
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = options.subtitle;
        subtitleCell.font = { italic: true, size: 12 };
        subtitleCell.alignment = { horizontal: 'center' };
      }

      // Добавляем заголовки таблицы
      const headerRow = worksheet.addRow(options.headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };

      // Добавляем данные
      options.data.forEach(rowData => {
        worksheet.addRow(rowData);
      });

      // Автоширина столбцов
      worksheet.columns.forEach(column => {
        let maxWidth = 0;
        if (column && typeof column.eachCell === 'function') {
          column.eachCell({ includeEmpty: true }, cell => {
            maxWidth = Math.max(maxWidth, cell.value ? cell.value.toString().length : 0);
          });
          column.width = Math.min(maxWidth + 2, 50);
        }
      });

      // Создаем буфер с Excel файлом
      const buffer = await workbook.xlsx.writeBuffer();

      // Отправляем письмо
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: options.to,
        subject: options.subject,
        text: `Во вложении файл ${options.filename}.xlsx`,
        attachments: [
          {
            filename: `${options.filename}.xlsx`,
            content: buffer as unknown as Buffer
          }
        ]
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Excel file sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      
      return info;
    } catch (error) {
      console.error('❌ Error sending Excel file:', error);
      throw error;
    }
  }

  /**
   * Отправка нескольких отчетов по email
   */
  async sendMonthlyReports(recipients: string[], reportsData: ExcelReportData[]): Promise<boolean> {
    try {
      console.log(`📧 Preparing to send ${reportsData.length} monthly reports to ${recipients.length} recipients`);

      // Создаем архив с отчетами
      const attachments: Array<{ filename: string; content: Buffer }> = [];
      
      for (const reportData of reportsData) {
        try {
          // Создаем Excel файл для каждого отчета
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet(reportData.sheetName);

          // Добавляем заголовок
          worksheet.mergeCells('A1', `${String.fromCharCode(64 + reportData.headers.length)}1`);
          const titleCell = worksheet.getCell('A1');
          titleCell.value = reportData.title;
          titleCell.font = { bold: true, size: 14 };
          titleCell.alignment = { horizontal: 'center' };

          // Добавляем подзаголовок, если есть
          if (reportData.subtitle) {
            worksheet.mergeCells('A2', `${String.fromCharCode(64 + reportData.headers.length)}2`);
            const subtitleCell = worksheet.getCell('A2');
            subtitleCell.value = reportData.subtitle;
            subtitleCell.font = { italic: true, size: 12 };
            subtitleCell.alignment = { horizontal: 'center' };
          }

          // Добавляем заголовки таблицы (с учетом возможного сдвига из-за подзаголовка)
          const headerRowIndex = reportData.subtitle ? 3 : 2;
          const headerRow = worksheet.addRow(reportData.headers);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCCCCC' }
          };

          // Добавляем данные
          reportData.data.forEach(rowData => {
            worksheet.addRow(rowData);
          });

          // Автоширина столбцов
          worksheet.columns.forEach(column => {
            let maxWidth = 0;
            if (column && typeof column.eachCell === 'function') {
              column.eachCell({ includeEmpty: true }, cell => {
                maxWidth = Math.max(maxWidth, cell.value ? cell.value.toString().length : 0);
              });
              column.width = Math.min(maxWidth + 2, 50);
            }
          });

          // Создаем буфер с Excel файлом
          const buffer = await workbook.xlsx.writeBuffer();
          
          attachments.push({
            filename: `${reportData.filename}.xlsx`,
            content: buffer as any
          });
        } catch (reportError) {
          console.error(`❌ Error processing report ${reportData.filename}:`, reportError);
        }
      }

      if (attachments.length === 0) {
        throw new Error('No reports could be generated');
      }

      // Отправляем письмо со всеми отчетами
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: recipients,
        subject: `Ежемесячные отчеты за ${new Date().toLocaleDateString('ru-RU')}`,
        text: `Во вложении ежемесячные отчеты системы управления детским садом.`,
        html: `
          <h2>Ежемесячные отчеты</h2>
          <p>Во вложении находятся следующие отчеты:</p>
          <ul>
            ${reportsData.map(report => `<li>${report.title}${report.subtitle ? ` (${report.subtitle})` : ''}</li>`).join('')}
          </ul>
          <p><em>Это автоматически сгенерированные отчеты. Пожалуйста, не отвечайте на это письмо.</em></p>
        `,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Monthly reports sent successfully to ${recipients.join(', ')}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending monthly reports:', error);
      return false;
    }
  }

  /**
   * Отправляет отчет о зарплате по email
   */
 async sendPayrollReportEmail(recipient: string, reportData: any): Promise<any> {
    try {
      console.log(`📧 Подготовка отправки отчета о зарплате на ${recipient} за ${reportData.month}`);
      console.log(`📊 Данные отчета: сотрудников=${reportData.totalEmployees}, общая сумма=${reportData.totalPayroll}`);
      
      // Формируем HTML содержимое письма
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Отчет о зарплатах за ${reportData.month}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h2>Отчет о зарплатах за ${reportData.month}</h2>
          
          <div class="summary">
            <p><strong>Общее количество сотрудников:</strong> ${reportData.totalEmployees}</p>
            <p><strong>Общая сумма зарплат:</strong> ${reportData.totalPayroll.toLocaleString('ru-RU')} тг</p>
          </div>
          
          <h3>Детализация по сотрудникам:</h3>
          <table>
            <thead>
              <tr>
                <th>Сотрудник</th>
                <th>Базовая зарплата</th>
                <th>Штрафы</th>
                <th>Итого к выплате</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details.map((detail: any) => `
                <tr>
                  <td>${detail.staffName}</td>
                  <td>${detail.baseSalary.toLocaleString('ru-RU')} тг</td>
                  <td>${detail.penalties.toLocaleString('ru-RU')} тг</td>
                  <td><strong>${detail.total.toLocaleString('ru-RU')} тг</strong></td>
                  <td>${detail.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Это автоматически сгенерированный отчет. Пожалуйста, не отвечайте на это письмо.</p>
            <p>С уважением,<br>Система управления детским садом</p>
          </div>
        </body>
        </html>
      `;
      
      // Формируем текстовое содержимое письма
      const textContent = `
        Отчет о зарплатах за ${reportData.month}
        
        Общее количество сотрудников: ${reportData.totalEmployees}
        Общая сумма зарплат: ${reportData.totalPayroll.toLocaleString('ru-RU')} тг
        
        Детализация по сотрудникам:
        ${reportData.details.map((detail: any) =>
          `${detail.staffName}: ${detail.baseSalary.toLocaleString('ru-RU')} тг - ${detail.penalties.toLocaleString('ru-RU')} тг штрафов = ${detail.total.toLocaleString('ru-RU')} тг`
        ).join('\n')}
        
        ---
        Это автоматически сгенерированный отчет. Пожалуйста, не отвечайте на это письмо.
        С уважением,
        Система управления детским садом
      `;
      
      // Отправляем письмо
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: recipient,
        subject: `Отчет о зарплатах за ${reportData.month}`,
        text: textContent,
        html: htmlContent
      };
      
      console.log(`📧 Отправка письма на ${recipient} с темой: ${mailOptions.subject}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Отчет о зарплате успешно отправлен на ${recipient}: ${info.messageId}`);
      
      return info;
    } catch (error) {
      console.error(`❌ Ошибка при отправке отчета о зарплате на ${recipient}:`, error);
      throw error;
    }
  }

  /**
   * Отправляет тестовое письмо для проверки настроек
   */
  async sendTestEmail(recipient: string): Promise<any> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: recipient,
        subject: 'Тестовое письмо от системы управления детским садом',
        text: 'Это тестовое письмо для проверки настроек электронной почты.',
        html: '<p>Это тестовое письмо для проверки настроек электронной почты.</p>'
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Тестовое письмо отправлено на ${recipient}: ${info.messageId}`);
      
      return info;
    } catch (error) {
      console.error(`❌ Ошибка при отправке тестового письма на ${recipient}:`, error);
      throw error;
    }
  }
}

export default EmailService;
