import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../App'; // Assuming ChatMessage type is exported from App.tsx
import './ChatUI.css';

interface ChatUIProps {
  messages: ChatMessage[];
  onSendCommand: (command: any) => void;
  onUserMessageAdd: (content: string) => void;
  isExecuting: boolean; // New prop to indicate if a command is being processed
}

const ChatUI: React.FC<ChatUIProps> = ({ messages, onSendCommand, onUserMessageAdd, isExecuting }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUserSubmit = () => {
    if (inputValue.trim() === '' || isExecuting) return; // Prevent sending if already executing

    const originalUserInput = inputValue;
    onUserMessageAdd(originalUserInput); 

    const lowerInput = originalUserInput.toLowerCase().trim();
    let command: any = null;

    if (lowerInput.startsWith('go to ')) {
      const url = originalUserInput.substring(6).trim();
      command = { type: 'go_to', payload: { url: (!url.startsWith('http://') && !url.startsWith('https://')) ? `https://${url}` : url } };
    } else if (lowerInput.startsWith('type ')) {
      const text = originalUserInput.substring(5);
      command = { type: 'type', payload: { text } };
    } else if (lowerInput.startsWith('click ')) {
      const parts = originalUserInput.substring(6).split(/[\s,]+/); 
      if (parts.length === 2) {
        const x = parseInt(parts[0], 10);
        const y = parseInt(parts[1], 10);
        if (!isNaN(x) && !isNaN(y)) {
          command = { type: 'mouse_click', payload: { x, y } };
        } else {
           // Add system message for invalid coordinates - this should ideally be handled by App.tsx
           // For now, this direct call to onUserMessageAdd is a placeholder for such feedback.
           // A better way: onSendCommand could return a boolean or App.tsx could send a system message.
           onUserMessageAdd(`System: Invalid coordinates for click: ${parts[0]}, ${parts[1]}`);
        }
      } else {
        onUserMessageAdd("System: Invalid format for click. Use: click <x> <y>");
      }
    } else if (lowerInput.startsWith('press ')) {
      const key = originalUserInput.substring(6).trim();
      command = { type: 'press_key', payload: { key } };
    } else if (lowerInput === 'init browser') {
        command = { type: 'init_browser', payload: {} };
    } else if (lowerInput === 'get page content') {
        command = { type: 'get_page_content', payload: {} };
    }

    if (command) {
      onSendCommand(command);
    } else {
      // If no command is parsed, the user's message is already in the chat.
      // Optionally, add a system message here if desired, e.g.,
      // onUserMessageAdd("System: Command not recognized by client parser.");
      console.log(`Command not specifically recognized: "${originalUserInput}". User message added to chat, but no command sent to backend.`);
    }
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleUserSubmit();
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    let prefix = '';
    if (msg.sender === 'agent') {
      if (msg.type === 'reasoning') prefix = 'Thinking: ';
      else if (msg.type === 'action') prefix = 'Action: ';
    } else if (msg.sender === 'system') {
      if (msg.type === 'error') prefix = ''; // Error prefix is handled by CSS potentially
      else if (msg.type === 'status') prefix = ''; 
    }
    return `${prefix}${msg.content}`;
  };

  return (
    <div className="chat-ui-container">
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender} ${msg.type}`}>
            <span className="sender-label">
              {msg.sender.charAt(0).toUpperCase() + msg.sender.slice(1)}
              {msg.sender === 'agent' ? ` (${msg.type})` : ''}
              {msg.sender === 'system' && msg.type === 'error' ? ` (Error)` : ''}
              {msg.sender === 'system' && msg.type === 'status' ? ` (Status)` : ''}:
            </span>
            <span className="content">{renderMessageContent(msg)}</span>
            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isExecuting ? "Agent is busy..." : "Type a command (e.g., go to google.com)"}
          disabled={isExecuting} // Disable input while executing
        />
        <button onClick={handleUserSubmit} disabled={isExecuting}>
          {isExecuting ? <div className="button-spinner"></div> : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatUI;
