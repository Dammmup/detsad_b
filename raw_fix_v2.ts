
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log('--- STARTING FIX SCRIPT ---');
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not defined in environment');
        return;
    }

    const client = new MongoClient(process.env.MONGO_URI);
    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        console.log('Connected.');
        const db = client.db();
        const users = db.collection('users');
        const payrolls = db.collection('payrolls');

        // Check if user exists first
        const user = await users.findOne({ fullName: /Рахия Ирова/ });
        if (user) {
            console.log('User found:', user.fullName, 'ID:', user._id);
            console.log('Current settings:', {
                baseSalaryType: user.baseSalaryType,
                shiftRate: user.shiftRate,
                baseSalary: user.baseSalary
            });

            const resUser = await users.updateOne(
                { _id: user._id },
                { $set: { baseSalaryType: 'shift', shiftRate: 9000, baseSalary: 180000 } }
            );
            console.log('Update user result (modifiedCount):', resUser.modifiedCount);

            const res = await payrolls.deleteMany({ staffId: user._id, period: '2026-02' });
            console.log(`Deleted ${res.deletedCount} old payroll records for 2026-02`);
        } else {
            console.log('User NOT found by name /Рахия Ирова/');
        }
    } catch (err: any) {
        console.error('CRITICAL ERROR DURING FIX:');
        console.error(err.message);
        console.error(err.stack);
    } finally {
        await client.close();
        console.log('--- FIX SCRIPT FINISHED ---');
    }
}

run().catch(e => {
    console.error('TOP LEVEL UNHANDLED ERROR:');
    console.error(e);
});
