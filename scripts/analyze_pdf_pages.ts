
import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../docs/меню ноябрь 2025 ДО (1).pdf');

async function analyzePages() {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);

        const options = {
            pagerender: function (pageData: any) {
                return pageData.getTextContent()
                    .then(function (textContent: any) {
                        // Group by Y coordinate (rows)
                        const lines: Record<number, any[]> = {};
                        for (let item of textContent.items) {
                            const y = Math.round(item.transform[5]);
                            if (!lines[y]) lines[y] = [];
                            lines[y].push(item);
                        }

                        // Sort Y coordinates descending (top to bottom)
                        const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);

                        let result = '';
                        for (const y of sortedY) {
                            // Sort items in the same line by X coordinate
                            const lineItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
                            let lineText = '';
                            let lastX = -1;
                            for (const item of lineItems) {
                                const x = item.transform[4];
                                // Add space if there is a gap
                                if (lastX !== -1 && x - lastX > 5) {
                                    lineText += ' | ';
                                }
                                lineText += item.str;
                                lastX = x + item.width;
                            }
                            result += lineText + '\n';
                        }

                        return result + '\n\n--- PAGE_BREAK ---\n\n';
                    });
            }
        };

        const data = await pdf(dataBuffer, options);
        fs.writeFileSync(path.join(__dirname, '../docs/menu_text_dump.txt'), data.text);
        console.log('PDF text dumped to docs/menu_text_dump.txt');
    } catch (error) {
        console.error('Error analyzing PDF:', error);
    }
}

analyzePages();
