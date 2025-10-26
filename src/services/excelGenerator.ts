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
  // Заголовки и стилизация
  const titleRow = sheet.addRow([journalName]);
  titleRow.font = { size: 16, bold: true };
  sheet.mergeCells('A1:D1');
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const dateRow = sheet.addRow([`Дата: ${date}`]);
  dateRow.font = { italic: true };
  sheet.mergeCells('A2:D2');
  dateRow.alignment = { horizontal: 'center' };
  
  sheet.addRow([]); // Пустая строка

  const headerRow = sheet.addRow(['Время/Смена', 'Значение', 'Сотрудник', 'Примечание']);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Данные
  entries.forEach(e => {
    const row = sheet.addRow([e.time, e.value, e.staffName, e.notes || '']);
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // Автоматическая ширина колонок
  sheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });

  // Генерация буфера Excel
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}
