const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const BrowserAgent = require('./agent'); // Require BrowserAgent

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

io.on('connection', (socket) => {
    console.log('A user connected');
    const agent = new BrowserAgent(); // Create a new BrowserAgent for each client

    socket.on('action', async (data) => {
        const { command, args } = data;
        console.log(`Received action: ${command} with args: ${JSON.stringify(args)}`);

        if (typeof agent[command] === 'function') {
            try {
                // Special handling for init_browser as it's the first call
                if (command === 'init_browser') {
                    await agent[command](...(args || [])); // Ensure args is an array
                } else if (!agent.browser) {
                    // Ensure browser is initialized for other commands
                    console.error('Browser not initialized. Client should call init_browser first.');
                    socket.emit('action_error', 'Browser not initialized. Call init_browser first.');
                    return;
                } else {
                    await agent[command](...(args || [])); // Ensure args is an array
                }
                
                const screenshot = await agent.get_screenshot();
                const commandExecuted = `${command}(${(args || []).map(arg => JSON.stringify(arg)).join(', ')})`;

                socket.emit('action_response', {
                    reasoning: "[PLACEHOLDER REASONING]",
                    command_executed: commandExecuted,
                    screenshot: screenshot,
                    grid: [] // Simplified grid
                });
            } catch (error) {
                console.error(`Error executing command ${command}:`, error);
                socket.emit('action_error', `Error executing command ${command}: ${error.message}`);
            }
        } else {
            console.error(`Invalid command: ${command}`);
            socket.emit('action_error', `Invalid command: ${command}`);
        }
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected');
        if (agent.browser) {
            await agent.close_browser(); // Clean up browser agent on disconnect
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Basic route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
