const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = 'https://www.nsoud.cz/uredni-deska/obcanskopravni-a-obchodni-kolegium/vyhlasovana-rozhodnuti'; // Page with the form and table
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });

  // --- Calculate yesterday's date in YYYY-MM-DD format for <input type="date"> ---
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateValue = `${yyyy}-${mm}-${dd}`;

  console.log('Filling date inputs with:', dateValue);
  process.stdout.write('\n\n');

  // --- Fill the date fields ---
  await page.fill('#declarationFrom', dateValue);
  await page.fill('#declarationTo', dateValue);

  // --- Submit the form ---
  await Promise.all([
    page.click('form input[type=submit]'), // Adjust selector if needed
    page.waitForLoadState('networkidle')
  ]);

  // --- Wait for table to appear ---
  await page.waitForSelector('table');

  // --- Scrape all data-href attributes from table rows ---
  const hrefs = await page.$$eval('table tr', rows =>
    rows.map(row => row.getAttribute('data-href')).filter(Boolean).map((row) => `https://www.nsoud.cz${row}`)
  );

  const output = `${hrefs.join('\n')}\n`;
  process.stdout.write(output);
  fs.writeFileSync('./result.txt', output);

  await browser.close();
})();
