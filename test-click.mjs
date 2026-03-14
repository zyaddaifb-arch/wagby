import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'teacher@example.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        await page.waitForTimeout(3000);
        console.log('Current URL after login:', page.url());
        
        // Take a screenshot to see why it's failing
        await page.screenshot({ path: 'login-failure.png' });
        
        // Dump the HTML
        const html = await page.content();
        console.log('Page HTML:', html.slice(0, 1000));

    } catch (e) {
        console.error('Error in script:', e);
    } finally {
        await browser.close();
    }
})();
