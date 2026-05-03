import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
  
  const metrics = await page.evaluate(() => {
    const getCenter = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        center: rect.left + rect.width / 2
      };
    };
    
    return {
      windowCenter: window.innerWidth / 2,
      h1: getCenter(document.querySelector('h1')),
      paragraph: getCenter(document.querySelector('p')),
      grid: getCenter(document.querySelector('.grid')),
      nav: getCenter(document.querySelector('nav')),
    };
  });
  
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
