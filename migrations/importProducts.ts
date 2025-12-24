import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import * as path from 'path';
import Product from '../src/entities/food/products/model';
import dotenv from 'dotenv';

dotenv.config();

async function importProducts() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/detsad';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Read Excel file
        const filePath = path.join(__dirname, '../docs/Полный_список_продуктов.xlsx');
        const workbook = XLSX.readFile(filePath);

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log(`Found ${data.length} rows in Excel file`);
        console.log('First row sample:', data[0]);

        // Map Excel columns to Product fields
        const products: any[] = [];

        for (const row of data as any[]) {
            // Try to map common column names
            const product = {
                name: row['Наименование'] || row['Название'] || row['Name'] || row['name'] || '',
                category: row['Категория'] || row['Category'] || row['category'] || 'Прочее',
                unit: row['Ед. изм.'] || row['Единица'] || row['Unit'] || row['unit'] || 'шт',
                supplier: row['Поставщик'] || row['Supplier'] || row['supplier'] || 'Не указан',
                price: parseFloat(row['Цена'] || row['Price'] || row['price'] || 0) || 0,
                stockQuantity: parseFloat(row['Количество'] || row['Остаток'] || row['Stock'] || row['stockQuantity'] || 0) || 0,
                minStockLevel: parseFloat(row['Мин. остаток'] || row['minStockLevel'] || 0) || 0,
                maxStockLevel: parseFloat(row['Макс. остаток'] || row['maxStockLevel'] || 1000) || 1000,
                status: 'active' as const,
                childCount: 0,
                purchaseDays: 0,
                purchaseDate: new Date()
            };

            // Skip empty rows
            if (product.name && product.name.trim()) {
                products.push(product);
            }
        }

        console.log(`Prepared ${products.length} products for import`);

        if (products.length > 0) {
            // Clear existing products if needed (optional)
            // await Product.deleteMany({});
            // console.log('Cleared existing products');

            // Insert products
            const result = await Product.insertMany(products, { ordered: false });
            console.log(`Successfully imported ${result.length} products`);
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error importing products:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

importProducts();
