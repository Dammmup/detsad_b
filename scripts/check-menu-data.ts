import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function checkData() {
    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://damir:damir@cluster0.ku60i6n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const WeeklyMenuTemplate = mongoose.connection.collection('weekly_menu_templates');
        const activeTemplates = await WeeklyMenuTemplate.find({ isActive: true }).toArray();

        console.log(`Found ${activeTemplates.length} active templates`);
        activeTemplates.forEach(t => {
            console.log(`Template: ${t.name}, ID: ${t._id}`);
            const daysWithDishes = Object.keys(t.days).filter(day => {
                const meals = t.days[day];
                return meals.breakfast?.length > 0 || meals.lunch?.length > 0 || meals.snack?.length > 0 || meals.dinner?.length > 0;
            });
            console.log(`  Days with dishes: ${daysWithDishes.join(', ')}`);
        });

        const DailyMenu = mongoose.connection.collection('daily_menus');
        const dailyMenus = await DailyMenu.find({}).toArray();
        console.log(`Total daily menus: ${dailyMenus.length}`);
        dailyMenus.forEach(m => {
            console.log(`Daily Menu: ${m.date}`);
        });

        const DishQuality = mongoose.connection.collection('dishqualityassessments');
        const totalDishQualities = await DishQuality.countDocuments();
        console.log(`Total dish quality records: ${totalDishQualities}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkData();
