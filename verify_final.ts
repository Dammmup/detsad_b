
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const client = new MongoClient(process.env.MONGO_URI!);
    try {
        await client.connect();
        const db = client.db();
        const payrolls = db.collection('payrolls');
        const users = db.collection('users');

        const user = await users.findOne({ fullName: /Рахия Ирова/ });
        if (user) {
            const payroll = await payrolls.findOne({ staffId: user._id, period: '2026-02' });
            if (payroll) {
                console.log('--- VERIFICATION RESULT ---');
                console.log('FullName:', user.fullName);
                console.log('Accruals:', payroll.accruals);
                console.log('Fines Count:', payroll.fines ? payroll.fines.length : 0);
                console.log('Penalties:', payroll.penalties);
                console.log('WorkedShifts:', payroll.workedShifts);
                console.log('Total:', payroll.total);
                console.log('---------------------------');
            } else {
                console.log('Payroll record not found for Feb 2026');
            }
        }
    } finally {
        await client.close();
    }
}
run();
