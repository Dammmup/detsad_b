import ExcelJS from 'exceljs';

interface Header {
  header: string;
  key: string;
  width: number;
}

export async function createExcelBuffer(headers: Header[], data: any[], sheetName: string = 'Sheet 1', metadata: string[][] = []): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Сначала добавляем metadata как обычные строки
  metadata.forEach(row => {
    worksheet.addRow(row);
  });

  // Добавляем строку заголовков вручную (после metadata)
  const headerRow = worksheet.addRow(headers.map(h => h.header));
  headerRow.font = { bold: true };

  // Устанавливаем ширину колонок
  headers.forEach((h, index) => {
    const col = worksheet.getColumn(index + 1);
    col.width = h.width;
    col.key = h.key;
  });

  // Добавляем данные
  data.forEach(row => {
    worksheet.addRow(row);
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}
