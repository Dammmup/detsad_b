import { MongoClient } from 'mongodb';

// Конфигурация подключения к БД
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'detsad_db';

// Список диагнозов и соответствующих лекарств согласно требованиям
const DIAGNOSES = [
    { diagnosis: 'температура', treatment: 'парацетамол' },
    { diagnosis: 'понос', treatment: 'смекта 1 пакет' },
    { diagnosis: 'рвота', treatment: 'смекта' },
    { diagnosis: 'рвота', treatment: 'имудон' },
    { diagnosis: 'укус', treatment: 'псило бальзам' },
    { diagnosis: 'кашель', treatment: 'жаропонижающее' },
    { diagnosis: 'заболевание горла', treatment: 'антибиотик' },
    { diagnosis: 'аллергия', treatment: 'антигистаминное' },
    { diagnosis: 'ринит', treatment: 'капли для носа' },
    { diagnosis: 'кровотечение', treatment: 'остановка кровотечения' },
    { diagnosis: 'травма плеча', treatment: 'фиксация и обработка' },
    { diagnosis: 'травма локтя', treatment: 'фиксация и обработка' },
    { diagnosis: 'травма бедра', treatment: 'фиксация и обработка' },
    { diagnosis: 'травма колена', treatment: 'фиксация и обработка' },

];

// Список детей с ID (в реальной системе можно получить из базы)
// В этом скрипте мы будем использовать те же данные, что и в существующем скрипте
const CHILDREN = [
    { id: '645f1b2a3c4d5e6f7a8b9c01', name: 'Иванов Иван Иванович' },
    { id: '645f1b2a3c4d5e6f7a8b9c02', name: 'Петров Петр Петрович' },
    { id: '645f1b2a3c4d5e6f7a8b9c03', name: 'Сидоров Сергей Сергеевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c04', name: 'Козлов Алексей Владимирович' },
    { id: '645f1b2a3c4d5e6f7a8b9c05', name: 'Морозова Анна Сергеевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c06', name: 'Волкова Мария Александровна' },
    { id: '645f1b2a3c4d5e6f7a8b9c07', name: 'Николаев Николай Николаевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c08', name: 'Абрамова Елена Викторовна' },
    { id: '645f1b2a3c4d5e6f7a8b9c09', name: 'Попов Александр Михайлович' },
    { id: '645f1b2a3c4d5e6f7a8b9c10', name: 'Лебедева Ольга Петровна' },
    { id: '645f1b2a3c4d5e6f7a8b9c11', name: 'Смирнов Дмитрий Андреевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c12', name: 'Федорова Татьяна Николаевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c13', name: 'Медведев Артем Сергеевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c14', name: 'Белова Юлия Алексеевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c15', name: 'Степанов Роман Викторович' },
    { id: '645f1b2a3c4d5e6f7a8b9c16', name: 'Соколова Анастасия Игоревна' },
    { id: '645f1b2a3c4d5e6f7a8b9c17', name: 'Орлов Максим Александрович' },
    { id: '645f1b2a3c4d5e6f7a8b9c18', name: 'Кузнецова Екатерина Валерьевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c19', name: 'Дмитриев Игорь Сергеевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c20', name: 'Егорова Виктория Павловна' }
];

// Генерация случайной даты с 1 января 2026 года
function generateRandomDate(): Date {
    const startDate = new Date('2026-01-01');
    const endDate = new Date();

    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime);
}

// Генерация случайного количества записей (2-3 на неделю)
function generateEntriesCount(): number {
    return Math.floor(Math.random() * 2) + 2; // 2 или 3
}

// Генерация случайного диагноза и лечения
function generateDiagnosisAndTreatment(): { diagnosis: string; treatment: string } {
    const randomIndex = Math.floor(Math.random() * DIAGNOSES.length);
    return DIAGNOSES[randomIndex];
}

// Генерация случайного ребенка
function generateChild(children: typeof CHILDREN): { id: string; name: string } {
    const randomIndex = Math.floor(Math.random() * children.length);
    return children[randomIndex];
}

// Генерация одной записи в журнал
function generateJournalEntry(
    children: typeof CHILDREN,
    usedChildren: Set<string>,
    date: Date
): any | null {
    // Проверяем, есть ли еще дети для использования
    const availableChildren = children.filter(child => !usedChildren.has(child.id));

    if (availableChildren.length === 0) {
        return null;
    }

    const child = generateChild(availableChildren);
    usedChildren.add(child.id);

    const { diagnosis, treatment } = generateDiagnosisAndTreatment();

    return {
        childId: child.id,
        date: date,
        diagnosis: diagnosis,
        treatment: treatment,
        notes: `Лечение: ${treatment}`,
        fio: child.name,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// Основная функция генерации записей
async function generateSomaticJournalEntries() {
    console.log('Начинаем генерацию записей в журнал соматической заболеваемости...');
    console.log('Период: с 1 января 2026 года');

    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection('somatic_journals');

        // Очищаем существующие записи (если нужно)
        // await collection.deleteMany({});

        const entries: any[] = [];
        const usedChildren = new Set<string>();

        // Генерируем записи с 1 января 2026 года до сегодняшней даты
        const startDate = new Date('2026-01-01');
        const currentDate = new Date();

        // Пройдемся по каждому дню
        let currentDay = new Date(startDate);

        while (currentDay <= currentDate) {
            // Каждую неделю генерируем 2-3 записи
            const entriesCount = generateEntriesCount();

            for (let i = 0; i < entriesCount; i++) {
                const entry = generateJournalEntry(CHILDREN, usedChildren, currentDay);

                if (entry) {
                    entries.push(entry);
                }
            }

            // Сбрасываем использованных детей каждую неделю
            if (currentDay.getDay() === 6) { // Воскресенье
                usedChildren.clear();
            }

            // Переходим к следующему дню
            currentDay.setDate(currentDay.getDate() + 1);
        }

        // Вставляем все записи в базу данных
        if (entries.length > 0) {
            const result = await collection.insertMany(entries);
            console.log(`Успешно создано ${result.insertedCount} записей в журнале соматической заболеваемости`);
        } else {
            console.log('Не удалось создать ни одной записи');
        }

    } catch (error) {
        console.error('Ошибка при генерации записей:', error);
    } finally {
        await client.close();
    }
}

// Запуск генерации
generateSomaticJournalEntries().catch(console.error);