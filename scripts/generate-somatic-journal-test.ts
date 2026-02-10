// Тестовый скрипт для генерации записей без подключения к БД
// Этот скрипт демонстрирует логику работы без реального подключения к MongoDB

// Список диагнозов и соответствующих лекарств
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

// Список детей (в реальной системе получается из коллекции children)
const CHILDREN = [
    { id: '645f1b2a3c4d5e6f7a8b9c01', fullName: 'Иванов Иван Иванович' },
    { id: '645f1b2a3c4d5e6f7a8b9c02', fullName: 'Петров Петр Петрович' },
    { id: '645f1b2a3c4d5e6f7a8b9c03', fullName: 'Сидоров Сергей Сергеевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c04', fullName: 'Козлов Алексей Владимирович' },
    { id: '645f1b2a3c4d5e6f7a8b9c05', fullName: 'Морозова Анна Сергеевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c06', fullName: 'Волкова Мария Александровна' },
    { id: '645f1b2a3c4d5e6f7a8b9c07', fullName: 'Николаев Николай Николаевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c08', fullName: 'Абрамова Елена Викторовна' },
    { id: '645f1b2a3c4d5e6f7a8b9c09', fullName: 'Попов Александр Михайлович' },
    { id: '645f1b2a3c4d5e6f7a8b9c10', fullName: 'Лебедева Ольга Петровна' },
    { id: '645f1b2a3c4d5e6f7a8b9c11', fullName: 'Смирнов Дмитрий Андреевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c12', fullName: 'Федорова Татьяна Николаевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c13', fullName: 'Медведев Артем Сергеевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c14', fullName: 'Белова Юлия Алексеевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c15', fullName: 'Степанов Роман Викторович' },
    { id: '645f1b2a3c4d5e6f7a8b9c16', fullName: 'Соколова Анастасия Игоревна' },
    { id: '645f1b2a3c4d5e6f7a8b9c17', fullName: 'Орлов Максим Александрович' },
    { id: '645f1b2a3c4d5e6f7a8b9c18', fullName: 'Кузнецова Екатерина Валерьевна' },
    { id: '645f1b2a3c4d5e6f7a8b9c19', fullName: 'Дмитриев Игорь Сергеевич' },
    { id: '645f1b2a3c4d5e6f7a8b9c20', fullName: 'Егорова Виктория Павловна' }
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
function generateChild(children: typeof CHILDREN): { id: string; fullName: string } {
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
        fio: child.fullName,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// Основная функция генерации записей
function generateSomaticJournalEntries() {
    console.log('Начинаем генерацию записей в журнал соматической заболеваемости...');

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

    console.log(`Сгенерировано ${entries.length} записей в журнале соматической заболеваемости`);

    // Выводим первые 5 записей для примера
    console.log('\nПервые 5 записей:');
    entries.slice(0, 5).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.fio} - ${entry.diagnosis} (${entry.treatment})`);
    });

    return entries;
}

// Запуск генерации
const generatedEntries = generateSomaticJournalEntries();

export { generatedEntries };