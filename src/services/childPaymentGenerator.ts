import { getChildPayments, createChildPayment } from '../entities/childPayment/service';
import { getChildren } from '../entities/children/service';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { sendLogToTelegram } from '../utils/telegramLogger';
import mongoose from 'mongoose';

const DEFAULT_AMOUNT = 35000;

export const generateMonthlyChildPayments = async (dateForMonth?: Date): Promise<void> => {
  const targetDate = dateForMonth || new Date();
  console.log(`Запуск генерации ежемесячных оплат за детей для месяца: ${targetDate.toISOString()}`);
  await sendLogToTelegram(`Начало генерации ежемесячных оплат за детей для месяца: ${targetDate.toISOString()}`);

  const currentMonthStart = startOfMonth(targetDate);
  const currentMonthEnd = endOfMonth(targetDate);

  const previousMonth = subMonths(targetDate, 1);
  const previousMonthStart = startOfMonth(previousMonth);
  const previousMonthEnd = endOfMonth(previousMonth);

  try {
    const activeChildren = await getChildren({ active: true });
    let createdCount = 0;
    let skippedCount = 0;

    for (const child of activeChildren) {

      const existingPayments = await getChildPayments({
        childId: child._id.toString(),
        'period.start': { $gte: currentMonthStart },
        'period.end': { $lte: currentMonthEnd },
      });

      if (existingPayments.length > 0) {
        console.log(`Оплата для ребенка ${child.fullName} в текущем месяце уже существует. Пропускаем.`);
        skippedCount++;
        continue;
      }


      const previousPayments = await getChildPayments({
        childId: child._id.toString(),
        'period.start': { $gte: previousMonthStart },
        'period.end': { $lte: previousMonthEnd },
      });

      let amount = DEFAULT_AMOUNT;
      let total = DEFAULT_AMOUNT;

      if (previousPayments.length > 0) {

        const lastPayment = previousPayments[previousPayments.length - 1];
        amount = lastPayment.amount;
        total = lastPayment.total;
        console.log(`Найдена оплата за прошлый месяц для ребенка ${child.fullName}. Сумма: ${amount}`);
      } else {
        console.log(`Оплата за прошлый месяц для ребенка ${child.fullName} не найдена. Используется стандартная сумма: ${DEFAULT_AMOUNT}`);
      }


      await createChildPayment({
        childId: child._id as mongoose.Types.ObjectId,
        period: {
          start: currentMonthStart,
          end: currentMonthEnd,
        },
        amount,
        total,
        status: 'active',
        comments: 'Сгенерировано автоматически',
      });
      createdCount++;
      console.log(`Создана новая запись об оплате для ребенка ${child.fullName}`);
    }

    const summary = `Генерация ежемесячных оплат завершена. Создано: ${createdCount}. Пропущено (уже существуют): ${skippedCount}.`;
    console.log(summary);
    await sendLogToTelegram(summary);

  } catch (error) {
    const errorMessage = `Ошибка при генерации ежемесячных оплат: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    await sendLogToTelegram(errorMessage);
  }
};
