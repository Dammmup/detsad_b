/**
 * Скрипт для удаления геттеров типа const getModel = () => Model()
 * и замены их прямым использованием Model
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');

let filesUpdated = 0;

function findAllTsFiles(dir: string): string[] {
    const files: string[] = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                files.push(...findAllTsFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
                files.push(fullPath);
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }

    return files;
}

function fixGetterFunctions(filePath: string): boolean {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Паттерны для удаления/замены геттеров
    // const getXxxModel = () => Xxx();
    // const getXxx = () => Xxx();

    const modelNames = [
        'User', 'Child', 'Children', 'Group', 'Payroll', 'Task', 'Rent', 'Holiday',
        'Shift', 'StaffShift', 'StaffAttendanceTracking', 'ChildAttendance', 'ChildPayment',
        'MainEvent', 'Report', 'Document', 'UIState',
        'MedicalJournal', 'SomaticJournal', 'MantouxJournal', 'HelminthJournal',
        'InfectiousDiseasesJournal', 'TubPositiveJournal', 'ContactInfectionJournal',
        'RiskGroupChild', 'RiskGroupChildren', 'HealthPassport', 'ChildHealthPassport',
        'OrganolepticJournal', 'FoodStaffHealth', 'FoodStockLog', 'PerishableBrak',
        'ProductCertificate', 'ProductCertificates', 'DetergentLog', 'MenuItem', 'Product',
        'KindergartenSettings', 'NotificationSettings', 'SecuritySettings', 'GeolocationSettings'
    ];

    for (const modelName of modelNames) {
        // Удаляем строки типа: const getXxxModel = () => Xxx();
        const getterPattern = new RegExp(`const\\s+get${modelName}Model\\s*=\\s*\\(\\)\\s*=>\\s*${modelName}\\(\\);?\\s*\\r?\\n?`, 'g');
        content = content.replace(getterPattern, '');

        // Удаляем строки типа: const getUserModel = () => User();
        const getterPattern2 = new RegExp(`const\\s+get\\w+Model\\s*=\\s*\\(\\)\\s*=>\\s*${modelName}\\(\\);?\\s*\\r?\\n?`, 'g');
        content = content.replace(getterPattern2, '');

        // Заменяем вызовы getXxxModel() на Xxx
        const callPattern = new RegExp(`get${modelName}Model\\(\\)`, 'g');
        content = content.replace(callPattern, modelName);

        // Заменяем присвоения типа XxxModel = createXxxModel()
        const assignPattern = new RegExp(`(\\w+Model)\\s*=\\s*create${modelName}Model\\(\\);?`, 'g');
        content = content.replace(assignPattern, `$1 = ${modelName};`);

        // Заменяем create...Model() на Model
        const createPattern = new RegExp(`create${modelName}Model\\(\\)`, 'g');
        content = content.replace(createPattern, modelName);
    }

    // Специальные случаи
    // getUserModel() -> User
    content = content.replace(/getUserModel\(\)/g, 'User');
    content = content.replace(/getChildModel\(\)/g, 'Child');
    content = content.replace(/getGroupModel\(\)/g, 'Group');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        filesUpdated++;
        return true;
    }

    return false;
}

async function main() {
    console.log('🚀 Removing getter functions...\n');

    const files = findAllTsFiles(SRC_DIR);
    console.log(`Found ${files.length} TypeScript files`);

    for (const file of files) {
        if (fixGetterFunctions(file)) {
            console.log(`  ✅ ${path.relative(SRC_DIR, file)}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Done! Updated ${filesUpdated} files`);
    console.log('='.repeat(50));
}

main().catch(console.error);
