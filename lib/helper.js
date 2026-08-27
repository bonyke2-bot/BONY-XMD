const fs = require('fs');
const axios = require('axios');

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

/**
 * Helper to fetch buffer from a URL (useful for downloading images/audio/videos)
 */
const getBuffer = async (url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch buffer: ${error.message}`);
    }
};

module.exports = {
    formatJid,
    getCurrentTime,
    sanitizeText,
    fileExists,
    getBuffer
};
