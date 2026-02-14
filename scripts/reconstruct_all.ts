
import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../docs/меню ноябрь 2025 ДО (1).pdf');

async function reconstructAll() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);

        const COL_BINS = [680, 1000, 1155, 1360, 1560, 1755, 2000];
        function getColIndex(x: number) {
            if (x < 680) return -1;
            for (let i = 0; i < COL_BINS.length - 1; i++) {
                if (x >= COL_BINS[i] && x < COL_BINS[i + 1]) return i;
            }
            return -1;
        }

        const options = {
            pagerender: function (pageData: any) {
                return pageData.getTextContent()
                    .then(function (textContent: any) {
                        const items = textContent.items.map((item: any) => ({
                            str: item.str,
                            x: Math.round(item.transform[4]),
                            y: Math.round(item.transform[5]),
                        }));

                        const rows: Record<number, string[]> = {};
                        for (const item of items) {
                            const colId = getColIndex(item.x);
                            const effectiveColId = colId === -1 ? 0 : colId + 1;
                            const y = Math.round(item.y / 15) * 15;
                            if (!rows[y]) rows[y] = Array(7).fill('');
                            rows[y][effectiveColId] += item.str + ' ';
                        }

                        const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a);
                        let pageText = '';
                        for (const y of sortedY) {
                            pageText += rows[y].map(cell => cell.trim().padEnd(20)).join(' | ') + '\n';
                        }
                        return pageText + '\n\n--- PAGE_BREAK ---\n\n';
                    });
            }
        };

        const data = await pdf(dataBuffer, options);
        fs.writeFileSync(path.join(__dirname, '../docs/all_weeks_reconstructed.txt'), data.text);
        console.log('All weeks reconstructed to docs/all_weeks_reconstructed.txt');

    } catch (error) {
        console.error('Error reconstructing:', error);
    }
}

reconstructAll();
