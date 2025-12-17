import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import Shift from '../src/entities/staffShifts/model';


const updateShiftsStartTime = async () => {
    try {
        console.log('Начинаем подключение к базе данных...');


        await connectDB();


        const dbConnection = mongoose.connection;

        console.log('Подключение к базе данных установлено');





        const totalCount = await Shift.countDocuments();
        console.log(`Всего записей в коллекции shifts: ${totalCount}`);


        const result = await Shift.updateMany(
            {},
            { $set: { startTime: '08:00' } }
        );

        console.log(`Обновлено ${result.modifiedCount} записей`);
        console.log(`Соответствует ${result.matchedCount} записям`);


        if (result.modifiedCount === 0 && result.matchedCount > 0) {
            console.log('Все записи уже имеют значение startTime = 08:00');
        } else if (result.modifiedCount > 0) {
            console.log(`Успешно обновлены записи с startTime на 08:00`);
        } else {
            console.log('Нет записей для обновления');
        }


        await dbConnection.close();
        console.log('Соединение с базой данных закрыто');

    } catch (error) {
        console.error('Ошибка при обновлении записей:', error);
        process.exit(1);
    }
};


if (require.main === module) {
    updateShiftsStartTime();
}

export { updateShiftsStartTime };