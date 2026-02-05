
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Shift from '../src/entities/staffShifts/model';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const staffId = '693f1413cbcaf05d27ffc1fa'; // Роза Лурова
        const datesToFix = ['2026-01-07', '2026-01-26'];

        const shiftDoc = await Shift.findOne({ staffId }) as any;
        if (!shiftDoc) {
            console.log('Shift document not found');
            return;
        }

        let updated = false;
        datesToFix.forEach(dateStr => {
            const shift = shiftDoc.shifts.get(dateStr);
            if (shift) {
                console.log(`Updating shift for ${dateStr}: ${shift.status} -> completed`);
                shift.status = 'completed';
                updated = true;
            } else {
                console.log(`No shift found for ${dateStr}`);
            }
        });

        if (updated) {
            await shiftDoc.save();
            console.log('Changes saved successfully');
        } else {
            console.log('No changes needed');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
