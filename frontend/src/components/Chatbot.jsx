// src/components/IntelligentChatbot.jsx - Clean Real Data Chatbot
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function IntelligentChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { user, token } = useAuth();

    const API_BASE_URL = '/api';

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            initializeChat();
        }
    }, [isOpen]);

    const initializeChat = () => {
        const welcomeMessage = {
            id: Date.now(),
            text: user ? `**Gemini AI**: Hello ${user?.name || 'there'}! 🤖\n\nI'm your intelligent lab assistant powered by AI! I can help you with both lab data and general questions.\n\n**What I can do:**\n🎤 **Voice Commands**: Click the microphone to speak\n📊 **Lab Data**: "How many labs?", "Show equipment", "Find i7 computers"\n🔍 **Equipment Info**: "Where is computer001?", "What are the specs?"\n🤖 **AI Assistance**: Lab safety, maintenance tips, study advice\n💡 **Smart Responses**: I understand both data queries and general questions\n⚡ **Quick Actions**: Use buttons for common tasks\n\n**Try asking me anything - data queries or general questions!**` 
            : `Welcome to NEC Lab Management System! 🤖\n\nTo use the chatbot features, please log in first.\n\nOnce logged in, I can help you with:\n📊 Lab data and equipment information\n🤖 AI-powered assistance and advice\n🎤 Voice commands\n💡 Smart responses to your questions\n\n**Please log in to get started!**`,
            isBot: true,
            timestamp: new Date(),
            isWelcome: true
        };
        setMessages([welcomeMessage]);
    };

    // Voice recognition functionality
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser. Try Chrome or Edge.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputMessage(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'no-speech') {
                alert('No speech was detected. Please try again.');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // Quick actions for common tasks
    const quickActions = [
        { icon: '🏢', text: 'Lab Status', action: 'Show me all lab statuses and availability' },
        { icon: '💻', text: 'Computers', action: 'List all computers and their specifications' },
        { icon: '📊', text: 'Statistics', action: 'Show me system statistics and counts' },
        { icon: '🔧', text: 'Maintenance', action: 'What equipment needs maintenance?' },
        { icon: '📅', text: 'Bookings', action: 'Show me today\'s bookings and schedule' },
        { icon: '⚠️', text: 'Issues', action: 'Are there any equipment issues or problems?' }
    ];

    const handleSendMessage = async (messageText = inputMessage) => {
        if (!messageText.trim() || isTyping) return;

        const userMessage = {
            id: Date.now(),
            text: messageText.trim(),
            isBot: false,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            // Check if user is authenticated
            if (!token || !user) {
                const errorMessage = {
                    id: Date.now() + 1,
                    text: "Please log in to use the chatbot features. 🔐",
                    isBot: true,
                    timestamp: new Date(),
                    isError: true
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsTyping(false);
                return;
            }

            // Always use the main chat endpoint
            const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: messageText.trim()
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();

            if (result.success) {
                const botMessage = {
                    id: Date.now() + 1,
                    text: result.data.response,
                    isBot: true,
                    timestamp: new Date(),
                    queryType: result.data.queryType || result.data.intent,
                    entities: result.data.entities,
                    specificItem: result.data.specificItem,
                    source: result.data.source || 'database'
                };

                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error:', error);
            let errorText = "I'm having trouble right now. Please try again.";
            
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorText = "Please log in to use the chatbot features. 🔐";
            } else if (error.message.includes('Network')) {
                errorText = "Network connection issue. Please check your internet connection.";
            } else if (error.message.includes('500')) {
                errorText = "Server is experiencing issues. Please try again later.";
            }
            
            const errorMessage = {
                id: Date.now() + 1,
                text: errorText,
                isBot: true,
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setTimeout(initializeChat, 100);
    };

    return (
        <>
            {/* Enhanced Chat Toggle Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative w-16 h-16 rounded-full shadow-2xl transition-all duration-300 transform ${isOpen
                        ? 'bg-red-500 hover:bg-red-600 scale-95'
                        : 'bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 hover:scale-110 animate-pulse'
                        }`}
                    title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
                >
                    {isOpen ? (
                        <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    ) : (
                        <div className="relative">
                            {/* Robot/AI Icon */}
                            <div className="w-8 h-8 mx-auto text-white flex items-center justify-center">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                                </svg>
                            </div>
                            
                            {/* Notification Badge */}
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                                <span className="text-xs font-bold text-white">AI</span>
                            </div>
                            
                            {/* Pulse Ring */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 opacity-30 animate-ping"></div>
                        </div>
                    )}
                </button>

                {/* Minimized Mode */}
                {isOpen && isMinimized && (
                    <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-lg p-3 w-64">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Lab AI Assistant</span>
                            <button
                                onClick={() => setIsMinimized(false)}
                                className="text-blue-500 hover:text-blue-700"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17L17 7M17 17H7V7"></path>
                                </svg>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Click to expand chat</p>
                    </div>
                )}
            </div>

            {/* Enhanced Chat Window */}
            {isOpen && !isMinimized && (
                <div className="fixed bottom-24 right-6 w-96 h-[650px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 transform transition-all duration-300">
                    {/* Enhanced Header */}
                    <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 text-white p-4 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Lab AI Assistant</h3>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                                        <p className="text-xs opacity-90">Online • Voice • Smart Actions</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => setShowQuickActions(!showQuickActions)}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                    title="Quick Actions"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                    title="Minimize"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={clearChat}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                    title="Clear Chat"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl shadow-sm ${message.isBot
                                        ? message.isError
                                            ? 'bg-red-100 text-red-800 border border-red-200'
                                            : 'bg-white text-gray-800 border border-gray-200'
                                        : 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-line leading-relaxed">
                                        {message.text}
                                    </p>

                                    {/* Show query info for debugging */}
                                    {message.queryType && message.queryType !== 'general' && message.queryType !== 'ai_chat' && (
                                        <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                            📊 Query: {message.queryType}
                                            {message.specificItem && ` | Item: ${message.specificItem}`}
                                        </div>
                                    )}

                                    <p className={`text-xs mt-2 ${message.isBot ? 'text-gray-500' : 'text-blue-100'}`}>
                                        {message.timestamp.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500">Querying your database...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Enhanced Quick Actions Panel */}
                    {showQuickActions && !isTyping && (
                        <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-gray-700 font-bold">⚡ Quick Actions</p>
                                <button
                                    onClick={() => setShowQuickActions(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {quickActions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSendMessage(action.action)}
                                        className="flex items-center space-x-2 bg-white hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition-all transform hover:scale-105 shadow-sm"
                                        disabled={isTyping}
                                    >
                                        <span className="text-lg">{action.icon}</span>
                                        <span className="text-xs font-medium">{action.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enhanced Input Area */}
                    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-xl">
                        <div className="flex space-x-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type or speak your question..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white shadow-sm"
                                disabled={isTyping || isListening}
                                maxLength={500}
                            />
                            
                            {/* Voice Input Button */}
                            <button
                                onClick={startListening}
                                disabled={isTyping || isListening}
                                className={`px-3 py-3 rounded-xl transition-all shadow-lg ${isListening 
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                } text-white disabled:opacity-50`}
                                title={isListening ? "Listening..." : "Voice Input"}
                            >
                                {isListening ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                                    </svg>
                                )}
                            </button>
                            
                            {/* Send Button */}
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isTyping || !inputMessage.trim() || isListening}
                                className="px-4 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg transform hover:scale-105"
                                title="Send message"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                </svg>
                            </button>
                        </div>
                        
                        {/* Enhanced Status Bar */}
                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span>Live Data</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                    <span>🎤</span>
                                    <span>Voice Ready</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                    <span>⚡</span>
                                    <span>Smart AI</span>
                                </span>
                            </div>
                            <div className="text-xs text-gray-400">
                                {inputMessage.length}/500
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

