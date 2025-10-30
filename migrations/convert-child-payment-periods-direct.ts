import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

// Функция для преобразования строкового периода в формат дат
function parsePeriodString(periodStr: string): { start: Date; end: Date } {
  // Проверяем формат "10 окт - 9 ноября"
  const monthNames: { [key: string]: number } = {
    'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'июн': 5,
    'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11,
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
    'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
  };

  // Пытаемся распознать формат "10 окт - 9 ноября"
 const match = periodStr.match(/(\d+)\s+([а-яё]+)\s*-\s*(\d+)\s+([а-яё]+)/i);
  if (match) {
    const [, startDay, startMonth, endDay, endMonth] = match;
    const startMonthNum = monthNames[startMonth.toLowerCase()];
    const endMonthNum = monthNames[endMonth.toLowerCase()];
    
    // Получаем текущий год или предполагаемый год на основе месяца
    const currentYear = new Date().getFullYear();
    // Если текущий месяц позже конца периода, значит это следующий год
    const isNextYear = new Date().getMonth() > endMonthNum;
    const year = isNextYear ? currentYear + 1 : currentYear;
    
    const startDate = new Date(year, startMonthNum, parseInt(startDay));
    const endDate = new Date(year, endMonthNum, parseInt(endDay));
    
    return { start: startDate, end: endDate };
  }
  
  // Если формат YYYY-MM (старый формат)
  const yearMonthMatch = periodStr.match(/^(\d{4})-(\d{2})$/);
 if (yearMonthMatch) {
    const [, year, month] = yearMonthMatch;
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0); // Последний день месяца
    return { start, end };
  }
  
  // Если ничего не подошло, возвращаем стандартные даты
  console.warn(`Не удалось распознать формат периода: ${periodStr}`);
  return { start: new Date(), end: new Date() };
}

export async function up() {
  console.log('Начинаем прямую миграцию периодов оплат детей...');
  
  try {
    // Получаем прямой доступ к коллекции, обходя Mongoose модель
    const collection = mongoose.connection.collection('childPayments');
    
    // Находим все документы, где period - это строка
    const payments = await collection.find({ "period": { $type: "string" } }).toArray();
    console.log(`Найдено ${payments.length} записей со старым форматом для миграции`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const payment of payments) {
      try {
        const parsedPeriod = parsePeriodString(payment.period);
        
        // Обновляем запись с новым форматом периода
        await collection.updateOne(
          { _id: payment._id },
          { 
            $set: { 
              period: parsedPeriod 
            } 
          }
        );
        
        updatedCount++;
        if (updatedCount % 10 === 0) {
          console.log(`Обновлено ${updatedCount} записей...`);
        }
      } catch (err) {
        console.error(`Ошибка при обновлении записи ${payment._id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`Прямая миграция завершена. Обновлено: ${updatedCount}, ошибок: ${errorCount}`);
  } catch (error) {
    console.error('Ошибка при выполнении прямой миграции:', error);
    throw error;
  }
}

export async function down() {
  console.log('Откат миграции не предусмотрен - данные уже в новом формате');
}