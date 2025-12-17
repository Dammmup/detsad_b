/**
 * Скрипт для миграции моделей с фабрик на прямой экспорт mongoose.model()
 * Запуск: npx ts-node scripts/remove-model-factories.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ENTITIES_DIR = path.join(__dirname, '..', 'src', 'entities');

// Счётчики
let modelsUpdated = 0;
let servicesUpdated = 0;
let controllersUpdated = 0;

function findTsFiles(dir: string, pattern: string): string[] {
    const files: string[] = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...findTsFiles(fullPath, pattern));
            } else if (entry.isFile() && entry.name === pattern) {
                files.push(fullPath);
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }

    return files;
}

function updateModelFile(filePath: string): boolean {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Проверяем, использует ли файл createModelFactory
    if (!content.includes('createModelFactory')) {
        return false;
    }

    console.log(`\n📝 Processing model: ${path.relative(ENTITIES_DIR, filePath)}`);

    // 1. Удаляем импорт createModelFactory
    content = content.replace(
        /import\s+\{\s*createModelFactory\s*\}\s+from\s+['"][^'"]+['"];\s*\r?\n?/g,
        ''
    );

    // 2. Находим паттерн создания фабрики и заменяем на прямой экспорт
    // Паттерн: const createXxxModel = createModelFactory<IXxx>('Xxx', XxxSchema, 'xxx', 'default|medical|food');
    const factoryPattern = /const\s+create(\w+)Model\s*=\s*createModelFactory<(\w+)>\(\s*'(\w+)',\s*(\w+),\s*'(\w+)',\s*'(default|medical|food)'\s*\);\s*\r?\n?\s*\r?\n?export\s+default\s+create\w+Model;/g;

    content = content.replace(factoryPattern, (match, modelName, interfaceName, mongoModelName, schemaName, collectionName, database) => {
        console.log(`  ✅ Replacing factory for ${mongoModelName} -> mongoose.model()`);
        return `export default mongoose.model<${interfaceName}>('${mongoModelName}', ${schemaName}, '${collectionName}');`;
    });

    // Альтернативный паттерн без 'default|medical|food' в строке
    const factoryPattern2 = /const\s+create(\w+)Model\s*=\s*createModelFactory<(\w+)>\(\s*[\r\n\s]*'(\w+)',[\r\n\s]*(\w+),[\r\n\s]*'(\w+)',[\r\n\s]*'(default|medical|food)'[\r\n\s]*\);[\r\n\s]*export\s+default\s+create\w+Model;/gs;

    content = content.replace(factoryPattern2, (match, modelName, interfaceName, mongoModelName, schemaName, collectionName, database) => {
        console.log(`  ✅ Replacing multiline factory for ${mongoModelName} -> mongoose.model()`);
        return `export default mongoose.model<${interfaceName}>('${mongoModelName}', ${schemaName}, '${collectionName}');`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        modelsUpdated++;
        return true;
    }

    return false;
}

function updateServiceOrControllerFile(filePath: string): boolean {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Находим все импорты моделей и их использование как функции Model()
    // Паттерн: import Model from './model' или '../xxx/model' 
    // Использование: Model().findOne(), new (Model())(), etc.

    // Список возможных имён моделей
    const modelNames = [
        'User', 'Child', 'Children', 'Group', 'Payroll', 'Task', 'Rent', 'Holiday',
        'StaffShift', 'StaffAttendanceTracking', 'ChildAttendance', 'ChildPayment',
        'MainEvent', 'Report', 'Document', 'UIState',
        // Медицинские
        'MedicalJournal', 'SomaticJournal', 'MantouxJournal', 'HelminthJournal',
        'InfectiousDiseasesJournal', 'TubPositiveJournal', 'ContactInfectionJournal',
        'RiskGroupChild', 'HealthPassport', 'ChildHealthPassport',
        // Питание
        'OrganolepticJournal', 'FoodStaffHealth', 'FoodStockLog', 'PerishableBrak',
        'ProductCertificate', 'DetergentLog', 'MenuItem', 'Product'
    ];

    let hasChanges = false;

    for (const modelName of modelNames) {
        // Паттерн: ModelName() -> ModelName
        // Но нужно быть осторожным — не заменять если это часть другого слова

        // 1. ModelName().method() -> ModelName.method()
        const methodCallPattern = new RegExp(`\\b${modelName}\\(\\)\\.`, 'g');
        if (methodCallPattern.test(content)) {
            content = content.replace(methodCallPattern, `${modelName}.`);
            hasChanges = true;
        }

        // 2. new (ModelName())({ -> new ModelName({
        const newPattern = new RegExp(`new\\s*\\(${modelName}\\(\\)\\)\\(`, 'g');
        if (newPattern.test(content)) {
            content = content.replace(newPattern, `new ${modelName}(`);
            hasChanges = true;
        }

        // 3. await ModelName() без метода (редко, но возможно)
        // Пропускаем — это обычно ошибка
    }

    if (hasChanges && content !== originalContent) {
        console.log(`  📝 Updated: ${path.relative(ENTITIES_DIR, filePath)}`);
        fs.writeFileSync(filePath, content, 'utf-8');

        if (filePath.includes('service.ts')) {
            servicesUpdated++;
        } else if (filePath.includes('controller.ts')) {
            controllersUpdated++;
        }
        return true;
    }

    return false;
}

async function main() {
    console.log('🚀 Starting migration from model factories to direct mongoose.model()...\n');

    // 1. Обновляем все model.ts файлы
    console.log('📂 Step 1: Updating model files...');
    const modelFiles = findTsFiles(ENTITIES_DIR, 'model.ts');
    console.log(`Found ${modelFiles.length} model files`);

    for (const file of modelFiles) {
        updateModelFile(file);
    }

    // 2. Обновляем все service.ts файлы
    console.log('\n📂 Step 2: Updating service files...');
    const serviceFiles = findTsFiles(ENTITIES_DIR, 'service.ts');
    console.log(`Found ${serviceFiles.length} service files`);

    for (const file of serviceFiles) {
        updateServiceOrControllerFile(file);
    }

    // 3. Обновляем все controller.ts файлы
    console.log('\n📂 Step 3: Updating controller files...');
    const controllerFiles = findTsFiles(ENTITIES_DIR, 'controller.ts');
    console.log(`Found ${controllerFiles.length} controller files`);

    for (const file of controllerFiles) {
        updateServiceOrControllerFile(file);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration complete!');
    console.log(`   Models updated: ${modelsUpdated}`);
    console.log(`   Services updated: ${servicesUpdated}`);
    console.log(`   Controllers updated: ${controllersUpdated}`);
    console.log('='.repeat(50));

    console.log('\n⚠️  Please run `npx tsc --noEmit` to check for any remaining errors.');
}

main().catch(console.error);
