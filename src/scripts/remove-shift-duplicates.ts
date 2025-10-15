import mongoose from 'mongoose';
import Shift from '../entities/staffShifts/model';
import dotenv from 'dotenv';

dotenv.config();

async function removeDuplicateShifts() {
  try {
    // Подключаемся к базе данных
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ Подключено к MongoDB');

    // Находим все дубликаты смен (несколько смен для одного сотрудника в один день)
    const duplicates = await Shift.aggregate([
      {
        $group: {
          _id: {
            staffId: "$staffId",
            date: "$date"
          },
          count: { $sum: 1 },
          shifts: { $push: "$$ROOT" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`Найдено ${duplicates.length} дней с дублирующимися сменами`);

    let totalRemoved = 0;

    for (const duplicate of duplicates) {
      // Оставляем только первую смену (по дате создания), остальные удаляем
      const shiftsToDelete = duplicate.shifts
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(1); // Берем все, кроме первой (оставляем самую раннюю)

      if (shiftsToDelete.length > 0) {
        const idsToDelete = shiftsToDelete.map((shift: any) => shift._id);
        
        const result = await Shift.deleteMany({
          _id: { $in: idsToDelete }
        });

        console.log(`Удалено ${result.deletedCount} дубликатов для сотрудника ${duplicate._id.staffId} за ${duplicate._id.date}`);
        totalRemoved += result.deletedCount;
      }
    }

    console.log(`\nВсего удалено дубликатов: ${totalRemoved}`);
    console.log('Удаление дубликатов завершено!');

    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Ошибка при удалении дубликатов:', error);
    process.exit(1);
  }
}

// Запускаем функцию
if (require.main === module) {
  removeDuplicateShifts();
}