
import fs from 'fs';
import path from 'path';

const rawData = fs.readFileSync(path.join(__dirname, '../docs/page3_raw.json'), 'utf8');
const items = JSON.parse(rawData);

// Cluster X coordinates
// Common X ranges:
// Day 1: 680-900
// Day 2: 1000-1155
// Day 3: 1160-1350
// Day 4: 1360-1550
// Day 5: 1560-1750
// Norms: 1760+
const COL_BINS = [680, 1000, 1155, 1360, 1560, 1755, 2000];

function getColIndex(x: number) {
    if (x < 680) return -1; // Row names/headers like "Завтрак", "Обед"
    for (let i = 0; i < COL_BINS.length - 1; i++) {
        if (x >= COL_BINS[i] && x < COL_BINS[i + 1]) return i;
    }
    return -1;
}

const rows: Record<number, string[]> = {};
for (const item of items) {
    const colId = getColIndex(item.x);
    // Even if it's -1 (row names), we want to see it!
    const effectiveColId = colId === -1 ? 0 : colId + 1; // Col 0 is for labels

    const y = Math.round(item.y / 15) * 15; // Snape to 15 units instead of 10
    if (!rows[y]) rows[y] = Array(7).fill('');
    rows[y][effectiveColId] += item.str + ' ';
}

const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a);

let output = '--- RECONSTRUCTED TABLE ---\n';
output += 'Y     | Label                | Day 1                | Day 2                | Day 3                | Day 4                | Day 5                | Norms\n';
output += '------------------------------------------------------------------------------------------------------------------------------------------------------------\n';
for (const y of sortedY) {
    output += `${y.toString().padEnd(5)} | ` + rows[y].map(cell => cell.trim().padEnd(20)).join(' | ') + '\n';
}

fs.writeFileSync(path.join(__dirname, '../docs/page3_reconstructed.txt'), output);
console.log('Table reconstructed to docs/page3_reconstructed.txt');
