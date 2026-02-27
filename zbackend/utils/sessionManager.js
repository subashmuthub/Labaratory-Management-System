// utils/sessionManager.js - Shared Session Management
const crypto = require('crypto');

// Session Storage (In production, use Redis or database)
const sessionStore = new Map();

// Generate session ID for cookie-based authentication
const generateSessionId = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Create session and return session ID
const createSession = (user) => {
    const sessionId = generateSessionId();
    const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    sessionStore.set(sessionId, sessionData);
    
    // Clean up expired sessions periodically
    cleanExpiredSessions();
    
    return sessionId;
};

// Clean up expired sessions
const cleanExpiredSessions = () => {
    const now = new Date();
    for (const [sessionId, session] of sessionStore.entries()) {
        if (now > session.expiresAt) {
            sessionStore.delete(sessionId);
        }
    }
};

// Get session data by session ID
const getSession = (sessionId) => {
    if (!sessionId) return null;
    
    const session = sessionStore.get(sessionId);
    if (!session) return null;
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
        sessionStore.delete(sessionId);
        return null;
    }
    
    return session;
};

// Delete session
const deleteSession = (sessionId) => {
    if (sessionId) {
        sessionStore.delete(sessionId);
    }
};

// Get all active sessions count (for debugging)
const getActiveSessionsCount = () => {
    cleanExpiredSessions();
    return sessionStore.size;
};

module.exports = {
    createSession,
    getSession,
    deleteSession,
    cleanExpiredSessions,
    getActiveSessionsCount
};