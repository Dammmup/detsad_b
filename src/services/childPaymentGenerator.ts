import { getChildPayments, createChildPayment } from '../entities/childPayment/service';
import { getChildren } from '../entities/children/service';
import { sendLogToTelegram } from '../utils/telegramLogger';
import mongoose from 'mongoose';

const DEFAULT_AMOUNT = 40000;

export const generateMonthlyChildPayments = async (dateForMonth?: Date): Promise<void> => {
  const now = new Date();

  // Получаем текущую дату в Астане для расчета календарного месяца
  const almatyDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });
  const [year, month, day] = almatyDateStr.split('-').map(Number);

  // Целевой месяц (текущий или переданный)
  let targetYear = year;
  let targetMonth = month - 1; // 0-indexed

  if (dateForMonth) {
    const d = new Date(dateForMonth.toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
    targetYear = d.getFullYear();
    targetMonth = d.getMonth();
  }

  // Нормализованные даты начала и конца месяца по Астане (UTC+5)
  // 00:00:00 Almaty = 19:00:00 UTC предыдущего дня
  const currentMonthStart = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0));
  currentMonthStart.setUTCHours(currentMonthStart.getUTCHours() - 5);

  const currentMonthEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0));
  currentMonthEnd.setUTCMilliseconds(-1);
  currentMonthEnd.setUTCHours(currentMonthEnd.getUTCHours() - 5);

  const monthPeriod = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

  console.log(`Запуск генерации оплат за ${monthPeriod} (Almaty TZ)`);
  console.log(`Период UTC: ${currentMonthStart.toISOString()} - ${currentMonthEnd.toISOString()}`);

  const almatyDisplayDate = new Date(Date.UTC(targetYear, targetMonth, 1)).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  await sendLogToTelegram(`🚀 Начало генерации ежемесячных оплат за детей за <b>${almatyDisplayDate}</b>`);

  try {
    const activeChildren = await getChildren({ active: true });
    let createdCount = 0;
    let skippedCount = 0;

    for (const child of activeChildren) {
      // Проверка по monthPeriod
      const existingPayments = await getChildPayments({
        childId: child._id.toString(),
        monthPeriod: monthPeriod,
      });

      if (existingPayments.length > 0) {
        console.log(`Оплата для ${child.fullName} за ${monthPeriod} уже существует. Пропускаем.`);
        skippedCount++;
        continue;
      }

      // Берем сумму из поля paymentAmount ребенка (или дефолт если не установлено)
      const amount = child.paymentAmount || DEFAULT_AMOUNT;
      const total = amount;

      // Последняя проверка перед созданием (во избежание гонки условий)
      const safetyCheck = await getChildPayments({
        childId: child._id.toString(),
        monthPeriod: monthPeriod,
      });

      if (safetyCheck.length > 0) {
        skippedCount++;
        continue;
      }

      await createChildPayment({
        childId: child._id as mongoose.Types.ObjectId,
        period: {
          start: currentMonthStart,
          end: currentMonthEnd,
        },
        monthPeriod,
        amount,
        total,
        status: 'active',
        comments: 'Сгенерировано автоматически',
      });
      createdCount++;
    }

    const summary = `Генерация оплат за ${almatyDisplayDate} завершена. Создано: ${createdCount}. Пропущено: ${skippedCount}.`;
    console.log(summary);
    await sendLogToTelegram(summary);

  } catch (error) {
    const errorMessage = `Ошибка при генерации оплат: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    await sendLogToTelegram(errorMessage);
  }
};
