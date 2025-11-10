
import ExcelJS from 'exceljs';
import path from 'path';

const debugRows = async () => {
  console.log('Запуск отладки строк...');

  try {
    const filePath = path.resolve(__dirname, 'Отчет № 949939.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    console.log('\n--- Сырые данные из строк Excel ---');
    for (let rowNumber = 6; rowNumber <= 10; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      console.log(`Строка ${rowNumber}:`, JSON.stringify(row.values));
    }

  } catch (error) {
    console.error('Ошибка во время отладки:', error);
  } finally {
    console.log('\nОтладка завершена.');
  }
};

debugRows();
