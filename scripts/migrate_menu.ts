
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Product, { IProduct } from '../src/entities/food/products/model';
import Dish from '../src/entities/food/dishes/model';
import { Recipes } from './recipes';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

interface IMenuItem {
    name: string;
    category: string;
    weight: string;
}

const mapCategory = (cat: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const map: Record<string, string> = {
        'завтрак': 'breakfast',
        'обед': 'lunch',
        'ужин': 'dinner',
        'перекус': 'snack',
        'полдник': 'snack'
    };
    return (map[cat.toLowerCase()] || 'lunch') as 'breakfast' | 'lunch' | 'dinner' | 'snack';
};

const mapWeight = (weightStr: string): number => {
    // "150/180" -> take max 180, or average? Let's take first value for base recipe
    // The user requested "grammage specified in the document".
    // The recipe usually defines 1 serving.
    // If weight is "150/180", it usually means for younger/older groups.
    // We will store the recipe for 1 serving (approx 150g or 100g base).
    // Let's parse the first number.
    const parts = weightStr.split('/');
    return parseInt(parts[0]) || 150;
};

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const jsonPath = path.join(__dirname, '../docs/menu_full_strict_unique_names.json');
        const fileContent = fs.readFileSync(jsonPath, 'utf-8');
        const menuItems: IMenuItem[] = JSON.parse(fileContent);


        // Find a valid user for createdBy
        const User = mongoose.model('User', new mongoose.Schema({ role: String }));
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.warn('No admin user found. Trying to find any user...');
            admin = await User.findOne({});
        }

        if (!admin) {
            console.error('No users found in database. Cannot create dishes without a creator.');
            process.exit(1);
        }

        const createdBy = admin._id;
        console.log(`Using User ID ${createdBy} for createdBy field.`);

        console.log(`Starting migration of ${menuItems.length} dishes...`);

        for (const item of menuItems) {
            // 1. Check if dish exists
            const existingDish = await Dish.findOne({ name: item.name });
            if (existingDish) {
                console.log(`Skipping existing dish: ${item.name}`);
                continue;
            }

            // 2. Find recipe
            const recipeIngredients = Recipes[item.name];

            const dbIngredients = [];
            let totalWeight = 0;

            if (recipeIngredients) {
                for (const ing of recipeIngredients) {
                    // Find or create product
                    let product = await Product.findOne({ name: { $regex: new RegExp(`^${ing.name}$`, 'i') } });

                    if (!product) {
                        try {
                            const newProductData: any = {
                                name: ing.name,
                                category: ing.category || 'Прочее',
                                unit: ing.unit,
                                price: 0, // Default
                                stockQuantity: 1000,
                                minStockLevel: 10,
                                maxStockLevel: 5000,
                                status: 'active',
                                purchaseDays: 7,
                                // createdBy removed as it's not in schema
                                description: 'Автоматически создан при миграции меню'
                            };

                            product = await Product.create(newProductData);
                            console.log(`  + Created new product: ${ing.name}`);
                        } catch (e: any) {
                            console.error(`  ! Failed to create product ${ing.name}: ${e.message}`);
                            continue;
                        }
                    }

                    dbIngredients.push({
                        productId: product._id,
                        quantity: ing.quantity,
                        unit: ing.unit
                    });

                    // Simple weight estim (assuming g/ml ~ g)
                    if (['г', 'мл'].includes(ing.unit)) {
                        totalWeight += ing.quantity;
                    }
                }
            } else {
                console.warn(`[WARNING] No recipe found for: ${item.name}. Creating without ingredients.`);
            }

            // Create Dish
            try {
                await Dish.create({
                    name: item.name,
                    category: mapCategory(item.category),
                    ingredients: dbIngredients,
                    servingsCount: 1,
                    isActive: true,
                    createdBy: createdBy,
                    description: `Вес из меню: ${item.weight}. Импортировано автоматически.`
                });
                console.log(`+ Created dish: ${item.name} (${dbIngredients.length} ingredients)`);
            } catch (e: any) {
                console.error(`! Failed to create dish ${item.name}: ${e.message}`);
            }
        }

        console.log('Migration completed.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
