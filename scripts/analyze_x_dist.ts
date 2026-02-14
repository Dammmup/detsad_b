
import fs from 'fs';
import path from 'path';

const rawData = fs.readFileSync(path.join(__dirname, '../docs/page3_raw.json'), 'utf8');
const items = JSON.parse(rawData);

const xCounts: Record<number, number> = {};
for (const item of items) {
    const x = Math.round(item.x / 10) * 10;
    xCounts[x] = (xCounts[x] || 0) + 1;
}

const sortedX = Object.keys(xCounts).map(Number).sort((a, b) => a - b);
for (const x of sortedX) {
    console.log(`X=${x}: ${xCounts[x]}`);
}
