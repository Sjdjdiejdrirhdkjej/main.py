import { Page, KeyInput } from 'puppeteer';

// Conceptual @tool decorator
export function tool(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  console.log(`Tool registered: ${propertyKey}`);
  // In a real scenario, this decorator would store metadata about the tool,
  // its expected parameters, and its description for an LLM to use.
  return descriptor;
}

export class Agent {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    console.log('Agent initialized with a Puppeteer page.');
  }

  @tool
  async init_browser(): Promise<{ status: string; error?: string }> {
    console.log('[AGENT REASONING] The browser is being (re-)initialized. Clearing page content.');
    try {
      // The actual browser initialization happens in index.ts's startBrowser.
      // Here, we might reset the page state if needed during an ongoing session.
      await this.page.goto('about:blank', { waitUntil: 'networkidle2' });
      return { status: 'Browser (re-)initialized and page cleared.' };
    } catch (e: any) {
      console.error(`Error in init_browser: ${e.message}`);
      return { status: 'Failed to re-initialize browser page.', error: e.message };
    }
  }

  @tool
  async go_to(url: string): Promise<{ status: string; url?: string; error?: string }> {
    console.log(`[AGENT REASONING] Planning to navigate to URL: ${url}`);
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }); // Added timeout
      return { status: `Successfully navigated to ${url}`, url };
    } catch (e: any) {
      console.error(`Error in go_to(${url}): ${e.message}`);
      return { status: `Failed to navigate to ${url}`, error: e.message };
    }
  }

  @tool
  async mouse_move(x: number, y: number): Promise<{ status: string; x?: number; y?: number; error?: string }> {
    console.log(`[AGENT REASONING] Planning to move mouse to coordinates: ${x}, ${y}`);
    try {
      await this.page.mouse.move(x, y);
      return { status: `Mouse moved to ${x},${y}`, x, y };
    } catch (e: any) {
      console.error(`Error in mouse_move(${x}, ${y}): ${e.message}`);
      return { status: `Failed to move mouse to ${x},${y}`, error: e.message };
    }
  }

  @tool
  async mouse_click(x: number, y: number): Promise<{ status: string; x?: number; y?: number; error?: string }> {
    console.log(`[AGENT REASONING] Planning to click mouse at coordinates: ${x}, ${y}`);
    try {
      await this.page.mouse.click(x, y);
      return { status: `Mouse clicked at ${x},${y}`, x, y };
    } catch (e: any) {
      console.error(`Error in mouse_click(${x}, ${y}): ${e.message}`);
      return { status: `Failed to click mouse at ${x},${y}`, error: e.message };
    }
  }

  @tool
  async type(text: string): Promise<{ status: string; textTyped?: string; error?: string }> {
    console.log(`[AGENT REASONING] Planning to type text: "${text}"`);
    try {
      await this.page.keyboard.type(text);
      return { status: `Successfully typed text: "${text}"`, textTyped: text };
    } catch (e: any) {
      console.error(`Error in type("${text}"): ${e.message}`);
      return { status: `Failed to type text: "${text}"`, error: e.message };
    }
  }

  @tool
  async press_key(key: string): Promise<{ status: string; keyPlayed?: string; error?: string }> {
    console.log(`[AGENT REASONING] Planning to press key: ${key}`);
    try {
      await this.page.keyboard.press(key as KeyInput); // Type assertion for key
      return { status: `Successfully pressed key: ${key}`, keyPlayed: key };
    } catch (e: any) {
      console.error(`Error in press_key(${key}): ${e.message}`);
      return { status: `Failed to press key: ${key}`, error: e.message };
    }
  }

  @tool
  async get_page_content(): Promise<{ title?: string; url?: string; error?: string; status: string }> {
    console.log("[AGENT REASONING] Planning to retrieve current page title and URL.");
    try {
      const title = await this.page.title();
      const url = this.page.url();
      // Could also add: const content = await this.page.content(); // Be careful, can be very large
      // Or: const textContent = await this.page.evaluate(() => document.body.innerText);
      return { title, url, status: "Successfully retrieved page content." };
    } catch (e: any) {
      console.error(`Error in get_page_content: ${e.message}`);
      return { status: "Failed to retrieve page content.", error: e.message };
    }
  }
}
