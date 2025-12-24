import * as xlsx from 'xlsx';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/detsad';

async function importProducts() {
    console.log('🚀 Начинаем импорт продуктов...');

    try {
        console.log('📡 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('База данных не доступна');
        }

        const productsCollection = db.collection('products');

        // Read Excel file
        const excelPath = path.join(__dirname, '../../docs/Полный_список_продуктов.xlsx');
        console.log(`📖 Читаем Excel файл: ${excelPath}`);

        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = xlsx.utils.sheet_to_json(sheet);

        console.log(`📊 Всего строк в файле: ${rows.length}`);

        if (rows.length > 0) {
            console.log('📋 Образец первой строки:', JSON.stringify(rows[0], null, 2));
        }

        // Map Excel columns to Product fields
        const products: any[] = [];

        for (const row of rows) {
            // Excel уже содержит правильные колонки, используем их напрямую
            const name = row['name'] || row['Наименование'] || row['Название'] || '';
            const category = row['category'] || row['Категория'] || 'Прочее';
            const unit = row['unit'] || row['Ед. изм.'] || row['Единица'] || 'шт';
            const supplier = row['supplier'] || row['Поставщик'] || 'Не указан';
            const price = parseFloat(row['price'] || row['Цена'] || 0) || 0;
            const stockQuantity = parseFloat(row['stockQuantity'] || row['Количество'] || 0) || 0;

            // Skip empty rows
            if (name && String(name).trim() && !/^\d+$/.test(String(name).trim())) {
                products.push({
                    name: String(name).trim(),
                    category: String(category).trim() || 'Прочее',
                    unit: String(unit).trim() || 'шт',
                    supplier: String(supplier).trim() || 'Не указан',
                    price: price,
                    stockQuantity: stockQuantity,
                    minStockLevel: 0,
                    maxStockLevel: 1000,
                    status: 'active',
                    childCount: 0,
                    purchaseDays: 0,
                    purchaseDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        console.log(`✅ Подготовлено ${products.length} продуктов для импорта`);

        if (products.length > 0) {
            console.log('📋 Примеры продуктов:');
            products.slice(0, 5).forEach((p, i) => console.log(`  ${i + 1}. ${p.name} [${p.category}] - ${p.unit}`));

            // Insert products
            const result = await productsCollection.insertMany(products);
            console.log(`🎉 Успешно импортировано ${result.insertedCount} продуктов`);
        } else {
            console.log('⚠️ Нет продуктов для импорта');
        }

    } catch (error) {
        console.error('❌ Ошибка импорта:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Отключено от MongoDB');
    }
}

importProducts();
