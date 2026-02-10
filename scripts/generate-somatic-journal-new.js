const { MongoClient } = require('mongodb');

// Конфигурация подключения к БД
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const DB_NAME = process.env.DB_NAME || 'detsad_db';

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
    { diagnosis: 'грипп', treatment: 'вирусостатическое' },
    { diagnosis: 'ОРВИ', treatment: 'иммуномодулятор' },
    { diagnosis: 'вздутие живота', treatment: 'симптоматическое' },
    { diagnosis: 'повышенная температура', treatment: 'парацетамол' },
    { diagnosis: 'боли в горле', treatment: 'препараты для горла' },
    { diagnosis: 'воспаление легких', treatment: 'антибиотик' }
];

// Генерация случайной даты с 1 января 2026 года
function generateRandomDate() {
    const startDate = new Date('2026-01-01');
    const endDate = new Date();

    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime);
}

// Генерация случайного количества записей (2-3 на неделю)
function generateEntriesCount() {
    return Math.floor(Math.random() * 2) + 2; // 2 или 3
}

// Генерация случайного диагноза и лечения
function generateDiagnosisAndTreatment() {
    const randomIndex = Math.floor(Math.random() * DIAGNOSES.length);
    return DIAGNOSES[randomIndex];
}

// Генерация одной записи в журнал
function generateJournalEntry(children, usedChildren, date) {
    // Проверяем, есть ли еще дети для использования
    const availableChildren = children.filter(child => !usedChildren.has(child._id));

    if (availableChildren.length === 0) {
        return null;
    }

    // Выбираем случайного ребенка из доступных
    const randomChildIndex = Math.floor(Math.random() * availableChildren.length);
    const child = availableChildren[randomChildIndex];
    usedChildren.add(child._id);

    const { diagnosis, treatment } = generateDiagnosisAndTreatment();

    return {
        childId: child._id,
        date: date,
        diagnosis: diagnosis,
        treatment: treatment,
        notes: `Лечение: ${treatment}`,
        fio: child.fio || `${child.firstName} ${child.lastName}`, // Предполагаем структуру данных
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

        // Получаем список детей из коллекции children
        const childrenCollection = db.collection('children');
        const children = await childrenCollection.find({}).toArray();

        if (children.length === 0) {
            console.log('В коллекции children нет записей');
            return;
        }

        const somaticJournalCollection = db.collection('somatic_journals');

        // Очищаем существующие записи (если нужно)
        // await somaticJournalCollection.deleteMany({});

        const entries = [];
        const usedChildren = new Set();

        // Генерируем записи с 1 января 2026 года до сегодняшней даты
        const startDate = new Date('2026-01-01');
        const currentDate = new Date();

        // Пройдемся по каждому дню
        let currentDay = new Date(startDate);

        while (currentDay <= currentDate) {
            // Каждую неделю генерируем 2-3 записи
            const entriesCount = generateEntriesCount();

            for (let i = 0; i < entriesCount; i++) {
                const entry = generateJournalEntry(children, usedChildren, currentDay);

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
            const result = await somaticJournalCollection.insertMany(entries);
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