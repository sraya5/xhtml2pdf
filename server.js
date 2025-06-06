const express = require('express');
const multer = require('multer');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('xhtmlFile'), async (req, res) => {
  const inputPath = path.join(__dirname, req.file.path);
  const outputPath = inputPath + '.pdf';

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('file://' + inputPath, { waitUntil: 'networkidle2' });

    // Wait for MathJax (if present)
    await page.evaluate(async () => {
      if (typeof MathJax !== 'undefined') {
        await MathJax.typesetPromise();
      }
    });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '2.7cm', right: '3cm', bottom: '3cm', left: '3cm' }
    });

    await browser.close();

    // Send PDF file as download
    res.download(outputPath, 'converted.pdf', () => {
      fs.unlinkSync(inputPath);   // cleanup
      fs.unlinkSync(outputPath);  // cleanup
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).send('Error converting file.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
