import * as dotenv from 'dotenv';
import XLSX from 'xlsx';

// Загружаем переменные окружения
dotenv.config();

// Функция для отладки структуры Excel файла
const debugExcel = async () => {
  try {
    console.log('Начинаем отладку структуры Excel файла...');

    // Читаем Excel файл
    const workbook = XLSX.readFile('../react-material-admin/Пользователи (1).xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Преобразуем в JSON
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Найдено ${jsonData.length} записей в Excel файле`);
    
    if (jsonData.length > 0) {
      console.log('Первые несколько записей:');
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        console.log(`Запись ${i + 1}:`, jsonData[i]);
      }
      
      console.log('Ключи (названия колонок) в первой записи:');
      console.log(Object.keys(jsonData[0]));
    }
  } catch (error) {
    console.error('Ошибка при отладке Excel файла:', error);
    throw error;
  }
};

debugExcel();