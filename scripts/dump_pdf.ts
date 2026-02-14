
import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '../docs/меню ноябрь 2025 ДО (1).pdf');

async function dumpPdf() {
    try {
        if (!fs.existsSync(pdfPath)) {
            console.error(`File not found: ${pdfPath}`);
            return;
        }

        console.log('Type of pdf:', typeof pdf);
        console.log('PDF export:', pdf);

        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        console.log(`Total Pages: ${data.numpages}`);

        // pdf-parse gives all text. It doesn't easily split by page unless we use the render callback.
        // But for a quick check, let's just print the first 2000 characters to see if it's garbage or text.
        // Ideally we want page 3. pdf-parse puts page breaks as \n\n?
        // Actually pdf-parse has a pagerender option but the default `text` property serves well for checking garbage vs text.

        console.log("--- START TEXT DUMP ---");
        console.log(data.text.slice(0, 3000)); // Print start of file
        console.log("--- END TEXT DUMP ---");

    } catch (error) {
        console.error('Error parsing PDF:', error);
    }
}

dumpPdf();
