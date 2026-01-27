import mongoose from 'mongoose';
import User from '../src/entities/users/model';

async function addAllowToSeePayrollField() {
    try {
        // Подключение к базе данных
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

        console.log('Подключение к базе данных установлено');

        // Обновление всех пользователей, добавляя поле allowToSeePayroll со значением false по умолчанию
        const result = await User.updateMany(
            { allowToSeePayroll: { $exists: false } }, // Находим пользователей, у которых нет этого поля
            { $set: { allowToSeePayroll: false } } // Устанавливаем значение false по умолчанию
        );

        console.log(`Обновлено документов: ${result.modifiedCount}`);

        // Закрытие соединения
        await mongoose.connection.close();
        console.log('Соединение с базой данных закрыто');
    } catch (error) {
        console.error('Ошибка при выполнении миграции:', error);
        process.exit(1);
    }
}

// Запуск миграции
addAllowToSeePayrollField();