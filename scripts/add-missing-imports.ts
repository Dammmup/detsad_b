/**
 * Final cleanup script - add missing imports and fix remaining issues
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');

// Map of model names to their import paths (relative from entities folder)
const MODEL_IMPORTS: Record<string, string> = {
    'User': '../users/model',
    'Child': '../children/model',
    'Children': '../children/model',
    'Group': '../groups/model',
    'Payroll': '../payroll/model',
    'Task': '../taskList/model',
    'Rent': '../rent/model',
    'Holiday': '../holidays/model',
    'Shift': '../staffShifts/model',
    'StaffAttendanceTracking': '../staffAttendanceTracking/model',
    'ChildAttendance': '../childAttendance/model',
    'ChildPayment': '../childPayment/model',
    'MainEvent': '../mainEvents/model',
    'Report': '../reports/model',
    'Document': '../documents/model',
};

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
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }

    return files;
}

function getRelativeImportPath(fromFile: string, modelName: string): string | null {
    const modelPaths: Record<string, string> = {
        'User': 'src/entities/users/model',
        'Child': 'src/entities/children/model',
        'Children': 'src/entities/children/model',
        'Group': 'src/entities/groups/model',
        'Payroll': 'src/entities/payroll/model',
        'Task': 'src/entities/taskList/model',
        'Rent': 'src/entities/rent/model',
        'Holiday': 'src/entities/holidays/model',
        'Shift': 'src/entities/staffShifts/model',
        'StaffAttendanceTracking': 'src/entities/staffAttendanceTracking/model',
        'ChildAttendance': 'src/entities/childAttendance/model',
        'ChildPayment': 'src/entities/childPayment/model',
        'MainEvent': 'src/entities/mainEvents/model',
        'Report': 'src/entities/reports/model',
        'Document': 'src/entities/documents/model',
    };

    if (!modelPaths[modelName]) return null;

    const fromDir = path.dirname(fromFile);
    const toFile = path.join(__dirname, '..', modelPaths[modelName]);

    let relativePath = path.relative(fromDir, toFile).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }

    return relativePath;
}

function addMissingImports(filePath: string): boolean {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Skip model files
    if (filePath.endsWith('model.ts')) return false;

    // Models that might be used but not imported
    const modelsToCheck = ['User', 'Child', 'Group', 'Payroll', 'Task', 'Rent', 'Holiday', 'Shift',
        'StaffAttendanceTracking', 'ChildAttendance', 'ChildPayment', 'MainEvent', 'Report', 'Document'];

    const missingImports: string[] = [];

    for (const model of modelsToCheck) {
        // Check if model is used in code (as a variable, not as a type)
        const usagePattern = new RegExp(`\\b${model}\\.(find|findById|findOne|create|updateMany|deleteMany|countDocuments|aggregate)`, 'g');
        const newPattern = new RegExp(`new\\s+${model}\\(`, 'g');
        const awaitPattern = new RegExp(`await\\s+${model}\\.`, 'g');

        const isUsed = usagePattern.test(content) || newPattern.test(content) || awaitPattern.test(content);

        if (isUsed) {
            // Check if already imported
            const importPattern = new RegExp(`import\\s+.*\\b${model}\\b.*from`, 'g');
            const isImported = importPattern.test(content);

            if (!isImported) {
                const importPath = getRelativeImportPath(filePath, model);
                if (importPath) {
                    missingImports.push(`import ${model} from '${importPath}';`);
                }
            }
        }
    }

    if (missingImports.length > 0) {
        // Add imports at the beginning of file
        const importBlock = missingImports.join('\n') + '\n';

        // Find where to insert (after first import or at beginning)
        const firstImportIndex = content.indexOf('import ');
        if (firstImportIndex !== -1) {
            const lineEnd = content.indexOf('\n', firstImportIndex);
            content = content.slice(0, lineEnd + 1) + importBlock + content.slice(lineEnd + 1);
        } else {
            content = importBlock + content;
        }
    }

    // Remove bad imports from deleted files
    content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]\.\.\/\.\.\/config\/modelRegistry['"];\r?\n?/g, '');
    content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]\.\.\/config\/modelRegistry['"];\r?\n?/g, '');
    content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]\.\.\/\.\.\/config\/models['"];\r?\n?/g, '');
    content = content.replace(/import\s+\{[^}]*createModelFactory[^}]*\}\s+from\s+['"]\.\./g, '');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✅ Fixed: ${path.relative(SRC_DIR, filePath)}`);
        return true;
    }

    return false;
}

async function main() {
    console.log('🚀 Adding missing imports and removing bad imports...\n');

    const files = findTsFiles(SRC_DIR);
    console.log(`Found ${files.length} TypeScript files`);

    let fixed = 0;
    for (const file of files) {
        if (addMissingImports(file)) {
            fixed++;
        }
    }

    console.log(`\n✅ Fixed ${fixed} files`);
}

main().catch(console.error);
