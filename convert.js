const puppeteer = require('puppeteer-core');

// Read arguments
const [chromePath, filePath] = process.argv.slice(2);

if (!chromePath || !filePath) {
    console.error('Usage: node convert.js <chrome-executable-path> <file-url>');
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(filePath, { waitUntil: 'networkidle2' });

    // Wait for MathJax to finish (if present)
    await page.evaluate(async () => {
        try {
            if (typeof MathJax !== 'undefined' && MathJax.startup?.promise) {
                await MathJax.startup.promise;
            }
        } catch (e) {
            console.error('MathJax error:', e);
        }
    });

    // Optional: generate a debug screenshot (comment out if not needed)
    // await page.screenshot({ path: 'debug.png', fullPage: true });

    // Save as PDF
    await page.pdf({
        path: 'output.pdf',
        format: 'A4',
        printBackground: true,
        margin: {
            top: '2.7cm',
            right: '3cm',
            bottom: '3cm',
            left: '3cm'
        },
    });

    await browser.close();
})();
