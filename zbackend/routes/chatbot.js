// routes/chatbot.js - Complete Corrected Version with Gemini AI Integration
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class IntelligentLabAssistant {
    constructor() {
        this.queryParsers = {
            count: {
                patterns: ['how many', 'total', 'count of', 'number of'],
                entities: ['labs', 'equipment', 'bookings', 'computers', 'microscopes']
            },
            availability: {
                patterns: ['available', 'free', 'open', 'vacant', 'not booked'],
                entities: ['labs', 'equipment', 'computers', 'today', 'tomorrow', 'now']
            },
            specifications: {
                patterns: ['specs', 'specification', 'details', 'what is', 'tell me about'],
                entities: ['computer', 'laptop', 'server', 'microscope', 'equipment']
            },
            search: {
                patterns: ['find', 'search', 'show me', 'list', 'which'],
                entities: ['i7', 'i5', 'i9', 'ram', 'ssd', 'hdd', 'gpu', 'processor', 'cpu']
            },
            location: {
                patterns: ['where is', 'location of', 'find location', 'which room'],
                entities: ['lab', 'equipment', 'computer']
            },
            status: {
                patterns: ['status of', 'condition', 'working', 'broken', 'maintenance'],
                entities: ['equipment', 'lab', 'computer']
            }
        };
    }

    async parseQuery(message) {
        const lowerMessage = message.toLowerCase();
        let queryType = 'general';
        let entities = [];
        let specificItem = null;
        let confidence = 0.5;

        // Determine query type
        for (const [type, config] of Object.entries(this.queryParsers)) {
            for (const pattern of config.patterns) {
                if (lowerMessage.includes(pattern)) {
                    queryType = type;
                    confidence = 0.8;
                    break;
                }
            }
        }

        // Extract entities
        for (const [type, config] of Object.entries(this.queryParsers)) {
            for (const entity of config.entities) {
                if (lowerMessage.includes(entity)) {
                    entities.push(entity);
                    confidence += 0.1;
                }
            }
        }

        // Extract specific equipment names (like computer001, microscope02)
        const equipmentPattern = /([a-zA-Z]+\d+)/g;
        const matches = message.match(equipmentPattern);
        if (matches) {
            specificItem = matches[0];
            confidence += 0.2;
        }

        // Extract lab types
        const labPattern = /(lab\s*\w*\d*|chemistry|biology|computer|physics|research)/gi;
        const labMatches = message.match(labPattern);
        if (labMatches) {
            entities.push(...labMatches);
        }

        return {
            queryType,
            entities,
            specificItem,
            confidence: Math.min(confidence, 1.0),
            originalMessage: message
        };
    }

    generateQuery(parsedQuery) {
        const { queryType, entities, specificItem } = parsedQuery;

        switch (queryType) {
            case 'count':
                return this.generateCountQuery(entities);
            case 'availability':
                return this.generateAvailabilityQuery(entities);
            case 'specifications':
                return this.generateSpecQuery(specificItem, entities);
            case 'search':
                return this.generateSearchQuery(entities);
            case 'location':
                return this.generateLocationQuery(specificItem, entities);
            case 'status':
                return this.generateStatusQuery(specificItem, entities);
            default:
                return null;
        }
    }

    generateCountQuery(entities) {
        if (entities.includes('labs')) {
            return {
                // Fixed: use is_active instead of status
                query: 'SELECT COUNT(*) as count, lab_type FROM labs WHERE is_active = 1 GROUP BY lab_type',
                type: 'lab_count'
            };
        }
        if (entities.includes('equipment')) {
            return {
                query: `SELECT COUNT(*) as count, category as equipment_type FROM equipment GROUP BY category`,
                type: 'equipment_count'
            };
        }
        if (entities.includes('computers')) {
            return {
                query: `SELECT COUNT(*) as count, 
                       COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
                       COUNT(CASE WHEN status = 'in_use' THEN 1 END) as in_use,
                       COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
                       FROM equipment WHERE category = 'computer'`,
                type: 'computer_count'
            };
        }
        return null;
    }

    generateAvailabilityQuery(entities) {
        if (entities.includes('labs')) {
            return {
                // Safe query that only uses labs table
                query: `SELECT 
                       id,
                       name,
                       description,
                       location,
                       lab_type,
                       capacity,
                       'available' as availability_status
                   FROM labs 
                   WHERE is_active = 1
                   ORDER BY name`,
                type: 'lab_availability'
            };
        }

        if (entities.includes('equipment') || entities.includes('computers')) {
            // Check if equipment table exists first
            return {
                query: `SELECT 
                       'No equipment data available yet' as message`,
                type: 'equipment_availability'
            };
        }

        return null;
    }

    generateSpecQuery(specificItem, entities) {
        if (specificItem) {
            return {
                query: `SELECT e.*, es.*, l.name as lab_name, l.location as lab_location
                       FROM equipment e
                       LEFT JOIN equipment_specifications es ON e.id = es.equipment_id
                       JOIN labs l ON e.lab_id = l.id
                       WHERE (e.name = '${specificItem}' OR e.serial_number = '${specificItem}')
                       AND l.is_active = 1`,
                type: 'specific_equipment'
            };
        }

        return {
            query: `SELECT e.*, es.*, l.name as lab_name
                   FROM equipment e
                   LEFT JOIN equipment_specifications es ON e.id = es.equipment_id
                   JOIN labs l ON e.lab_id = l.id
                   WHERE e.category IN ('computer', 'laptop', 'server')
                   AND l.is_active = 1
                   ORDER BY e.name`,
            type: 'equipment_specs'
        };
    }

    generateSearchQuery(entities) {
        let conditions = [];

        if (entities.some(e => ['i7', 'i5', 'i9', 'cpu', 'processor'].includes(e))) {
            const processor = entities.find(e => ['i7', 'i5', 'i9'].includes(e));
            if (processor) {
                conditions.push(`es.cpu LIKE '%${processor}%'`);
            }
        }

        if (entities.includes('ram')) {
            conditions.push('es.ram IS NOT NULL');
        }

        if (entities.includes('ssd') || entities.includes('hdd')) {
            const storageType = entities.includes('ssd') ? 'ssd' : 'hdd';
            conditions.push(`es.storage LIKE '%${storageType}%'`);
        }

        const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

        return {
            query: `SELECT e.*, es.*, l.name as lab_name, l.location as lab_location
                   FROM equipment e
                   LEFT JOIN equipment_specifications es ON e.id = es.equipment_id
                   JOIN labs l ON e.lab_id = l.id
                   WHERE e.category IN ('computer', 'laptop', 'server') 
                   AND l.is_active = 1 ${whereClause}
                   ORDER BY e.name`,
            type: 'equipment_search'
        };
    }

    generateLocationQuery(specificItem, entities) {
        if (specificItem) {
            return {
                query: `SELECT e.name, e.category, l.name as lab_name, 
                       l.location as lab_location, l.description
                       FROM equipment e
                       JOIN labs l ON e.lab_id = l.id
                       WHERE (e.name = '${specificItem}' OR e.serial_number = '${specificItem}')
                       AND l.is_active = 1`,
                type: 'equipment_location'
            };
        }
        return null;
    }

    generateStatusQuery(specificItem, entities) {
        if (specificItem) {
            return {
                query: `SELECT e.*, l.name as lab_name
                       FROM equipment e
                       JOIN labs l ON e.lab_id = l.id
                       WHERE (e.name = '${specificItem}' OR e.serial_number = '${specificItem}')
                       AND l.is_active = 1`,
                type: 'equipment_status'
            };
        }
        return null;
    }
}

const labAssistant = new IntelligentLabAssistant();

// Response formatters
const responseFormatters = {
    lab_count: (data) => {
        if (!data || data.length === 0) {
            return "📊 No active labs found in the system.";
        }
        const total = data.reduce((sum, item) => sum + item.count, 0);
        const breakdown = data.map(item => `• ${item.lab_type.replace('_', ' ')}: ${item.count}`).join('\n');
        return `📊 **Lab Count**: You have **${total} active labs** in total:\n\n${breakdown}`;
    },

    lab_availability: (data) => {
        if (!data || data.length === 0) {
            return "🏢 No active labs found in the system.";
        }

        let response = `🏢 **Lab Availability** (${data.length} labs):\n\n`;

        data.forEach(lab => {
            response += `**${lab.name}**\n`;
            response += `📍 Location: ${lab.location || 'Not specified'}\n`;
            response += `🏷️ Type: ${lab.lab_type.replace('_', ' ')}\n`;
            response += `👥 Capacity: ${lab.capacity || 'Not specified'}\n`;
            response += `📊 Status: ${lab.availability_status}\n`;

            if (lab.availability_status === 'booked') {
                response += `👤 Booked by: ${lab.booked_by}\n`;
                response += `⏰ Until: ${new Date(lab.end_time).toLocaleString()}\n`;
            }
            response += `\n`;
        });

        return response;
    },

    equipment_count: (data) => {
        if (!data || data.length === 0) {
            return "🔧 No equipment found in the system.";
        }
        const total = data.reduce((sum, item) => sum + item.count, 0);
        const breakdown = data.map(item => `• ${item.equipment_type}: ${item.count}`).join('\n');
        return `🔧 **Equipment Count**: **${total} total equipment**:\n\n${breakdown}`;
    },

    computer_count: (data) => {
        if (!data || data.length === 0) {
            return "💻 No computers found in the system.";
        }
        const item = data[0];
        return `💻 **Computer Inventory**:\n\n• **Total**: ${item.count} computers\n• **Available**: ${item.available}\n• **In Use**: ${item.in_use}\n• **Maintenance**: ${item.maintenance}`;
    },

    equipment_availability: (data) => {
        if (!data || data.length === 0) {
            return "🔧 No available equipment found.";
        }

        let response = `🔧 **Available Equipment** (${data.length} items):\n\n`;

        data.forEach(equipment => {
            response += `**${equipment.name}**\n`;
            response += `📍 ${equipment.lab_name} - ${equipment.lab_location}\n`;
            response += `🏷️ Type: ${equipment.category}\n`;
            response += `📊 Status: ${equipment.status}\n\n`;
        });

        return response;
    },

    specific_equipment: (data) => {
        if (!data || data.length === 0) {
            return `❌ Equipment not found. Please check the name and try again.`;
        }

        const equipment = data[0];
        let response = `🔧 **${equipment.name}** Details:\n\n`;
        response += `📍 **Location**: ${equipment.lab_name} - ${equipment.lab_location}\n`;
        response += `🏷️ **Type**: ${equipment.category}\n`;
        response += `📊 **Status**: ${equipment.status}\n`;

        if (equipment.cpu) response += `🖥️ **CPU**: ${equipment.cpu}\n`;
        if (equipment.ram) response += `💾 **RAM**: ${equipment.ram}\n`;
        if (equipment.storage) response += `💽 **Storage**: ${equipment.storage}\n`;
        if (equipment.gpu) response += `🎮 **GPU**: ${equipment.gpu}\n`;
        if (equipment.operating_system) response += `💿 **OS**: ${equipment.operating_system}\n`;
        if (equipment.serial_number) response += `🔢 **Serial**: ${equipment.serial_number}\n`;
        if (equipment.purchase_date) response += `📅 **Purchase Date**: ${new Date(equipment.purchase_date).toLocaleDateString()}\n`;

        return response;
    },

    equipment_search: (data) => {
        if (!data || data.length === 0) {
            return `❌ No equipment found matching your criteria.`;
        }

        let response = `🔍 **Search Results** (${data.length} found):\n\n`;

        data.forEach(equipment => {
            response += `**${equipment.name}**\n`;
            response += `📍 ${equipment.lab_name} - ${equipment.lab_location}\n`;
            if (equipment.cpu) response += `🖥️ CPU: ${equipment.cpu}\n`;
            if (equipment.ram) response += `💾 RAM: ${equipment.ram}\n`;
            if (equipment.storage) response += `💽 Storage: ${equipment.storage}\n`;
            response += `📊 Status: ${equipment.status}\n\n`;
        });

        return response;
    },

    equipment_location: (data) => {
        if (!data || data.length === 0) {
            return `❌ Equipment not found. Please check the name and try again.`;
        }

        const equipment = data[0];
        return `📍 **${equipment.name}** Location:\n\n🏢 **Lab**: ${equipment.lab_name}\n📍 **Address**: ${equipment.lab_location}\n🏷️ **Type**: ${equipment.category}`;
    },

    equipment_status: (data) => {
        if (!data || data.length === 0) {
            return `❌ Equipment not found. Please check the name and try again.`;
        }

        const equipment = data[0];
        return `📊 **${equipment.name}** Status:\n\n📊 **Current Status**: ${equipment.status}\n📍 **Location**: ${equipment.lab_name}\n🏷️ **Type**: ${equipment.category}`;
    }
};

// Main chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Parse the user's question
        const parsedQuery = await labAssistant.parseQuery(message);
        console.log('Parsed Query:', parsedQuery);

        // Generate appropriate database query
        const dbQuery = labAssistant.generateQuery(parsedQuery);

        let response;
        let suggestions = [];

        if (dbQuery) {
            try {
                // Execute the database query using Sequelize
                const [results] = await sequelize.query(dbQuery.query);
                console.log('Query Results:', results);

                // Format the response
                const formatter = responseFormatters[dbQuery.type];
                if (formatter) {
                    response = formatter(results);
                } else {
                    response = `Here's what I found:\n\n${JSON.stringify(results, null, 2)}`;
                }

                // Generate contextual suggestions
                suggestions = generateContextualSuggestions(dbQuery.type, parsedQuery);

            } catch (dbError) {
                console.error('Database query error:', dbError);
                response = `I'm having trouble accessing the database right now. Please try again or contact support.`;
            }
        } else {
            // For non-database queries, use Gemini AI
            console.log('Using Gemini AI for query:', message);
            response = await handleGeneralQuery(message, userId);
            suggestions = [
                'How many labs do I have?', 
                'Tell me about lab safety protocols', 
                'Show available equipment', 
                'Best practices for lab organization'
            ];
        }

        // Log the interaction
        await logChatInteraction(userId, message, parsedQuery, response);

        res.json({
            success: true,
            data: {
                response,
                suggestions,
                intent: parsedQuery.queryType,
                entities: parsedQuery.entities,
                specificItem: parsedQuery.specificItem,
                confidence: parsedQuery.confidence
            }
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            success: false,
            message: "I'm experiencing technical difficulties. Please try again."
        });
    }
});

// Helper functions
function generateContextualSuggestions(queryType, parsedQuery) {
    switch (queryType) {
        case 'lab_count':
            return ['Show available labs', 'List lab equipment', 'Check lab schedules'];
        case 'equipment_count':
            return ['Find specific equipment', 'Check equipment status', 'Search by specifications'];
        case 'specific_equipment':
            return ['Where is this equipment?', 'Check availability', 'View similar equipment'];
        case 'equipment_search':
            return ['Show more details', 'Check availability', 'Find in specific lab'];
        default:
            return ['How many labs?', 'Available equipment?', 'Find computer with i7'];
    }
}

async function handleGeneralQuery(message, userId) {
    const lowerMessage = message.toLowerCase();

    // Check if it's a database-related query first
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        const [userRows] = await sequelize.query('SELECT name FROM users WHERE id = ?', {
            replacements: [userId]
        });
        const userName = userRows[0]?.name || 'there';
        return `Hello ${userName}! 👋 I can help you find real-time information about:\n\n🏢 **Labs**: Count, availability, details\n🔧 **Equipment**: Specifications, location, status\n🔍 **Search**: Find equipment by specs (i7, RAM, etc.)\n📊 **Status**: Real-time availability and conditions\n\nAsk me anything like:\n• "How many labs do I have?"\n• "Is computer001 an i7?"\n• "Show available equipment"\n• "Find all i7 computers"\n\nI'm also powered by Gemini AI for general assistance! 🤖`;
    }

    if (lowerMessage.includes('help')) {
        return `🤖 **I can help you with real-time lab data**:\n\n📊 **Counts**: "How many labs/computers/equipment?"\n🔍 **Search**: "Find equipment with i7", "Show SSD computers"\n📍 **Location**: "Where is computer001?"\n📈 **Status**: "Status of microscope02"\n🔧 **Specs**: "What are the specs of computer001?"\n⏰ **Availability**: "What labs are available?"\n\n**Try asking specific questions about your actual equipment!**\n\nI'm also powered by Gemini AI for general questions! ✨`;
    }

    // For other queries, use Gemini AI
    try {
        const [userRows] = await sequelize.query('SELECT name, role FROM users WHERE id = ?', {
            replacements: [userId]
        });
        const user = userRows[0] || { name: 'User', role: 'student' };

        // Create context for Gemini
        const context = `You are a helpful lab management assistant for NEC (National Engineering College) Laboratory Management System. 
The user is ${user.name} (${user.role}). 
You can help with:
- General questions about laboratory management
- Equipment usage tips
- Lab safety guidelines
- Study tips and academic advice
- General conversations

Keep responses helpful, friendly, and educational. Focus on laboratory and academic contexts when possible.

User query: ${message}`;

        // Try multiple model names in order of preference (Updated with working models)
        const models = ['models/gemini-2.5-flash', 'models/gemini-2.5-pro', 'models/gemini-flash-latest', 'models/gemini-pro-latest'];
        let aiResponse = null;
        
        for (const modelName of models) {
            try {
                console.log(`Trying Gemini model: ${modelName}`);
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    }
                });
                const result = await model.generateContent(context);
                const response = await result.response;
                aiResponse = response.text();
                console.log(`✅ Success with ${modelName}`);
                break;
            } catch (modelError) {
                console.log(`❌ ${modelName} failed:`, modelError.message.substring(0, 100));
                continue;
            }
        }
        
        if (aiResponse) {
            return `🤖 **Gemini AI**: ${aiResponse}\n\n💡 *For specific lab data queries like equipment counts or availability, try asking directly about your labs!*`;
        }
        
        throw new Error('All Gemini models failed');

    } catch (error) {
        console.error('Gemini AI error:', error.message);
        
        // Check for API key issues
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('401') || error.message.includes('403')) {
            console.log('🚨 API KEY ISSUE DETECTED - Using enhanced fallback');
        }
        
        // Enhanced fallback responses based on message content
        const lowerMessage = message.toLowerCase();
        
        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return `🤖 **AI Assistant**: Hello! I'm your lab management assistant. While I'm working on connecting to Gemini AI, I can still help you with:\n\n📊 **Lab Data**: Ask about equipment counts, availability, or specifications\n🛡️ **Safety Tips**: Lab safety protocols and best practices\n🔧 **Maintenance**: Equipment care and troubleshooting advice\n📚 **Study Help**: Academic guidance for lab work\n\nWhat would you like to know?`;
        }

        // Safety-related queries
        if (lowerMessage.includes('safety') || lowerMessage.includes('protocol') || lowerMessage.includes('danger') || lowerMessage.includes('hazard')) {
            return `🛡️ **Lab Safety Guidelines**:\n\n• **Personal Protective Equipment (PPE)**: Always wear safety glasses, lab coats, and appropriate gloves\n• **Emergency Procedures**: Know locations of eyewash stations, fire extinguishers, and emergency exits\n• **Chemical Handling**: Read Safety Data Sheets (SDS) before using chemicals\n• **Equipment Safety**: Inspect equipment before use and report any damage\n• **Work Environment**: Keep workspaces clean and organized\n• **Never Work Alone**: Especially with hazardous materials or complex procedures\n• **Document Everything**: Report all incidents, near-misses, and equipment issues\n\n**Emergency Contact**: Always have emergency numbers readily available!`;
        }
        
        // Equipment and maintenance queries
        if (lowerMessage.includes('maintain') || lowerMessage.includes('equipment') || lowerMessage.includes('calibrat') || lowerMessage.includes('repair')) {
            return `🔧 **Equipment Maintenance Best Practices**:\n\n• **Regular Calibration**: Follow manufacturer's recommended calibration schedules\n• **Daily Checks**: Inspect equipment before each use\n• **Proper Cleaning**: Clean equipment after each use with appropriate methods\n• **Documentation**: Keep detailed maintenance logs and service records\n• **Preventive Care**: Address small issues before they become major problems\n• **User Training**: Ensure all users are properly trained on equipment operation\n• **Environmental Conditions**: Maintain proper temperature and humidity\n• **Backup Plans**: Have contingency procedures when equipment fails\n\n**Tip**: Create equipment checklists for consistent maintenance!`;
        }
        
        // Study and learning queries
        if (lowerMessage.includes('study') || lowerMessage.includes('learn') || lowerMessage.includes('tip') || lowerMessage.includes('help') || lowerMessage.includes('how to')) {
            return `📚 **Lab Work Study Tips**:\n\n• **Preparation**: Read procedures and theory before lab sessions\n• **Active Note-Taking**: Document observations, measurements, and thoughts\n• **Question Everything**: Ask "why" and "what if" to deepen understanding\n• **Practice Techniques**: Repetition builds skill and confidence\n• **Error Analysis**: Learn from mistakes - they're valuable teaching moments\n• **Collaborate**: Discuss procedures and results with classmates\n• **Review Regularly**: Go over lab work soon after completion\n• **Connect Theory to Practice**: Link lab work to course concepts\n\n**Remember**: Lab work is about developing both technical skills and scientific thinking!`;
        }
        
        // Organization and best practices
        if (lowerMessage.includes('organiz') || lowerMessage.includes('best practice') || lowerMessage.includes('manage') || lowerMessage.includes('efficiency')) {
            return `📋 **Lab Organization Excellence**:\n\n• **Systematic Labeling**: Use clear, consistent labeling systems for all materials\n• **Inventory Management**: Regular audits and real-time tracking\n• **Standard Operating Procedures (SOPs)**: Document all common procedures\n• **Digital Records**: Use lab management software for tracking and scheduling\n• **Space Optimization**: Organize equipment by frequency of use\n• **Communication Systems**: Establish clear protocols for reporting and updates\n• **Training Programs**: Comprehensive onboarding for new users\n• **Quality Control**: Regular reviews and continuous improvement\n\n**Pro Tip**: A well-organized lab saves time, prevents errors, and improves safety!`;
        }

        // Research and academic guidance
        if (lowerMessage.includes('research') || lowerMessage.includes('experiment') || lowerMessage.includes('data') || lowerMessage.includes('analysis')) {
            return `🔬 **Research Excellence Tips**:\n\n• **Hypothesis Development**: Clear, testable predictions based on literature\n• **Experimental Design**: Control variables and use appropriate sample sizes\n• **Data Collection**: Accurate, precise, and systematic recording\n• **Statistical Analysis**: Choose appropriate methods for your data type\n• **Reproducibility**: Document everything so others can replicate your work\n• **Literature Review**: Stay current with recent developments in your field\n• **Peer Review**: Share work with colleagues for feedback\n• **Ethical Considerations**: Follow all ethical guidelines and regulations\n\n**Key**: Good research combines creativity with rigorous methodology!`;
        }

        // Technology and software
        if (lowerMessage.includes('software') || lowerMessage.includes('computer') || lowerMessage.includes('technology') || lowerMessage.includes('digital')) {
            return `💻 **Lab Technology Management**:\n\n• **Software Updates**: Keep all lab software current and licensed\n• **Data Backup**: Regular, automated backups of important data\n• **Security Protocols**: Use strong passwords and access controls\n• **User Access**: Manage permissions based on roles and responsibilities\n• **Documentation**: Maintain software manuals and user guides\n• **Technical Support**: Establish clear procedures for technical issues\n• **Integration**: Ensure different systems work together effectively\n• **Training**: Regular training on software updates and new features\n\n**Remember**: Technology should enhance lab efficiency, not complicate it!`;
        }

        // Time management and scheduling
        if (lowerMessage.includes('time') || lowerMessage.includes('schedule') || lowerMessage.includes('planning') || lowerMessage.includes('deadline')) {
            return `⏰ **Lab Time Management Strategies**:\n\n• **Advance Planning**: Book equipment and plan procedures well ahead\n• **Time Estimation**: Build in extra time for unexpected complications\n• **Priority Setting**: Focus on critical experiments during peak hours\n• **Batch Processing**: Group similar tasks to improve efficiency\n• **Break Scheduling**: Regular breaks prevent fatigue and errors\n• **Documentation Time**: Allocate time for proper record-keeping\n• **Buffer Time**: Always have contingency plans for equipment failures\n• **Review Sessions**: Regular evaluation of time usage and efficiency\n\n**Tip**: Good lab time management reduces stress and improves results!`;
        }

        // Problem-solving and troubleshooting
        if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('trouble') || lowerMessage.includes('error')) {
            return `🔍 **Lab Troubleshooting Framework**:\n\n• **Document Everything**: Record what happened, when, and under what conditions\n• **Systematic Approach**: Check one variable at a time\n• **Basic Checks First**: Verify power, connections, and basic settings\n• **Consult Resources**: Check manuals, protocols, and online resources\n• **Ask for Help**: Don't hesitate to consult experienced colleagues\n• **Test Solutions**: Try simple fixes before complex interventions\n• **Record Solutions**: Document what worked for future reference\n• **Follow-up**: Monitor to ensure the problem doesn't recur\n\n**Remember**: Most lab problems have been solved before - learn from others' experience!`;
        }

        // Default helpful response
        return `🤖 **AI Assistant**: I'm here to help with your lab management needs! While I'm currently working on my connection to Gemini AI, I can provide guidance on:\n\n• **Lab Safety**: Protocols, best practices, and emergency procedures\n• **Equipment Care**: Maintenance, calibration, and troubleshooting\n• **Study Tips**: Effective lab work and research strategies\n• **Organization**: Best practices for lab management and efficiency\n• **Research**: Experimental design and data analysis guidance\n• **Technology**: Software and digital tool management\n\n**For specific lab data**, try asking questions like:\n• "How many labs do I have?"\n• "Show available equipment"\n• "Find computers with i7 processors"\n\nWhat specific area would you like help with?`;
    }
}

async function logChatInteraction(userId, message, parsedQuery, response) {
    try {
        const responseData = {
            text: response,
            timestamp: new Date().toISOString(),
            queryType: parsedQuery.queryType
        };

        await sequelize.query(
            'INSERT INTO chat_interactions (user_id, message, intent, entities, specific_item, response, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            {
                replacements: [
                    userId,
                    message,
                    parsedQuery.queryType,
                    JSON.stringify(parsedQuery.entities),
                    parsedQuery.specificItem || null,
                    JSON.stringify(responseData),
                    parsedQuery.confidence
                ]
            }
        );
    } catch (error) {
        console.error('Failed to log chat interaction:', error);
        // Don't throw error here - logging failure shouldn't break the chat
    }
}

// Test endpoint for AI without authentication (for testing)
router.post('/test-ai', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        console.log('Testing Gemini AI with message:', message);

        const context = `You are a helpful lab management assistant for NEC (National Engineering College) Laboratory Management System. 
User query: ${message}

Provide a brief, helpful response about laboratory management, safety, or academic advice.`;

        try {
            // Try multiple models in order of preference (Updated with working models)
            const models = ['models/gemini-2.5-flash', 'models/gemini-2.5-pro', 'models/gemini-flash-latest', 'models/gemini-pro-latest'];
            let aiResponse = null;
            let workingModel = null;
            
            for (const modelName of models) {
                try {
                    console.log(`Testing model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ 
                        model: modelName,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 200,
                        }
                    });
                    const result = await model.generateContent(context);
                    const response = await result.response;
                    aiResponse = response.text();
                    workingModel = modelName;
                    console.log(`✅ Success with ${modelName}`);
                    break;
                } catch (modelError) {
                    console.log(`❌ ${modelName} failed:`, modelError.message.substring(0, 80));
                    continue;
                }
            }
            
            if (aiResponse && workingModel) {
                console.log('Gemini AI response received successfully');
                res.json({
                    success: true,
                    response: `🤖 **Gemini AI (${workingModel})**: ${aiResponse}`,
                    message: 'AI test successful',
                    source: 'gemini',
                    model: workingModel
                });
                return;
            }
            
            throw new Error('All Gemini models failed');
            
        } catch (geminiError) {
            console.log('Gemini AI failed, using intelligent fallback:', geminiError.message);
            
            // Intelligent fallback response
            const lowerMessage = message.toLowerCase();
            let fallbackResponse = '';
            
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                fallbackResponse = "Hello! I'm your lab management assistant. I can help with safety protocols, equipment maintenance, study tips, and lab organization. What would you like to know?";
            } else if (lowerMessage.includes('safety')) {
                fallbackResponse = "Lab safety is crucial! Always wear PPE, follow protocols, and report incidents. Need specific safety information?";
            } else if (lowerMessage.includes('equipment')) {
                fallbackResponse = "For equipment management: maintain regular calibration schedules, document everything, and ensure proper training for all users.";
            } else if (lowerMessage.includes('test')) {
                fallbackResponse = "Chatbot is working! While Gemini AI is being configured, I can still provide helpful lab management guidance and access your lab data.";
            } else {
                fallbackResponse = `I can help with lab management topics like safety protocols, equipment maintenance, study tips, and organization. For specific lab data, try asking about equipment counts or availability.`;
            }
            
            res.json({
                success: true,
                response: `🤖 **AI Assistant**: ${fallbackResponse}\n\n💡 *Note: Currently using enhanced fallback responses while Gemini AI is being configured.*`,
                message: 'AI fallback successful',
                source: 'fallback'
            });
        }

    } catch (error) {
        console.error('AI Test error:', error);
        res.status(500).json({
            success: false,
            message: `AI test failed: ${error.message}`,
            error: error.toString()
        });
    }
});

module.exports = router;