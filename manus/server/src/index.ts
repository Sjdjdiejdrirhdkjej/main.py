import express from 'express';
import http from 'http';
import puppeteer, { Browser, Page, KeyInput } from 'puppeteer';
import WebSocket from 'ws';
import { Agent } from './agent'; // Import the Agent class

const app = express();
const port = process.env.PORT || 3001;

// Global variables for Puppeteer browser, page, and agent
let browser: Browser | null = null;
let page: Page | null = null;
let agent: Agent | null = null;

// Basic Express route
app.get('/', (req, res) => {
  res.send('Manus backend is running');
});

// Create HTTP server
const server = http.createServer(app);

// Puppeteer integration
async function startBrowser(ws?: WebSocket) {
  try {
    console.log('Starting Puppeteer browser...');
    if (browser) {
      console.log('Closing existing Puppeteer browser...');
      await browser.close();
    }
    console.log('Launching new Puppeteer browser...');
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('about:blank'); // Start with a blank page
    agent = new Agent(page); // Create an instance of the Agent
    console.log('Puppeteer browser started, page created, and agent initialized.');

    if (ws) {
      // Send initial state if a WebSocket client is provided (e.g., after a re-init)
      ws.send(JSON.stringify({ type: 'status', message: 'Browser and Agent initialized.' }));
    }
  } catch (error) {
    console.error('Error starting Puppeteer browser or initializing agent:', error);
    if (ws) {
      ws.send(JSON.stringify({ type: 'action_error', payload: { message: 'Error starting Puppeteer: ' + (error as Error).message } }));
    }
  }
}

// Function to take screenshot and send to client
async function takeScreenshotAndSend(ws: WebSocket) {
  if (!page || !browser) {
    ws.send(JSON.stringify({ type: 'action_error', payload: { message: 'Browser not initialized' } }));
    return;
  }
  try {
    const screenshot = await page.screenshot({ encoding: 'base64' });
    const viewport = page.viewport();
    const gridData = {
      rows: 10,
      cols: 10,
      cellWidth: viewport ? viewport.width / 10 : 0,
      cellHeight: viewport ? viewport.height / 10 : 0,
    };
    ws.send(JSON.stringify({ type: 'browser_update', payload: { screenshot, grid: gridData } }));
  } catch (error) {
    console.error('Error taking screenshot:', error);
    ws.send(JSON.stringify({ type: 'action_error', payload: { message: 'Error taking screenshot: ' + (error as Error).message } }));
  }
}

// WebSocket server setup
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify({ type: 'status', message: 'Connected to Manus backend. Browser and Agent are ready.' }));

  // Send initial blank screenshot or wait for go_to
  // For now, we wait for the first go_to to send a meaningful screenshot.

  ws.on('message', async (message) => {
    console.log('Received message:', message.toString());
    if (!browser || !page || !agent) { // Check for agent as well
      ws.send(JSON.stringify({ type: 'action_error', payload: { message: 'Browser or Agent not initialized. Please wait or try reconnecting.' } }));
      return;
    }

    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.toString());
    } catch (error) {
      console.error('Failed to parse message:', error);
      ws.send(JSON.stringify({ type: 'action_error', payload: { message: 'Invalid JSON message format' } }));
      return;
    }

    const { type, payload } = parsedMessage;

    try {
      // All actions will now go through the agent
      let agentResult: any;
      const reasoningMessage = `[AGENT REASONING] Received command: ${type}. Preparing to execute.`; // Generic reasoning start
      ws.send(JSON.stringify({ type: 'agent_reasoning', payload: { text: reasoningMessage } }));

      switch (type) {
        case 'go_to':
          if (payload && payload.url) {
            ws.send(JSON.stringify({ type: 'agent_action', payload: { action: `go_to("${payload.url}")` } }));
            agentResult = await agent.go_to(payload.url);
            if (agentResult.error) {
              ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: agentResult.error, details: agentResult.status } }));
            } else {
              ws.send(JSON.stringify({ type: 'status', message: agentResult.status }));
              await takeScreenshotAndSend(ws);
            }
          } else {
            throw new Error('URL is required for go_to');
          }
          break;
        case 'mouse_move':
          if (payload && typeof payload.x === 'number' && typeof payload.y === 'number') {
            ws.send(JSON.stringify({ type: 'agent_action', payload: { action: `mouse_move(${payload.x}, ${payload.y})` } }));
            agentResult = await agent.mouse_move(payload.x, payload.y);
            if (agentResult.error) {
              ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: agentResult.error, details: agentResult.status } }));
            } else {
              ws.send(JSON.stringify({ type: 'status', message: agentResult.status }));
              // Optional: takeScreenshotAndSend(ws) if you want updates on mouse move
            }
          } else {
            throw new Error('x and y coordinates are required for mouse_move');
          }
          break;
        case 'mouse_click':
          if (payload && typeof payload.x === 'number' && typeof payload.y === 'number') {
            ws.send(JSON.stringify({ type: 'agent_action', payload: { action: `mouse_click(${payload.x}, ${payload.y})` } }));
            agentResult = await agent.mouse_click(payload.x, payload.y);
            if (agentResult.error) {
              ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: agentResult.error, details: agentResult.status } }));
            } else {
              ws.send(JSON.stringify({ type: 'status', message: agentResult.status }));
              await takeScreenshotAndSend(ws);
            }
          } else {
            throw new Error('x and y coordinates are required for mouse_click');
          }
          break;
        case 'type':
          if (payload && typeof payload.text === 'string') {
            ws.send(JSON.stringify({ type: 'agent_action', payload: { action: `type("${payload.text}")` } }));
            agentResult = await agent.type(payload.text);
            if (agentResult.error) {
              ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: agentResult.error, details: agentResult.status } }));
            } else {
              ws.send(JSON.stringify({ type: 'status', message: agentResult.status }));
              await takeScreenshotAndSend(ws);
            }
          } else {
            throw new Error('Text is required for type');
          }
          break;
        case 'press_key':
          if (payload && typeof payload.key === 'string') {
            ws.send(JSON.stringify({ type: 'agent_action', payload: { action: `press_key("${payload.key}")` } }));
            agentResult = await agent.press_key(payload.key as KeyInput);
            if (agentResult.error) {
              ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: agentResult.error, details: agentResult.status } }));
            } else {
              ws.send(JSON.stringify({ type: 'status', message: agentResult.status }));
              await takeScreenshotAndSend(ws);
            }
          } else {
            throw new Error('Key is required for press_key');
          }
          break;
        case 'init_browser':
          ws.send(JSON.stringify({ type: 'agent_action', payload: { action: `init_browser()` } }));
          await startBrowser(ws); // This re-creates page and agent, and agent.init_browser is called within it.
                                  // startBrowser itself sends status or action_error.
          // If startBrowser was successful, agent.init_browser() is implicitly called.
          // We assume agent.init_browser() also handles its own errors and returns status/error.
          // The status message here might be redundant if startBrowser or agent.init_browser sends one.
          // For now, let's rely on startBrowser's feedback.
          // If page is available after startBrowser, then send screenshot
          if (page && agent) { // Check if agent is also available
             agentResult = await agent.init_browser(); // Call agent's own init_browser
             if (agentResult.error) {
                ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: agentResult.error, details: agentResult.status } }));
             } else {
                ws.send(JSON.stringify({ type: 'status', message: agentResult.status || 'Browser and Agent re-initialized.' }));
                await takeScreenshotAndSend(ws);
             }
          } else {
             // If page or agent is not available, startBrowser should have sent an error.
             // If not, send a generic error here.
             if (!ws.CLOSED) { // Check if ws is still open
                ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: 'Failed to re-initialize browser or agent.'}}));
             }
          }
          break;
        case 'get_page_content':
          ws.send(JSON.stringify({ type: 'agent_action', payload: { action: 'get_page_content()' } }));
          agentResult = await agent.get_page_content();
          if (agentResult.error) {
            ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: agentResult.error, details: agentResult.status } }));
          } else {
            ws.send(JSON.stringify({ type: 'status', message: `${agentResult.status} Title: ${agentResult.title}` }));
          }
          // No screenshot needed for this action usually
          break;
        default:
          ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: `Unknown command type: ${type}` } }));
          return; // Return early to avoid generic error handling after this
      }
    } catch (error) { // This catch block handles errors thrown by the payload validation (e.g., "URL is required")
      const err = error as Error;
      console.error(`Error processing command ${type} before agent execution:`, err.message);
      ws.send(JSON.stringify({ type: 'action_error', payload: { command: type, message: err.message } }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start the server and Puppeteer
server.listen(port, async () => {
  console.log(`Manus backend server listening on port ${port}`);
  await startBrowser(); // Initial browser start without specific client
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and Puppeteer browser');
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
    agent = null;
  }
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
