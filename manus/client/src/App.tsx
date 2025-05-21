import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ChatUI from './components/ChatUI';
import BrowserView from './components/BrowserView';
import useWebSocket from './hooks/useWebSocket';

// Define types for the data we expect
interface GridData {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
}

export interface ChatMessage {
  id: string; // Unique ID for each message
  sender: 'user' | 'agent' | 'system';
  type: 'message' | 'reasoning' | 'action' | 'status' | 'error'; // Message type
  content: string;
  timestamp: Date;
}

function App() {
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(''); // General status from server for StatusBar
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false); // For loading indicator

  const { lastMessage, sendMessage, connectionStatus } = useWebSocket('ws://localhost:3001');

  const addChatMessage = useCallback((
    sender: ChatMessage['sender'],
    type: ChatMessage['type'],
    content: string
  ) => {
    setChatMessages(prevMessages => [
      ...prevMessages,
      { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, sender, type, content, timestamp: new Date() },
    ]);
  }, []);


  useEffect(() => {
    if (lastMessage) {
      console.log('App received message from WebSocket:', lastMessage);
      const { type: wsType, payload } = lastMessage;
      // Stop executing on terminal messages for a command
      if (wsType === 'browser_update' || wsType === 'status' || wsType === 'action_error') {
        setIsExecuting(false);
      }

      switch (wsType) {
        case 'browser_update':
          if (payload.screenshot) {
            setScreenshotData(payload.screenshot);
          }
          if (payload.grid) {
            setGridData(payload.grid);
          }
          // Optionally add a system message for browser updates
          // addChatMessage('system', 'status', 'Browser view updated.');
          break;
        case 'status': // General status messages
          setStatusMessage(payload.message || 'Status update from server.'); // Update StatusBar
          addChatMessage('system', 'status', payload.message || 'Status update from server.');
          break;
        case 'action_error':
          const errorContent = `Error: ${payload.message} (command: ${payload.command || 'N/A'}, details: ${payload.details || 'N/A'})`;
          setStatusMessage(`Error: ${payload.message}`); // Update StatusBar
          addChatMessage('system', 'error', errorContent);
          break;
        case 'agent_reasoning':
          setIsExecuting(true); // Start executing when agent starts reasoning
          addChatMessage('agent', 'reasoning', payload.text || 'Agent is thinking...');
          break;
        case 'agent_action':
          setIsExecuting(true); // Still executing as action is performed
          addChatMessage('agent', 'action', payload.action || 'Agent performed an action.');
          break;
        default:
          console.warn('Received unknown message type from WebSocket:', wsType);
          // addChatMessage('system', 'status', `Received unhandled message type: ${wsType}`);
      }
    }
  }, [lastMessage, addChatMessage]);

  useEffect(() => {
    // This effect primarily updates the statusMessage for the StatusBar based on connectionStatus
    // Chat messages for connection status are handled in the effect below to avoid duplicates.
    if (connectionStatus === 'Open') {
        setStatusMessage("Connected to server");
    } else {
        setStatusMessage(connectionStatus);
    }
  }, [connectionStatus]);

  useEffect(() => {
    // This effect adds connection status changes to the chat log itself.
    const connectionStatusContentForChat = `WebSocket: ${connectionStatus}`;

    // Add connection status messages to chat, avoiding duplicates or too many "Connecting"
    const lastChatMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

    if (connectionStatus === 'Open') {
      if (!lastChatMessage || (lastChatMessage.sender === 'system' && !lastChatMessage.content.includes('Connected to WebSocket server.'))) {
        addChatMessage('system', 'status', 'Connected to WebSocket server.');
      }
    } else if (connectionStatus === 'Closed' || connectionStatus === 'Error') {
      if (!lastChatMessage || (lastChatMessage.sender === 'system' && !lastChatMessage.content.includes(connectionStatusContentForChat))) {
        addChatMessage('system', 'status', connectionStatusContentForChat);
      }
    } else if (connectionStatus === 'Connecting') {
      // Avoid adding "Connecting..." if the previous message already says that or if it's the very first state
      if (!lastChatMessage || (lastChatMessage.sender === 'system' && !lastChatMessage.content.includes(connectionStatusContentForChat))) {
         // addChatMessage('system', 'status', connectionStatusContentForChat); // This can be noisy
      }
    }
  }, [connectionStatus, addChatMessage, chatMessages]);


  const handleSendCommand = (command: any) => {
    sendMessage(command);
    setIsExecuting(true); // Set executing to true when a command is sent
    // We expect agent_reasoning, agent_action, status, browser_update or action_error to follow
  };

  const handleUserMessageAdd = (content: string) => {
    addChatMessage('user', 'message', content);
  };


import StatusBar from './components/StatusBar'; // Import StatusBar

// ... (keep existing imports and interface definitions)

function App() {
  // ... (keep existing state variables: screenshotData, gridData, chatMessages)
  const [statusMessage, setStatusMessage] = useState<string>(''); // For StatusBar general message
  const [isExecuting, setIsExecuting] = useState<boolean>(false); // For loading indicator

  const { lastMessage, sendMessage, connectionStatus } = useWebSocket('ws://localhost:3001');

  const addChatMessage = useCallback((
    sender: ChatMessage['sender'],
    type: ChatMessage['type'],
    content: string
  ) => {
    setChatMessages(prevMessages => [
      ...prevMessages,
      { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, sender, type, content, timestamp: new Date() },
    ]);
  }, []);


  useEffect(() => {
    if (lastMessage) {
      console.log('App received message from WebSocket:', lastMessage);
      const { type: wsType, payload } = lastMessage;
      
      // Stop executing on terminal messages for a command, or if agent indicates it's done (via status)
      if (wsType === 'browser_update' || wsType === 'status' || wsType === 'action_error') {
        setIsExecuting(false);
      }

      switch (wsType) {
        case 'browser_update':
          if (payload.screenshot) {
            setScreenshotData(payload.screenshot);
          }
          if (payload.grid) {
            setGridData(payload.grid);
          }
          // addChatMessage('system', 'status', 'Browser view updated.'); // Optional
          break;
        case 'status': // General status messages from agent/server
          setStatusMessage(payload.message || 'Status update from server.'); // Update StatusBar
          addChatMessage('system', 'status', payload.message || 'Status update from server.');
          break;
        case 'action_error':
          const errorContent = `Error: ${payload.message} (command: ${payload.command || 'N/A'}, details: ${payload.details || 'N/A'})`;
          setStatusMessage(`Error: ${payload.message}`); // Update StatusBar with concise error
          addChatMessage('system', 'error', errorContent); // Add detailed error to chat
          break;
        case 'agent_reasoning':
          setIsExecuting(true); // Agent starts thinking
          addChatMessage('agent', 'reasoning', payload.text || 'Agent is thinking...');
          break;
        case 'agent_action':
          setIsExecuting(true); // Agent is actively performing an action
          addChatMessage('agent', 'action', payload.action || 'Agent performed an action.');
          break;
        default:
          console.warn('Received unknown message type from WebSocket:', wsType);
          // addChatMessage('system', 'status', `Received unhandled message type: ${wsType}`);
      }
    }
  }, [lastMessage, addChatMessage]);

  useEffect(() => {
    // This effect primarily updates the statusMessage for the StatusBar based on connectionStatus
    if (connectionStatus === 'Open') {
        setStatusMessage("Connected to server"); // General status for StatusBar
    } else if (connectionStatus === 'Closed' || connectionStatus === 'Error' || connectionStatus === 'Connecting') {
        setStatusMessage(connectionStatus); // Update StatusBar with specific connection state
    }
  }, [connectionStatus]);

  useEffect(() => {
    // This effect adds connection status changes to the chat log itself, trying to be less noisy.
    const lastChatMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
    
    if (connectionStatus === 'Open') {
      // Add "Connected" message only if not already the last message or if chat is empty
      if (!lastChatMessage || (lastChatMessage.sender === 'system' && !lastChatMessage.content.includes('Connected to WebSocket server'))) {
        addChatMessage('system', 'status', 'Connected to WebSocket server.');
      }
    } else if (connectionStatus === 'Closed' || connectionStatus === 'Error') {
      const chatConnectionMessage = `WebSocket: ${connectionStatus}`;
      // Add "Closed" or "Error" message only if not already the last message
      if (!lastChatMessage || (lastChatMessage.sender === 'system' && !lastChatMessage.content.includes(chatConnectionMessage))) {
        addChatMessage('system', 'status', chatConnectionMessage);
      }
    }
    // "Connecting..." is generally not added to chat to avoid noise, StatusBar shows it.
  }, [connectionStatus, addChatMessage, chatMessages]);


  const handleSendCommand = (command: any) => {
    sendMessage(command);
    setIsExecuting(true);
  };

  const handleUserMessageAdd = (content: string) => {
    addChatMessage('user', 'message', content);
  };


  return (
    <div className="app-container">
      <div className="chat-panel">
        <ChatUI
          messages={chatMessages}
          onSendCommand={handleSendCommand}
          onUserMessageAdd={handleUserMessageAdd}
          isExecuting={isExecuting} // Pass isExecuting to ChatUI
        />
      </div>
      <div className="browser-panel">
        <BrowserView
          screenshotData={screenshotData}
          gridData={gridData}
        />
      </div>
      <StatusBar
        connectionStatus={connectionStatus}
        isExecuting={isExecuting}
        statusMessage={statusMessage}
      />
    </div>
  );
}

export default App;
