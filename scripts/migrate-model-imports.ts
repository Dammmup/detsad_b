/**
 * Скрипт для миграции вызовов фабрик моделей на централизованные геттеры
 * Запуск: npx ts-node scripts/migrate-model-imports.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');

// Маппинг: имя импорта фабрики -> имя функции геттера
const MODEL_MAPPINGS: Record<string, { factory: string; getter: string; registryName: string }> = {
    'Task': { factory: 'Task', getter: 'getTaskListModel', registryName: 'TaskList' },
    'User': { factory: 'User', getter: 'getUserModel', registryName: 'User' },
    'Child': { factory: 'Child', getter: 'getChildModel', registryName: 'Child' },
    'Children': { factory: 'Children', getter: 'getChildModel', registryName: 'Child' },
    'Group': { factory: 'Group', getter: 'getGroupModel', registryName: 'Group' },
    'Payroll': { factory: 'Payroll', getter: 'getPayrollModel', registryName: 'Payroll' },
    'Rent': { factory: 'Rent', getter: 'getRentModel', registryName: 'Rent' },
    'StaffShift': { factory: 'StaffShift', getter: 'getStaffShiftModel', registryName: 'StaffShift' },
    'StaffAttendanceTracking': { factory: 'StaffAttendanceTracking', getter: 'getStaffAttendanceTrackingModel', registryName: 'StaffAttendanceTracking' },
    'ChildAttendance': { factory: 'ChildAttendance', getter: 'getChildAttendanceModel', registryName: 'ChildAttendance' },
    'ChildPayment': { factory: 'ChildPayment', getter: 'getChildPaymentModel', registryName: 'ChildPayment' },
    'MainEvent': { factory: 'MainEvent', getter: 'getMainEventModel', registryName: 'MainEvent' },
    'Report': { factory: 'Report', getter: 'getReportModel', registryName: 'Report' },
    'Document': { factory: 'Document', getter: 'getDocumentModel', registryName: 'Document' },
    'Holiday': { factory: 'Holiday', getter: 'getHolidayModel', registryName: 'Holiday' },
    // Медицинские
    'MedicalJournal': { factory: 'MedicalJournal', getter: 'getMedicalJournalModel', registryName: 'MedicalJournal' },
    'SomaticJournal': { factory: 'SomaticJournal', getter: 'getSomaticJournalModel', registryName: 'SomaticJournal' },
    'MantouxJournal': { factory: 'MantouxJournal', getter: 'getMantouxJournalModel', registryName: 'MantouxJournal' },
    'HelminthJournal': { factory: 'HelminthJournal', getter: 'getHelminthJournalModel', registryName: 'HelminthJournal' },
    'InfectiousDiseasesJournal': { factory: 'InfectiousDiseasesJournal', getter: 'getInfectiousDiseasesJournalModel', registryName: 'InfectiousDiseasesJournal' },
    'TubPositiveJournal': { factory: 'TubPositiveJournal', getter: 'getTubPositiveJournalModel', registryName: 'TubPositiveJournal' },
    'ContactInfectionJournal': { factory: 'ContactInfectionJournal', getter: 'getContactInfectionJournalModel', registryName: 'ContactInfectionJournal' },
    'RiskGroupChild': { factory: 'RiskGroupChild', getter: 'getRiskGroupChildModel', registryName: 'RiskGroupChild' },
    'HealthPassport': { factory: 'HealthPassport', getter: 'getHealthPassportModel', registryName: 'HealthPassport' },
    'ChildHealthPassport': { factory: 'ChildHealthPassport', getter: 'getChildHealthPassportModel', registryName: 'ChildHealthPassport' },
    // Питание
    'OrganolepticJournal': { factory: 'OrganolepticJournal', getter: 'getOrganolepticJournalModel', registryName: 'OrganolepticJournal' },
    'FoodStaffHealth': { factory: 'FoodStaffHealth', getter: 'getFoodStaffHealthModel', registryName: 'FoodStaffHealth' },
    'FoodStockLog': { factory: 'FoodStockLog', getter: 'getFoodStockLogModel', registryName: 'FoodStockLog' },
    'PerishableBrak': { factory: 'PerishableBrak', getter: 'getPerishableBrakModel', registryName: 'PerishableBrak' },
    'ProductCertificate': { factory: 'ProductCertificate', getter: 'getProductCertificateModel', registryName: 'ProductCertificate' },
    'DetergentLog': { factory: 'DetergentLog', getter: 'getDetergentLogModel', registryName: 'DetergentLog' },
    'MenuItem': { factory: 'MenuItem', getter: 'getMenuItemModel', registryName: 'MenuItem' },
    'Product': { factory: 'Product', getter: 'getProductModel', registryName: 'Product' },
};

function findTsFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
            files.push(...findTsFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            // Skip model files themselves and config files
            if (!entry.name.endsWith('model.ts') && !fullPath.includes('config/')) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

function processFile(filePath: string): { modified: boolean; gettersNeeded: Set<string> } {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    const gettersNeeded = new Set<string>();

    // Find all Model() usage patterns and replace them
    for (const [modelName, mapping] of Object.entries(MODEL_MAPPINGS)) {
        // Pattern: new (Model())({ ... }) -> new (getModel())({ ... })
        const newPattern = new RegExp(`new\\s*\\(${mapping.factory}\\(\\)\\)`, 'g');
        if (newPattern.test(content)) {
            content = content.replace(newPattern, `new (${mapping.getter}())`);
            gettersNeeded.add(mapping.getter);
        }

        // Pattern: Model().method() -> getModel().method()
        const methodPattern = new RegExp(`${mapping.factory}\\(\\)\\.`, 'g');
        if (methodPattern.test(content)) {
            content = content.replace(methodPattern, `${mapping.getter}().`);
            gettersNeeded.add(mapping.getter);
        }

        // Pattern: await Model().find -> await getModel().find
        const awaitPattern = new RegExp(`await\\s+${mapping.factory}\\(\\)`, 'g');
        if (awaitPattern.test(content)) {
            content = content.replace(awaitPattern, `await ${mapping.getter}()`);
            gettersNeeded.add(mapping.getter);
        }
    }

    const modified = content !== originalContent;

    if (modified) {
        // Remove old model imports
        const importLines = content.split('\n');
        const newImportLines: string[] = [];

        for (const line of importLines) {
            // Skip lines that import factories from model files
            const skipPatterns = Object.keys(MODEL_MAPPINGS).map(name =>
                new RegExp(`import\\s+${name}\\s+from\\s+['"].*\\/model['"]`)
            );

            const shouldSkip = skipPatterns.some(pattern => pattern.test(line));
            if (!shouldSkip) {
                newImportLines.push(line);
            }
        }

        content = newImportLines.join('\n');

        // Add import for getters if needed
        if (gettersNeeded.size > 0) {
            const getterImports = Array.from(gettersNeeded).join(', ');
            const newImport = `import { ${getterImports} } from '${getRelativePathToConfig(filePath)}';`;

            // Insert after first import or at the beginning
            const firstImportIndex = content.indexOf('import ');
            if (firstImportIndex !== -1) {
                const endOfFirstImport = content.indexOf('\n', firstImportIndex);
                content = content.slice(0, endOfFirstImport + 1) + newImport + '\n' + content.slice(endOfFirstImport + 1);
            } else {
                content = newImport + '\n' + content;
            }
        }

        fs.writeFileSync(filePath, content, 'utf-8');
    }

    return { modified, gettersNeeded };
}

function getRelativePathToConfig(filePath: string): string {
    const relativePath = path.relative(path.dirname(filePath), path.join(SRC_DIR, 'config', 'models'));
    return relativePath.replace(/\\/g, '/');
}

async function main() {
    console.log('🔄 Starting migration of model imports...');

    const files = findTsFiles(SRC_DIR);
    console.log(`Found ${files.length} TypeScript files to process`);

    let modifiedCount = 0;

    for (const file of files) {
        const { modified, gettersNeeded } = processFile(file);
        if (modified) {
            modifiedCount++;
            console.log(`✅ Modified: ${path.relative(SRC_DIR, file)} (${Array.from(gettersNeeded).join(', ')})`);
        }
    }

    console.log(`\n🎉 Migration complete! Modified ${modifiedCount} files.`);
}

main().catch(console.error);
