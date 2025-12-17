import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export interface ExcelReportData {
  filename: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
}

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

    const smtpConfig: SMTPTransport.Options = {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password'
      }
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName);


      worksheet.mergeCells('A1', `${String.fromCharCode(64 + options.headers.length)}1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = options.title;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center' };


      if (options.subtitle) {
        worksheet.mergeCells('A2', `${String.fromCharCode(64 + options.headers.length)}2`);
        const subtitleCell = worksheet.getCell('A2');
        subtitleCell.value = options.subtitle;
        subtitleCell.font = { italic: true, size: 12 };
        subtitleCell.alignment = { horizontal: 'center' };
      }


      const headerRow = worksheet.addRow(options.headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };


      options.data.forEach(rowData => {
        worksheet.addRow(rowData);
      });


      worksheet.columns.forEach(column => {
        let maxWidth = 0;
        if (column && typeof column.eachCell === 'function') {
          column.eachCell({ includeEmpty: true }, cell => {
            maxWidth = Math.max(maxWidth, cell.value ? cell.value.toString().length : 0);
          });
          column.width = Math.min(maxWidth + 2, 50);
        }
      });


      const buffer = await workbook.xlsx.writeBuffer();


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

  async sendMonthlyReports(recipients: string[], reportsData: ExcelReportData[]): Promise<boolean> {
    try {
      console.log(`📧 Preparing to send ${reportsData.length} monthly reports to ${recipients.length} recipients`);


      const attachments: Array<{ filename: string; content: Buffer }> = [];

      for (const reportData of reportsData) {
        try {

          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet(reportData.sheetName);


          worksheet.mergeCells('A1', `${String.fromCharCode(64 + reportData.headers.length)}1`);
          const titleCell = worksheet.getCell('A1');
          titleCell.value = reportData.title;
          titleCell.font = { bold: true, size: 14 };
          titleCell.alignment = { horizontal: 'center' };


          if (reportData.subtitle) {
            worksheet.mergeCells('A2', `${String.fromCharCode(64 + reportData.headers.length)}2`);
            const subtitleCell = worksheet.getCell('A2');
            subtitleCell.value = reportData.subtitle;
            subtitleCell.font = { italic: true, size: 12 };
            subtitleCell.alignment = { horizontal: 'center' };
          }


          const headerRowIndex = reportData.subtitle ? 3 : 2;
          const headerRow = worksheet.addRow(reportData.headers);
          headerRow.font = { bold: true };
          headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCCCCC' }
          };


          reportData.data.forEach(rowData => {
            worksheet.addRow(rowData);
          });


          worksheet.columns.forEach(column => {
            let maxWidth = 0;
            if (column && typeof column.eachCell === 'function') {
              column.eachCell({ includeEmpty: true }, cell => {
                maxWidth = Math.max(maxWidth, cell.value ? cell.value.toString().length : 0);
              });
              column.width = Math.min(maxWidth + 2, 50);
            }
          });


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

  async sendPayrollReportEmail(recipient: string, reportData: any): Promise<any> {
    try {
      console.log(`📧 Подготовка отправки отчета о зарплате на ${recipient} за ${reportData.month}`);
      console.log(`📊 Данные отчета: сотрудников=${reportData.totalEmployees}, общая сумма=${reportData.totalPayroll}`);


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
                <th>Вычеты</th>
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


      const textContent = `
        Отчет о зарплатах за ${reportData.month}
        
        Общее количество сотрудников: ${reportData.totalEmployees}
        Общая сумма зарплат: ${reportData.totalPayroll.toLocaleString('ru-RU')} тг
        
        Детализация по сотрудникам:
        ${reportData.details.map((detail: any) =>
        `${detail.staffName}: ${detail.baseSalary.toLocaleString('ru-RU')} тг - ${detail.penalties.toLocaleString('ru-RU')} тг Вычетов = ${detail.total.toLocaleString('ru-RU')} тг`
      ).join('\n')}
        
        ---
        Это автоматически сгенерированный отчет. Пожалуйста, не отвечайте на это письмо.
        С уважением,
        Система управления детским садом
      `;


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

  async sendArchiveEmail(
    recipient: string,
    attachments: Array<{ filename: string; content: Buffer | string }>,
    exports: Array<{ name: string; count: number }>
  ): Promise<any> {
    try {
      const archiveDate = new Date();
      archiveDate.setMonth(archiveDate.getMonth() - 3);

      const collectionNames: Record<string, string> = {
        'childAttendance': 'Посещаемость детей',
        'childPayments': 'Оплаты детей',
        'staffAttendanceTracking': 'Учёт рабочего времени',
        'staffShifts': 'Смены сотрудников',
        'payrolls': 'Зарплаты'
      };

      const totalRecords = exports.reduce((sum, e) => sum + e.count, 0);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Архив данных</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h2>📦 Автоматический архив данных</h2>
          
          <p><strong>Дата архивирования:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
          <p><strong>Архивируемый период:</strong> записи старше ${archiveDate.toLocaleDateString('ru-RU')}</p>
          <p><strong>Всего записей:</strong> ${totalRecords}</p>
          
          <h3>Состав архива:</h3>
          <table>
            <thead>
              <tr>
                <th>Коллекция</th>
                <th>Количество записей</th>
              </tr>
            </thead>
            <tbody>
              ${exports.map(e => `
                <tr>
                  <td>${collectionNames[e.name] || e.name}</td>
                  <td>${e.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p>Во вложении находятся файлы архива в форматах Excel и JSON.</p>
          <p><strong>⚠️ Эти данные были удалены из базы данных.</strong></p>
          
          <div class="footer">
            <p>Это автоматически сгенерированный отчёт. Пожалуйста, сохраните вложения для архива.</p>
            <p>С уважением,<br>Система управления детским садом</p>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: recipient,
        subject: `📦 Архив данных за ${archiveDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`,
        html: htmlContent,
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content
        }))
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Архив успешно отправлен на ${recipient}: ${info.messageId}`);

      return info;
    } catch (error) {
      console.error(`❌ Ошибка при отправке архива на ${recipient}:`, error);
      throw error;
    }
  }
}

export default EmailService;

