
import mongoose from 'mongoose';
import User from './src/entities/users/model';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const user = await User.findOne({ fullName: /Рахия Ирова/ });
    if (user) {
        console.log('User found:');
        console.log('  ID:', user._id);
        console.log('  baseSalary:', (user as any).baseSalary);
        console.log('  baseSalaryType:', (user as any).baseSalaryType);
        console.log('  shiftRate:', (user as any).shiftRate);
    } else {
        console.log('User not found');
    }
    await mongoose.disconnect();
}

check();
