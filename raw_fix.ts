
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI!);
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        const payrolls = db.collection('payrolls');

        const user = await users.findOne({ fullName: /Рахия Ирова/ });
        if (user) {
            console.log('User found:', user.fullName);
            const resUser = await users.updateOne(
                { _id: user._id },
                { $set: { baseSalaryType: 'shift', shiftRate: 9000, baseSalary: 180000 } }
            );
            console.log('Update user result:', resUser.modifiedCount);

            const res = await payrolls.deleteMany({ staffId: user._id, period: '2026-02' });
            console.log(`Deleted ${res.deletedCount} old payroll records for 2026-02`);
        } else {
            console.log('User not found');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}
run();
