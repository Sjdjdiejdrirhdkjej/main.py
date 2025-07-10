# Simple JavaScript Puppeteer Server Example

This directory contains an example of a simpler server built with JavaScript, Express, Socket.IO, and Puppeteer. It's an alternative to the main TypeScript-based server provided in the template.

## Overview

This example server:
- Uses Express to serve static files and handle HTTP requests.
- Uses Socket.IO for real-time communication with a client.
- Uses Puppeteer to control a headless browser.
- Includes a basic HTML/CSS/JS client in the `public/` directory.

## Setup and Running

1.  **Navigate to this directory:**
    ```bash
    cd manus/examples/simple-js-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the server:**
    ```bash
    npm start
    ```
    The server will typically start on port 3000. You can open `public/index.html` in your browser to interact with it.

## Notes

- This example is provided for illustrative purposes or for those who prefer a simpler JavaScript setup.
- The main template focuses on the TypeScript server in the `../../server/` directory and the React client in `../../client/`.
- The `main` script in `package.json` is set to `src/server.js`.
- Basic tests can be run with `npm test` (if corresponding `*.test.js` files are present in `src/`).
