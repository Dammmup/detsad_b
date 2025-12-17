const xlsx = require('xlsx');

const fileName = process.argv[2] || 'docs/Пользователи (1).xlsx';
const rowCount = parseInt(process.argv[3]) || 15;

try {
    const wb = xlsx.readFile(fileName);
    console.log('Sheet names:', wb.SheetNames);

    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    console.log('Total rows:', json.length);
    console.log('---');

    for (let i = 0; i < Math.min(rowCount, json.length); i++) {
        console.log(`Row ${i + 1}:`, JSON.stringify(json[i]));
    }
} catch (err) {
    console.error('Error:', err.message);
}
