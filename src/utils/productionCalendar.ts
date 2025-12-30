/**
 * Казахстанский производственный календарь.
 * Содержит список праздничных и выходных дней.
 */

// Список праздников в формате MM-DD (Месяц-День)
// Если праздник падает на выходной, он может переноситься.
// Здесь мы будем хранить точные даты НЕРАБОЧИХ дней (включая переносы).



export const HOLIDAYS_2025 = [
    '2025-01-01', // Новый год
    '2025-01-02', // Новый год
    '2025-01-07', // Рождество Христово
    '2025-03-08', // Международный женский день
    '2025-03-21', // Наурыз мейрамы
    '2025-03-22', // Наурыз мейрамы
    '2025-03-23', // Наурыз мейрамы
    '2025-03-24', // Выходной (перенос)
    '2025-03-25', // Выходной (перенос)
    '2025-05-01', // Праздник единства народа Казахстана
    '2025-05-07', // День защитника Отечества
    '2025-05-09', // День Победы
    '2025-06-06', // Курбан-айт (ориентировочно, нужно уточнять даты каждый год)
    '2025-07-06', // День Столицы
    '2025-07-07', // Выходной (перенос)
    '2025-08-30', // День Конституции
    '2025-10-25', // День Республики
    '2025-10-25', // День Республики
    // '2025-12-16', // День Независимости (Treating as working/paid for divisor calculation per user text)
];
export const HOLIDAYS_2026 = [
    '2026-01-01', // Новый год
    '2026-01-02', // Новый год
    '2026-01-07', // Рождество Христово
    '2026-03-08', // Международный женский день
    '2026-03-21', // Наурыз мейрамы
    '2026-03-22', // Наурыз мейрамы
    '2026-03-23', // Наурыз мейрамы
    '2026-03-24', // Выходной (перенос)
    '2026-03-25', // Выходной (перенос)
    '2026-05-01', // Праздник единства народа Казахстана
    '2026-05-07', // День защитника Отечества
    '2026-05-09', // День Победы
    '2026-06-06', // Курбан-айт (ориентировочно, нужно уточнять даты каждый год)
    '2026-07-06', // День Столицы
    '2026-07-07', // Выходной (перенос)
    '2026-08-30', // День Конституции
    '2026-10-25', // День Республики
    '2026-12-16', // День Независимости
];



// Перенесенные рабочие дни (субботы, ставшие рабочими)
// Формат: YYYY-MM-DD
export const WORKING_SATURDAYS_2024: string[] = [
    // Пример: '2024-05-04'
];

export const WORKING_SATURDAYS_2025: string[] = [
    '2025-01-04', // Пример переноса (нужно уточнить по официальному календарю) - для простоты пока оставим пустым, если нет точных данных
];


const getHolidaysForYear = (year: number): string[] => {
    if (year === 2025) return HOLIDAYS_2025;
    if (year === 2026) return HOLIDAYS_2026;
    return [];
};

const getWorkingSaturdaysForYear = (year: number): string[] => {
    if (year === 2025) return WORKING_SATURDAYS_2025;
    return [];
}

/**
 * Проверяет, является ли день выходным или праздничным в Казахстане.
 * @param date Дата для проверки
 * @returns true, если день нерабочий (выходной или праздник)
 */
export const isNonWorkingDay = (date: Date): boolean => {
    const year = date.getFullYear();
    const dateString = date.toISOString().split('T')[0];

    const holidays = getHolidaysForYear(year);
    const workingSaturdays = getWorkingSaturdaysForYear(year);

    // Если это рабочий перенесенный день (обычно суббота), то это НЕ выходной
    if (workingSaturdays.includes(dateString)) {
        return false;
    }

    // Если это праздничный день
    if (holidays.includes(dateString)) {
        return true;
    }

    const dayOfWeek = date.getDay();
    // По умолчанию суббота (6) и воскресенье (0) - выходные
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return true;
    }

    return false;
};

/**
 * Возвращает количество рабочих дней в месяце согласно производственному календарю РК
 */
export const getProductionWorkingDays = (year: number, month: number): number => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // Важно: создаем дату в локальном часовом поясе или UTC, 
        // но здесь мы просто строим даты. 
        // Осторожно с timezone, но для count working days обычно не критично, если часы 00:00
        // Лучше использовать строку YYYY-MM-DD для надежности.
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const checkDate = new Date(dateString);

        if (!isNonWorkingDay(checkDate)) {
            workingDays++;
        }
    }
    return workingDays;
}

/**
 * Возвращает количество будних дней (Пн-Пт) в месяце, игнорируя праздники.
 * Используется для расчета нормы оклада в некоторых случаях (например, 23 дня в Декабре 2025).
 */
export const getWeekdaysInMonth = (year: number, month: number): number => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let weekdays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            weekdays++;
        }
    }
    return weekdays;
}
