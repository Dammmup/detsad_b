import mongoose, { Schema, Document, Types } from 'mongoose';
import Child, { IChild } from '../src/entities/children/model';
import SomaticJournal, { ISomaticJournal } from '../src/entities/medician/somaticJournal/model';
import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad_db';

const DIAGNOSES = [
    { diagnosis: 'температура', treatment: 'парацетамол' },
    { diagnosis: 'понос', treatment: 'смекта 1 пакет' },
    { diagnosis: 'рвота', treatment: 'смекта/имудон' },
    { diagnosis: 'укус насекомого', treatment: 'псило бальзам' },
    { diagnosis: 'кашель', treatment: 'сироп от кашля' },
    { diagnosis: 'боль в горле', treatment: 'спрей для горла' },
    { diagnosis: 'аллергическая реакция', treatment: 'антигистаминное' },
    { diagnosis: 'насморк', treatment: 'капли для носа' },
    { diagnosis: 'головная боль', treatment: 'ибупрофен' },
    { diagnosis: 'небольшая травма', treatment: 'антисептик и пластырь' },
    { diagnosis: 'конъюнктивит', treatment: 'глазные капли' },
    { diagnosis: 'ожог', treatment: 'пантенол' },
    { diagnosis: 'простуда', treatment: 'обильное питье, покой' },
    { diagnosis: 'ветрянка', treatment: 'зеленка/каламин' }
];

// Вспомогательная функция для получения случайного целого числа
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Вспомогательная функция для получения случайного элемента из массива
function getRandomItem<T>(arr: T[]): T {
    return arr[getRandomInt(0, arr.length - 1)];
}

// Вспомогательная функция для получения начала недели (понедельник)
function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Вспомогательная функция для добавления дней к дате
function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

async function generateSomaticJournalEntries() {
    console.log('Начинаем генерацию записей в журнал соматической заболеваемости...');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Подключение к MongoDB установлено.');

        const children = await Child.find({ active: true }, '_id fullName');

        if (children.length === 0) {
            console.warn('В базе данных нет активных детей. Генерация невозможна.');
            await mongoose.disconnect();
            return;
        }

        const entriesToInsert: ISomaticJournal[] = [];
        const startDate = new Date('2026-01-01T00:00:00.000Z');
        const endDate = new Date(); // Сегодняшняя дата
        endDate.setHours(23, 59, 59, 999); // До конца сегодняшнего дня

        let currentWeekStart = getStartOfWeek(startDate);

        while (currentWeekStart <= endDate) {
            const numEntriesThisWeek = getRandomInt(2, 3);
            const usedChildrenIdsForWeek = new Set<string>();
            const availableChildren = [...children]; // Копия списка детей для текущей недели

            for (let i = 0; i < numEntriesThisWeek; i++) {
                if (availableChildren.length === 0) {
                    console.warn(`Недостаточно уникальных детей для генерации ${numEntriesThisWeek} записей на неделе, начинающейся с ${currentWeekStart.toISOString().split('T')[0]}.`);
                    break;
                }

                // Выбираем случайного ребенка, который еще не использовался на этой неделе
                let child: IChild | undefined;
                let attempts = 0;
                while (!child && attempts < children.length) {
                    const randomIndex = getRandomInt(0, availableChildren.length - 1);
                    const potentialChild = availableChildren[randomIndex];

                    if (!usedChildrenIdsForWeek.has(potentialChild._id.toString())) {
                        child = potentialChild;
                        usedChildrenIdsForWeek.add(child._id.toString());
                        availableChildren.splice(randomIndex, 1); // Удаляем использованного ребенка из доступных на этой неделе
                    }
                    attempts++;
                }

                if (!child) {
                    console.warn(`Не удалось найти уникального ребенка для записи на неделе, начинающейся с ${currentWeekStart.toISOString().split('T')[0]}.`);
                    break;
                }

                const { diagnosis, treatment } = getRandomItem(DIAGNOSES);

                // Случайная дата в течение текущей недели
                const daysInWeek = getRandomInt(0, 6); // От 0 до 6 дней от начала недели
                const entryDate = addDays(currentWeekStart, daysInWeek);
                entryDate.setHours(getRandomInt(8, 17), getRandomInt(0, 59), 0, 0); // Время в течение рабочего дня

                // Случайная продолжительность болезни (1-5 дней)
                const illnessDuration = getRandomInt(1, 5);
                const fromDate = entryDate;
                const toDate = addDays(entryDate, illnessDuration - 1); // -1 так как продолжительность включает fromDate

                const newEntry: ISomaticJournal = {
                    childId: child._id as any || '', //Явное приведение типа
                    date: entryDate,
                    diagnosis: diagnosis,
                    fromDate: fromDate,
                    toDate: toDate,
                    days: illnessDuration,
                    notes: `Лечение: ${treatment}`,
                    fio: child.fullName,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                } as any;
                entriesToInsert.push(newEntry);
            }

            // Переходим к следующей неделе
            currentWeekStart = addDays(currentWeekStart, 7);
        }

        if (entriesToInsert.length > 0) {
            await SomaticJournal.insertMany(entriesToInsert);
            console.log(`Успешно создано ${entriesToInsert.length} записей в журнале соматической заболеваемости.`);
        } else {
            console.log('Не удалось создать ни одной записи.');
        }

    } catch (error) {
        console.error('Ошибка при генерации записей:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Отключение от MongoDB.');
    }
}

generateSomaticJournalEntries().catch(console.error);
