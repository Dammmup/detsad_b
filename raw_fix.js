
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const users = db.collection('users');
        const payrolls = db.collection('payrolls');

        const user = await users.findOne({ fullName: /Рахия Ирова/ });
        if (user) {
            console.log('User found:', user.fullName);
            await users.updateOne(
                { _id: user._id },
                { $set: { baseSalaryType: 'shift', shiftRate: 9000 } }
            );
            console.log('User settings updated to shift/9000');

            const res = await payrolls.deleteMany({ staffId: user._id, period: '2026-02' });
            console.log(`Deleted ${res.deletedCount} old payroll records for 2026-02`);
        } else {
            console.log('User not found');
        }
    } finally {
        await client.close();
    }
}
run();
