const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
        page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
        page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure()?.errorText));

        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

        // Mock logged in user
        await page.evaluate(() => {
            localStorage.setItem('user', JSON.stringify({
                id: 1, name: 'Test User', role: 'prosumer', email: 'test@test.com'
            }));
            localStorage.setItem('accessToken', 'mockToken');
        });

        // Go to dashboard
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });

        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
