const puppeteer = require('puppeteer');

// Simple @tool decorator implementation
function tool(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = async function(...args) { // Made async to handle async methods
    console.log(`Calling ${propertyKey} with args: ${JSON.stringify(args)}`);
    // Ensure 'this' context is correct and originalMethod exists
    if (originalMethod) {
      return await originalMethod.apply(this, args);
    } else {
      console.error(`Original method for ${propertyKey} is undefined.`);
      // Decide how to handle this - throw error or return undefined/null
      // For now, logging error and returning undefined
      return undefined; 
    }
  };
  return descriptor;
}

class BrowserAgent {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    @tool
    async init_browser() {
        this.browser = await puppeteer.launch({ 
            headless: true, // Set to false to see the browser, true for CI/server
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Args for running in restricted environments
        });
        this.page = await this.browser.newPage();
        console.log('Browser initialized and new page created.');
    }

    @tool
    async go_to(url) {
        if (!this.page) {
            console.error('Page not initialized. Call init_browser() first.');
            return;
        }
        await this.page.goto(url, { waitUntil: 'networkidle2' });
        console.log(`Navigated to ${url}`);
    }

    @tool
    async mouse_move(x, y) {
        if (!this.page) {
            console.error('Page not initialized.');
            return;
        }
        // For now, this is a placeholder as actual real-time mouse streaming is complex
        // await this.page.mouse.move(x, y); 
        console.log(`Mouse move to (${x}, ${y}) - placeholder`);
    }

    @tool
    async mouse_click(x, y) {
        if (!this.page) {
            console.error('Page not initialized.');
            return;
        }
        await this.page.mouse.click(x, y);
        console.log(`Mouse clicked at (${x}, ${y})`);
    }

    @tool
    async type(text) {
        if (!this.page) {
            console.error('Page not initialized.');
            return;
        }
        await this.page.keyboard.type(text);
        console.log(`Typed text: ${text}`);
    }

    @tool
    async press_key(key) {
        if (!this.page) {
            console.error('Page not initialized.');
            return;
        }
        await this.page.keyboard.press(key);
        console.log(`Pressed key: ${key}`);
    }

    @tool
    async get_screenshot() {
        if (!this.page) {
            console.error('Page not initialized.');
            return null;
        }
        const screenshotBuffer = await this.page.screenshot({ encoding: 'base64' });
        console.log('Screenshot taken.');
        return screenshotBuffer;
    }

    async close_browser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
            console.log('Browser closed.');
        }
    }
}

module.exports = BrowserAgent;
