
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Dish from '../src/entities/food/dishes/model';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

const classify = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const dishes = await Dish.find({});
        console.log(`Found ${dishes.length} dishes to classify.`);

        let updatedCount = 0;

        for (const dish of dishes) {
            const name = dish.name.toLowerCase();
            let subcategory = 'other';

            if (name.includes('суп') || name.includes('борщ') || name.includes('щи ') || name.includes('рассольник') || name.includes('солянка') || name.includes('свекольник') || name.includes('бульон') || name.includes('мампар')) {
                subcategory = 'soup';
            } else if (name.includes('каша') || name.includes('геркулес')) {
                subcategory = 'porridge';
            } else if (name.includes('чай') || name.includes('компот') || name.includes('какао') || name.includes('кисель') || name.includes('напиток') || name.includes('сок') || name.includes('молоко') || name.includes('кефир') || name.includes('ряженка') || name.includes('йогурт')) {
                subcategory = 'drink';
            } else if (name.includes('салат') || name.includes('винегрет') || name.includes('икра') || name.includes('овощи')) {
                // Check if it's a side dish or main though. "Овощное рагу" is main/garnish. 
                // "Салат" is salad.
                if (name.includes('рагу')) {
                    subcategory = 'main';
                } else {
                    subcategory = 'salad';
                }
            } else if (name.includes('хлеб') || name.includes('батон') || name.includes('булочка') || name.includes('пирог') || name.includes('печенье') || name.includes('пряник') || name.includes('сушки') || name.includes('ватрушка')) {
                subcategory = 'baking';
            } else if (name.includes('пюре') || name.includes('макароны') || name.includes('рис ') || name.includes('гречка')) {
                // Check if it's "plov" (main) or just garnish
                if (name.includes('плов')) {
                    subcategory = 'main';
                } else if (name.includes('котлета') || name.includes('тефтели')) {
                    // Usually main dish names like "Macaroni with cutlet" - but here names are usually specific.
                    // If name is just "Rice boiled", it's garnish.
                    subcategory = 'garnish';
                } else {
                    subcategory = 'garnish';
                }
            } else {
                // Default to main for everything else (Cutlets, Goulash, Fish, Meat, Casserole/Zapekanka)
                subcategory = 'main';
            }

            // Refinements
            if (name.includes('запеканка')) subcategory = 'main'; // Or baking? Usually main in kindergarten (cottage cheese cass)
            if (name.includes('омлет')) subcategory = 'main';

            if (dish.subcategory !== subcategory) {
                // console.log(`Updating "${dish.name}": ${dish.subcategory} -> ${subcategory}`);
                dish.subcategory = subcategory as any;
                await dish.save();
                updatedCount++;
            }
        }

        console.log(`Classified ${updatedCount} dishes.`);
        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

classify();
