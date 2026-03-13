// utils/sessionManager.js - Shared Session Management
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Session Storage (In production, use Redis or database)
const sessionStore = new Map();

// Persistent session file path
const SESSION_FILE = path.join(__dirname, '..', '.sessions.json');

// Load sessions from file on startup
const loadSessionsFromFile = () => {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const data = fs.readFileSync(SESSION_FILE, 'utf8');
            const sessions = JSON.parse(data);
            
            // Convert date strings back to Date objects and load valid sessions
            let loadedCount = 0;
            const now = new Date();
            
            for (const [sessionId, session] of Object.entries(sessions)) {
                session.createdAt = new Date(session.createdAt);
                session.expiresAt = new Date(session.expiresAt);
                
                // Only load non-expired sessions
                if (now < session.expiresAt) {
                    sessionStore.set(sessionId, session);
                    loadedCount++;
                }
            }
            
            console.log(`✅ Loaded ${loadedCount} valid sessions from file`);
        }
    } catch (error) {
        console.error('⚠️ Error loading sessions from file:', error.message);
    }
};

// Save sessions to file
const saveSessionsToFile = () => {
    try {
        const sessions = {};
        for (const [sessionId, session] of sessionStore.entries()) {
            sessions[sessionId] = session;
        }
        fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2), 'utf8');
    } catch (error) {
        console.error('⚠️ Error saving sessions to file:', error.message);
    }
};

// Load sessions on module initialization
loadSessionsFromFile();

// Generate session ID for cookie-based authentication
const generateSessionId = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Create session and return session ID
const createSession = (user) => {
    const sessionId = generateSessionId();
    const sessionData = {
        userId: user.userId || user.id, // Support both userId and id
        userMail: user.userMail || user.email, // Support both new and old field names
        roleId: user.roleId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    sessionStore.set(sessionId, sessionData);
    
    // Clean up expired sessions periodically
    cleanExpiredSessions();
    
    // Persist to file
    saveSessionsToFile();
    
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
        // Persist to file
        saveSessionsToFile();
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
    getActiveSessionsCount,
    sessionStore, // Export for testing purposes
    generateSessionId // Export for testing
};