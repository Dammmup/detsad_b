
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function run() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        const db = client.db();

        const start = new Date('2026-01-06T19:00:00Z');
        const end = new Date('2026-01-07T19:00:00Z');

        const attendance = await db.collection('staff_attendance_tracking').find({
            date: { $gte: start, $lte: end }
        }).toArray();

        // Fetch users for names
        const userIds = attendance.map(r => r.staffId);
        const users = await db.collection('users').find({ _id: { $in: userIds } }).toArray();
        const userMap = new Map(users.map(u => [u._id.toString(), u.fullName]));

        console.log('TODAY_RECORDS:', JSON.stringify(attendance.map(r => ({
            name: userMap.get(r.staffId.toString()) || 'Unknown',
            date: r.date,
            actualStart: r.actualStart,
            actualEnd: r.actualEnd,
            late: r.lateMinutes,
            penalties: r.penalties
        })), null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        process.exit(0);
    }
}

run();
