import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function cleanupAttendanceShifts() {
    try {
        console.log('Starting attendance cleanup...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const attendanceCollection = db.collection('staff_attendance_tracking');

        // Находим все записи, где shiftId является ObjectId (старый формат)
        // В новой логике мы будем использовать строки вида staffId_date или вообще не хранить ID
        // Но так как коллекция Shift была удалена/пересоздана, старые ID невалидны.

        const result = await attendanceCollection.updateMany(
            { shiftId: { $exists: true, $type: 'objectId' } },
            { $unset: { shiftId: "" } }
        );

        console.log(`Successfully cleaned up ${result.modifiedCount} attendance records`);
        console.log('Cleanup completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

cleanupAttendanceShifts();
