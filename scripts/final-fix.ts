/**
 * Comprehensive fix script for all remaining factory and getModel issues
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');

function findTsFiles(dir: string): string[] {
    const files: string[] = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules') {
                files.push(...findTsFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
                files.push(fullPath);
            }
        }
    } catch (err) { }
    return files;
}

function fixFile(filePath: string): boolean {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Remove bad imports from deleted files
    content = content.replace(/import\s+\{[^}]*getModel[^}]*\}\s+from\s+['"][^'"]*modelRegistry['"];\r?\n?/g, '');
    content = content.replace(/import\s+\{[^}]*createModelFactory[^}]*\}\s+from\s+['"][^'"]*database['"];\r?\n?/g, '');

    // Replace const XxxModel = getModel<IXxx>('Xxx') patterns
    const models = [
        { name: 'Holiday', interface: 'IHoliday' },
        { name: 'HelminthJournal', interface: 'IHelminthJournal' },
        { name: 'HealthPassport', interface: 'IHealthPassport' },
        { name: 'User', interface: 'IUser' },
        { name: 'Child', interface: 'IChild' },
        { name: 'Group', interface: 'IGroup' },
        { name: 'Payroll', interface: 'IPayroll' },
        { name: 'Shift', interface: 'IShift' },
        { name: 'StaffAttendanceTracking', interface: 'IStaffAttendanceTracking' },
        { name: 'MenuItem', interface: 'IMenuItem' },
        { name: 'DetergentLog', interface: 'IDetergentLog' },
        { name: 'FoodStockLog', interface: 'IFoodStockLog' },
        { name: 'PerishableBrak', interface: 'IPerishableBrak' },
        { name: 'ProductCertificate', interface: 'IProductCertificate' },
        { name: 'ContactInfectionJournal', interface: 'IContactInfectionJournal' },
    ];

    for (const model of models) {
        // Remove getModel calls within function bodies - replace with just using the imported model
        const getModelPattern = new RegExp(`const\\s+${model.name}\\s*=\\s*getModel<[^>]+>\\(['"]${model.name}['"]\\);?\\r?\\n?`, 'g');
        content = content.replace(getModelPattern, '');

        // Remove local variable reassignments from models
        const assignPattern = new RegExp(`const\\s+(\\w+)Model\\s*=\\s*getModel<[^>]+>\\(['"]${model.name}['"]\\);?\\r?\\n?`, 'g');
        content = content.replace(assignPattern, '');
    }

    // Fix remaining Model() calls - remove the ()
    const modelNames = [
        'Holiday', 'HelminthJournal', 'HealthPassport', 'User', 'Child', 'Group',
        'Payroll', 'Shift', 'StaffAttendanceTracking', 'MenuItem', 'DetergentLog',
        'FoodStockLog', 'PerishableBrak', 'ProductCertificate', 'ContactInfectionJournal',
        'InfectiousDiseasesJournal', 'MantouxJournal', 'MedicalJournal', 'RiskGroupChild',
        'SomaticJournal', 'TubPositiveJournal', 'OrganolepticJournal', 'FoodStaffHealth',
        'Document', 'Report', 'MainEvent', 'ChildAttendance', 'ChildPayment', 'Rent', 'Task'
    ];

    for (const name of modelNames) {
        // Model().method -> Model.method
        content = content.replace(new RegExp(`\\b${name}\\(\\)\\.`, 'g'), `${name}.`);
        // new (Model())( -> new Model(
        content = content.replace(new RegExp(`new\\s*\\(${name}\\(\\)\\)\\(`, 'g'), `new ${name}(`);
        // new (Model)( -> new Model(
        content = content.replace(new RegExp(`new\\s*\\(${name}\\)\\(`, 'g'), `new ${name}(`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✅ ${path.relative(SRC_DIR, filePath)}`);
        return true;
    }
    return false;
}

async function main() {
    console.log('🚀 Comprehensive fix for all remaining issues...\n');
    const files = findTsFiles(SRC_DIR);
    let fixed = 0;
    for (const file of files) {
        if (fixFile(file)) fixed++;
    }
    console.log(`\n✅ Fixed ${fixed} files`);
}

main();
