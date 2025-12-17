/**
 * Script to add missing default model imports
 */
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '..', 'src');

// Map of model name -> relative path from entities folder
const MODEL_NAMES_AND_PATHS: Array<{ modelName: string; checkForUsage: RegExp; importLine: string; files: string[] }> = [
    {
        modelName: 'MenuItem',
        checkForUsage: /await\s+MenuItem\./,
        importLine: "import MenuItem, { IMenuItem } from './model';",
        files: ['entities/food/menuItems/service.ts']
    },
    {
        modelName: 'ContactInfectionJournal',
        checkForUsage: /ContactInfectionJournal\./,
        importLine: "import ContactInfectionJournal, { IContactInfectionJournal } from './model';",
        files: ['entities/medician/contactInfectionJournal/service.ts']
    },
    {
        modelName: 'DetergentLog',
        checkForUsage: /DetergentLog\./,
        importLine: "import DetergentLog, { IDetergentLog } from './model';",
        files: ['entities/food/detergentLog/service.ts']
    },
    {
        modelName: 'FoodStockLog',
        checkForUsage: /FoodStockLog\./,
        importLine: "import FoodStockLog, { IFoodStockLog } from './model';",
        files: ['entities/food/foodStockLog/service.ts']
    },
    {
        modelName: 'PerishableBrak',
        checkForUsage: /PerishableBrak\./,
        importLine: "import PerishableBrak, { IPerishableBrak } from './model';",
        files: ['entities/food/perishableBrak/service.ts']
    },
    {
        modelName: 'ProductCertificate',
        checkForUsage: /ProductCertificate\./,
        importLine: "import ProductCertificate, { IProductCertificate } from './model';",
        files: ['entities/food/productCertificates/service.ts']
    },
    {
        modelName: 'DishQualityAssessment',
        checkForUsage: /DishQualityAssessment\./,
        importLine: "import DishQualityAssessment from './dishQualityModel';",
        files: ['entities/food/organolepticJournal/dishQualityService.ts']
    },
    {
        modelName: 'Group',
        checkForUsage: /\bGroup\./,
        importLine: "import Group, { IGroup } from './model';",
        files: ['entities/groups/service.ts']
    },
    {
        modelName: 'Child',
        checkForUsage: /\bChild\./,
        importLine: "import Child, { IChild } from './model';",
        files: ['entities/children/service.ts']
    },
];

function fixFile(filePath: string, modelConfig: typeof MODEL_NAMES_AND_PATHS[0]) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Check if import already exists
    if (content.includes(modelConfig.modelName + ',') || content.includes(`import ${modelConfig.modelName} from`)) {
        console.log(`  ⏭️  ${path.relative(SRC_DIR, filePath)} - already has import`);
        return;
    }

    // Add import at the beginning
    const lines = content.split('\n');

    // Find last import line
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
        }
    }

    if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, modelConfig.importLine);
    } else {
        lines.unshift(modelConfig.importLine);
    }

    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ ${path.relative(SRC_DIR, filePath)} - added import for ${modelConfig.modelName}`);
}

async function main() {
    console.log('🚀 Adding missing model imports...\n');

    for (const modelConfig of MODEL_NAMES_AND_PATHS) {
        for (const file of modelConfig.files) {
            const fullPath = path.join(SRC_DIR, file);
            if (fs.existsSync(fullPath)) {
                fixFile(fullPath, modelConfig);
            } else {
                console.log(`  ⚠️  ${file} not found`);
            }
        }
    }

    console.log('\n✅ Done!');
}

main();
