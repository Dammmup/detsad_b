
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const User = mongoose.model('User');
    const user = await User.findOne({ fullName: /Рахия Ирова/ });
    if (user) {
        console.log('User found, updating...');
        user.set('baseSalaryType', 'shift');
        user.set('shiftRate', 9000);
        await user.save();
        console.log('Update successful');
    } else {
        console.log('User not found');
    }
    await mongoose.disconnect();
}
run();
