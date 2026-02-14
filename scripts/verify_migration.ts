
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Dish from '../src/entities/food/dishes/model';
import Product from '../src/entities/food/products/model';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

const verify = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const dishCount = await Dish.countDocuments();
        const productCount = await Product.countDocuments();
        const dishesWithIngredients = await Dish.countDocuments({ 'ingredients.0': { $exists: true } });

        console.log(`Total Dishes: ${dishCount}`);
        console.log(`Dishes with Ingredients: ${dishesWithIngredients}`);
        console.log(`Total Products: ${productCount}`);

        // List a few recent dishes
        const recentDishes = await Dish.find().sort({ createdAt: -1 }).limit(5).select('name ingredients');
        console.log('Recent Dishes:', JSON.stringify(recentDishes, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verify();
