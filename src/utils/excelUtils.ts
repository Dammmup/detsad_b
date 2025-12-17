import ExcelJS from 'exceljs';

interface Header {
  header: string;
  key: string;
  width: number;
}

export async function createExcelBuffer(headers: Header[], data: any[], sheetName: string = 'Sheet 1', metadata: string[][] = []): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);


  metadata.forEach(row => {
    worksheet.addRow(row);
  });

  worksheet.columns = headers.map(h => ({ header: h.header, key: h.key, width: h.width }));

  data.forEach(row => {
    worksheet.addRow(row);
  });

  return await workbook.xlsx.writeBuffer() as unknown as Buffer;
}
