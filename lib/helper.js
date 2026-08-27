const fs = require('fs');

/**
 * Clean and format phone numbers or JIDs
 */
const formatJid = (number) => {
    if (!number) return '';
    return number.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
};

/**
 * Format timestamp to a readable date/time string
 */
const getCurrentTime = () => {
    const options = { timeZone: 'America/Port-au-Prince', hour12: true, hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return new Date().toLocaleTimeString('en-US', options);
};

/**
 * Sanitize text for filenames or general safety
 */
const sanitizeText = (text) => {
    if (!text) return '';
    return text.replace(/[^\w\s]/gi, '').trim();
};

/**
 * Check if a file exists locally
 */
const fileExists = (filePath) => {
    return fs.existsSync(filePath);
};

module.exports = {
    formatJid,
    getCurrentTime,
    sanitizeText,
    fileExists
};
