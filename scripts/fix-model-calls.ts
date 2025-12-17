/**
 * Скрипт для замены Model() на Model во всех .ts файлах
 * Запуск: npx ts-node scripts/fix-model-calls.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');

let filesUpdated = 0;
let totalReplacements = 0;

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

function fixModelCalls(filePath: string): number {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let replacements = 0;

    // Список всех моделей
    const modelNames = [
        'User', 'Child', 'Children', 'Group', 'Payroll', 'Task', 'Rent', 'Holiday',
        'Shift', 'StaffShift', 'StaffAttendanceTracking', 'ChildAttendance', 'ChildPayment',
        'MainEvent', 'Report', 'Document', 'UIState',
        // Медицинские
        'MedicalJournal', 'SomaticJournal', 'MantouxJournal', 'HelminthJournal',
        'InfectiousDiseasesJournal', 'TubPositiveJournal', 'ContactInfectionJournal',
        'RiskGroupChild', 'RiskGroupChildren', 'HealthPassport', 'ChildHealthPassport',
        // Питание
        'OrganolepticJournal', 'FoodStaffHealth', 'FoodStockLog', 'PerishableBrak',
        'ProductCertificate', 'ProductCertificates', 'DetergentLog', 'MenuItem', 'Product',
        // Другие
        'KindergartenSettings', 'NotificationSettings', 'SecuritySettings', 'GeolocationSettings'
    ];

    for (const modelName of modelNames) {
        // 1. ModelName().method() -> ModelName.method()
        const methodPattern = new RegExp(`\\b${modelName}\\(\\)\\.`, 'g');
        const methodMatches = content.match(methodPattern);
        if (methodMatches) {
            content = content.replace(methodPattern, `${modelName}.`);
            replacements += methodMatches.length;
        }

        // 2. new (ModelName())({ -> new ModelName({
        const newPattern = new RegExp(`new\\s*\\(${modelName}\\(\\)\\)\\(`, 'g');
        const newMatches = content.match(newPattern);
        if (newMatches) {
            content = content.replace(newPattern, `new ${modelName}(`);
            replacements += newMatches.length;
        }

        // 3. await ModelName() (standalone, обычно ошибка)
        // Пропускаем

        // 4. = ModelName() - присвоение результата вызова
        const assignPattern = new RegExp(`=\\s*${modelName}\\(\\)(?!\\.)`, 'g');
        const assignMatches = content.match(assignPattern);
        if (assignMatches) {
            content = content.replace(assignPattern, `= ${modelName}`);
            replacements += assignMatches.length;
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        filesUpdated++;
        return replacements;
    }

    return 0;
}

async function main() {
    console.log('🚀 Fixing remaining Model() calls...\n');

    const files = findAllTsFiles(SRC_DIR);
    console.log(`Found ${files.length} TypeScript files`);

    for (const file of files) {
        const replacements = fixModelCalls(file);
        if (replacements > 0) {
            console.log(`  ✅ ${path.relative(SRC_DIR, file)}: ${replacements} replacements`);
            totalReplacements += replacements;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Done! Updated ${filesUpdated} files with ${totalReplacements} replacements`);
    console.log('='.repeat(50));
}

main().catch(console.error);
