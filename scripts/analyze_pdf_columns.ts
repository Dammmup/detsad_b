
import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../docs/меню ноябрь 2025 ДО (1).pdf');

async function analyzeColumns() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);

        const options = {
            pagerender: function (pageData: any) {
                return pageData.getTextContent()
                    .then(function (textContent: any) {
                        // We want to see the columns. Let's group items by X.
                        // But since text items might be small, we group by ranges of X.
                        const items = textContent.items.map((item: any) => ({
                            str: item.str,
                            x: Math.round(item.transform[4]),
                            y: Math.round(item.transform[5]),
                            width: item.width
                        }));

                        // Sort by Y descending then X
                        items.sort((a, b) => b.y - a.y || a.x - b.x);

                        return JSON.stringify(items) + '\n\n--- PAGE_BREAK ---\n\n';
                    });
            }
        };

        const data = await pdf(dataBuffer, options);
        const pages = data.text.split('--- PAGE_BREAK ---');

        // Let's dump the raw items of page 3 to a file to analyze the grid
        const page3Items = pages[2]; // Page 3
        fs.writeFileSync(path.join(__dirname, '../docs/page3_raw.json'), page3Items);
        console.log('Page 3 raw items dumped to docs/page3_raw.json');

    } catch (error) {
        console.error('Error analyzing PDF:', error);
    }
}

analyzeColumns();
