const mongoose = require('mongoose');

const uri = 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const STAFF_ID = '693f1413cbcaf05d27ffc1fb';

async function debugAttendance() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB: det_sad');

        const db = mongoose.connection.db;

        // 1. Проверяем сотрудника
        const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(STAFF_ID) });
        console.log('\n--- Employee Info ---');
        console.log('Name:', user ? user.fullName : 'NOT FOUND');
        console.log('ID:', STAFF_ID);

        // 2. Ищем записи посещаемости за сегодня (по времени Алматы - это 7 января)
        const targetDate = new Date();
        targetDate.setUTCHours(0, 0, 0, 0); // Начало суток UTC

        // В БД даты хранятся в 00:00:00 Алматы.
        // Попробуем найти все записи за последние 24 часа для надежности
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        console.log('\n--- Attendance Records (Recent) ---');
        const attendance = await db.collection('staff_attendance_tracking')
            .find({
                staffId: {
                    $in: [new mongoose.Types.ObjectId(STAFF_ID), STAFF_ID]
                }
            })
            .sort({ date: -1 })
            .limit(10)
            .toArray();

        if (attendance.length === 0) {
            console.log('No attendance records found for this staff ID.');
        } else {
            attendance.forEach(rec => {
                console.log(`- Date: ${rec.date.toISOString()}, In: ${rec.actualStart || '-'}, Out: ${rec.actualEnd || '-'}, CreatedAt: ${rec.createdAt}`);
            });
        }

        // 3. Проверяем последние записи в коллекции вообще (чтобы понять, пишутся ли они сейчас)
        console.log('\n--- Last 3 Global Attendance Records ---');
        const globalLast = await db.collection('staff_attendance_tracking')
            .find({})
            .sort({ createdAt: -1 })
            .limit(3)
            .toArray();

        globalLast.forEach(rec => {
            console.log(`- StaffID: ${rec.staffId}, Date: ${rec.date.toISOString()}, In: ${rec.actualStart}, CreatedAt: ${rec.createdAt}`);
        });

        // 4. Проверяем наличие смен (shifts)
        console.log('\n--- Shift Data (Staff Schedule) ---');
        const shift = await db.collection('staff_shifts')
            .findOne({
                staffId: STAFF_ID,
                date: { $regex: '2026-01-07' }
            });
        console.log('Shift for 2026-01-07:', shift ? 'FOUND' : 'NOT FOUND');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

debugAttendance();
