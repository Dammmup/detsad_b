import ExcelJS from 'exceljs';

interface JournalEntry {
  time: string;
  value: string;
  staffName: string;
  notes?: string;
}

export async function generateJournalExcel(journalName: string, date: string, entries: JournalEntry[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(journalName);

  // Заголовки
  sheet.addRow([journalName]);
  sheet.addRow([`Дата: ${date}`]);
  sheet.addRow([]);
  sheet.addRow(['Время/Смена', 'Значение', 'Сотрудник', 'Примечание']);

  // Данные
  entries.forEach(e => {
    sheet.addRow([e.time, e.value, e.staffName, e.notes || '']);
  });

  // Стилизация
  sheet.columns.forEach(col => {
    col.width = 20;
  });
  sheet.getRow(4).font = { bold: true };

  // Генерация буфера Excel
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
