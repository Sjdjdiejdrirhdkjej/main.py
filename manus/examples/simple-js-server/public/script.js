document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const commandInput = document.getElementById('commandInput');
    const sendCommandButton = document.getElementById('sendCommandButton');
    const actionInfo = document.getElementById('actionInfo');
    const screenshotImage = document.getElementById('screenshotImage');

    // Automatically send init_browser command on connect as per subtask instructions
    // (though the problem statement says "client will send init_browser as the first action")
    // This can be changed to be more explicit if needed.
    socket.on('connect', () => {
        console.log('Connected to server. Initializing browser...');
        socket.emit('action', { command: 'init_browser', args: [] });
    });

    sendCommandButton.addEventListener('click', () => {
        const fullCommand = commandInput.value.trim();
        if (!fullCommand) {
            alert('Please enter a command.');
            return;
        }

        const parts = fullCommand.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        if (parts.length === 0) {
            alert('Invalid command format.');
            return;
        }
        
        const command = parts[0];
        const args = parts.slice(1).map(arg => arg.startsWith('"') && arg.endsWith('"') ? arg.slice(1, -1) : arg);

        console.log(`Sending action: ${command} with args:`, args);
        socket.emit('action', { command, args });
        commandInput.value = ''; // Clear input after sending
    });

    socket.on('action_response', (data) => {
        console.log('Received action_response:', data);
        actionInfo.textContent = `Reasoning: ${data.reasoning}\nCommand Executed: ${data.command_executed}`;
        if (data.screenshot) {
            screenshotImage.src = `data:image/png;base64,${data.screenshot}`;
        } else {
            screenshotImage.alt = 'No screenshot available.';
            screenshotImage.src = '#'; // Clear previous image or show placeholder
        }
        // console.log('Grid data (simplified):', data.grid);
    });

    socket.on('action_error', (errorMessage) => {
        console.error('Action Error:', errorMessage);
        actionInfo.textContent = `Error: ${errorMessage}`;
        screenshotImage.alt = 'Error occurred. No screenshot available.';
        screenshotImage.src = '#';
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        actionInfo.textContent = 'Disconnected from server. Please refresh.';
        screenshotImage.alt = 'Disconnected. No screenshot available.';
        screenshotImage.src = '#';
    });
});
