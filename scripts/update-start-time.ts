import mongoose from 'mongoose';
import { connectDatabases, getConnection } from '../src/config/database';
import Shift from '../src/entities/staffShifts/model';

// Основная функция для обновления времени начала смен
const updateShiftsStartTime = async () => {
    try {
        console.log('Начинаем подключение к базе данных...');

        // Подключаемся ко всем базам данных
        await connectDatabases();

        // Получаем подключение к основной базе данных
        const dbConnection = getConnection('default');

        console.log('Подключение к базе данных установлено');

        // Создаем модель с использованием полученного подключения
        const ShiftModel = Shift(); // Вызываем функцию для получения модели

        console.log('Получили модель смен');

        // Сначала проверим количество записей
        const totalCount = await ShiftModel.countDocuments();
        console.log(`Всего записей в коллекции shifts: ${totalCount}`);

        // Находим все записи в коллекции shifts и обновляем поле startTime
        const result = await ShiftModel.updateMany(
            {}, // Все документы
            { $set: { startTime: '08:00' } } // Устанавливаем значение на 08:00
        );

        console.log(`Обновлено ${result.modifiedCount} записей`);
        console.log(`Соответствует ${result.matchedCount} записям`);

        // Проверим, были ли обновлены записи
        if (result.modifiedCount === 0 && result.matchedCount > 0) {
            console.log('Все записи уже имеют значение startTime = 08:00');
        } else if (result.modifiedCount > 0) {
            console.log(`Успешно обновлены записи с startTime на 08:00`);
        } else {
            console.log('Нет записей для обновления');
        }

        // Закрываем соединение с базой данных
        await dbConnection.close();
        console.log('Соединение с базой данных закрыто');

    } catch (error) {
        console.error('Ошибка при обновлении записей:', error);
        process.exit(1);
    }
};

// Запускаем скрипт
if (require.main === module) {
    updateShiftsStartTime();
}

export { updateShiftsStartTime };