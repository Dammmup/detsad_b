import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || '';

async function checkPayrolls() {
    await mongoose.connect(MONGO_URI);
    const Payroll = mongoose.connection.collection('payrolls');
    const User = mongoose.connection.collection('users');

    const allPayrolls = await Payroll.find({}).toArray();
    console.log(`Total payroll records: ${allPayrolls.length}`);

    const duplicates: any[] = [];
    const map = new Map();

    for (const p of allPayrolls) {
        const key = `${p.staffId}_${p.period}`;
        if (map.has(key)) {
            duplicates.push(p);
        } else {
            map.set(key, p._id);
        }
    }

    console.log(`Duplicate records found: ${duplicates.length}`);
    for (const d of duplicates.slice(0, 10)) {
        const user = await User.findOne({ _id: d.staffId });
        console.log(`- Duplicate for ${user?.fullName || d.staffId} in period ${d.period}`);
    }

    const periods = [...new Set(allPayrolls.map(p => p.period))].sort();
    console.log(`\nPeriods found: ${periods.join(', ')}`);

    for (const period of periods) {
        const count = allPayrolls.filter(p => p.period === period).length;
        console.log(`  ${period}: ${count} records`);
    }

    const activeUsersCount = await User.countDocuments({ role: { $ne: 'admin' }, active: true });
    console.log(`\nActive non-admin users: ${activeUsersCount}`);

    await mongoose.disconnect();
}

checkPayrolls().catch(console.error);
