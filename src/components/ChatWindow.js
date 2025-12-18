
import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

function ChatWindow(props) {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm Alvin. How can I help you today?", sender: 'bot', timestamp: new Date() }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Focus input when window expands
    useEffect(() => {
        if (!isCollapsed && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 300);
        }
    }, [isCollapsed]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toggleChat = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isTyping) return;

        const userMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);
        const selectedVenues = localStorage.getItem('selectedVenues');

        // AI response via server
        try{
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userInput: inputText,
                    selectedVenues: selectedVenues,
                })
            });

            const botResponse = await response.text();
            console.log(botResponse, "bot bot bot");

            const botMessage = {
                id: Date.now() + 1,
                text: botResponse,
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        } catch (error) {
            console.error(error);

            const errorMessage = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting. Please try again.",
                sender: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`chat-container ${isCollapsed ? 'collapsed' : ''} ${props?.user?.role}-wrapper ${props?.user? "active" : "inactive"}`}>
            {/* Header */}
            <div
                className="chat-header bg-gradient-primary text-white rounded-top-3 p-3 shadow-lg"
                onClick={toggleChat}
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    cursor: 'pointer'
                }}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div className="chat-icon">
                            <i className="bi bi-robot fs-5"></i>
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold">AI Assistant</h5>
                            <small className="opacity-75">Click to expand/collapse</small>
                        </div>
                    </div>
                    <button
                        className="toggle-btn btn btn-sm btn-light bg-white bg-opacity-25 border-0 rounded-circle"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleChat();
                        }}
                        style={{ width: '32px', height: '32px' }}
                    >
                        <i className={`bi bi-chevron-${isCollapsed ? 'up' : 'down'} text-white`}></i>
                    </button>
                </div>
            </div>

            {/* Chat Window */}
            <div className="chat-window bg-white rounded-bottom-3 shadow-lg">
                {/* Messages Area */}
                <div className="chat-messages p-3">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message-container ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                        >
                            <div className={`message ${message.sender}`}>
                                {message.sender === 'bot' && (
                                    <div className="message-avatar bot-avatar">
                                        <i className="bi bi-robot"></i>
                                    </div>
                                )}

                                <div className="message-content-wrapper">
                                    <div className="message-content">
                                        {message.text}
                                    </div>
                                    <div className="message-timestamp">
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>

                                {message.sender === 'user' && (
                                    <div className="message-avatar user-avatar">
                                        <i className="bi bi-person"></i>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="typing-indicator">
                            <div className="message bot">
                                <div className="message-avatar bot-avatar">
                                    <i className="bi bi-robot"></i>
                                </div>
                                <div className="message-content-wrapper">
                                    <div className="typing-bubble">
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input border-top p-3">
                    <form onSubmit={handleSubmit} className="input-group">
                        <input
                            ref={inputRef}
                            type="text"
                            className="form-control border-primary border-opacity-25 rounded-start-pill px-3 py-2"
                            placeholder="Type your message here..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isTyping}
                            style={{ borderRight: 'none' }}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary rounded-end-pill px-4"
                            disabled={!inputText.trim() || isTyping}
                            style={{
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                borderColor: '#667eea'
                            }}
                        >
                            <i className="bi bi-send-fill"></i>
                        </button>
                    </form>
                    <div className="form-text text-end mt-2">
                        <small className="text-muted">
                            {isTyping ? 'AI is typing...' : 'Press Enter to send'}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
