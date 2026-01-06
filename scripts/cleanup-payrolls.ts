import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || '';

async function cleanup() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Payroll = mongoose.connection.collection('payrolls');
    const User = mongoose.connection.collection('users');

    // 1. Find all admins and non-active users
    const invalidUsers = await User.find({
        $or: [
            { role: 'admin' },
            { active: false }
        ]
    }).toArray();

    const invalidUserIds = invalidUsers.map(u => u._id);
    console.log(`Found ${invalidUserIds.length} invalid users (admins or inactive)`);

    // 2. Delete payroll records for these users
    const deleteResult = await Payroll.deleteMany({
        staffId: { $in: invalidUserIds }
    });
    console.log(`Deleted ${deleteResult.deletedCount} payroll records for invalid users`);

    // 3. Find truly orphaned records (staffId doesn't exist anymore)
    const allPayrolls = await Payroll.find({}).toArray();
    const orphanedIds = [];
    for (const p of allPayrolls) {
        if (p.staffId) {
            const staffExists = await User.findOne({ _id: p.staffId });
            if (!staffExists) {
                orphanedIds.push(p._id);
            }
        } else {
            orphanedIds.push(p._id);
        }
    }

    if (orphanedIds.length > 0) {
        const orphanedDelete = await Payroll.deleteMany({ _id: { $in: orphanedIds } });
        console.log(`Deleted ${orphanedDelete.deletedCount} orphaned payroll records`);
    }

    await mongoose.disconnect();
}

cleanup().catch(console.error);
