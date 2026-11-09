// lib/database.js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);

// ==================== ANTI-CALL SETTINGS ====================
const SETTINGS_FILE = path.join(__dirname, '../data/anticall.json');

const defaultSettings = {
  status: false,
  action: 'reject',
  message: "📵 Sorry, I don't accept WhatsApp calls. Please send me a message instead. Thank you!"
};

// Ensure directory exists asynchronously
async function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  try {
    await accessAsync(dir);
  } catch {
    await mkdirAsync(dir, { recursive: true });
  }
}

// Ensure settings file exists
async function ensureSettingsFile() {
  await ensureDirectory(SETTINGS_FILE);

  try {
    await accessAsync(SETTINGS_FILE);
  } catch {
    await writeFileAsync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
}

// Get anti-call settings
async function getAntiCallSettings() {
  try {
    await ensureSettingsFile();
    const data = await readFileAsync(SETTINGS_FILE, 'utf8');

    if (!data.trim()) {
      return { ...defaultSettings };
    }

    const parsed = JSON.parse(data);

    // Validate and sanitize parsed data
    return {
      status: typeof parsed.status === 'boolean' ? parsed.status : defaultSettings.status,
      action: ['reject', 'block'].includes(parsed.action) ? parsed.action : defaultSettings.action,
      message: typeof parsed.message === 'string' ? parsed.message : defaultSettings.message
    };
  } catch (error) {
    console.error('Error reading anti-call settings:', error.message);
    return { ...defaultSettings };
  }
}

// Update anti-call settings
async function updateAntiCallSettings(updates) {
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates must be an object');
  }

  try {
    await ensureSettingsFile();
    const currentSettings = await getAntiCallSettings();

    // Validate updates
    const sanitizedUpdates = {};

    if (updates.status !== undefined) {
      sanitizedUpdates.status = Boolean(updates.status);
    }

    if (updates.message !== undefined) {
      sanitizedUpdates.message = String(updates.message).slice(0, 1000);
    }

    if (updates.action !== undefined) {
      sanitizedUpdates.action = ['reject', 'block'].includes(updates.action)
        ? updates.action
        : currentSettings.action;
    }

    const newSettings = { ...currentSettings, ...sanitizedUpdates };

    // Write with atomic operation (write to temp file first)
    const tempFile = `${SETTINGS_FILE}.tmp`;
    await writeFileAsync(tempFile, JSON.stringify(newSettings, null, 2));
    await fs.promises.rename(tempFile, SETTINGS_FILE);

    return newSettings;
  } catch (error) {
    console.error('Error updating anti-call settings:', error.message);
    throw new Error(`Failed to update anti-call settings: ${error.message}`);
  }
}

// ==================== ANTI-STICKER SETTINGS ====================
const DATA_FILE = path.join(__dirname, '../data/antisticker.json');

// Ensure file exists
async function ensureDataFile() {
  await ensureDirectory(DATA_FILE);

  try {
    await accessAsync(DATA_FILE);
  } catch {
    await writeFileAsync(DATA_FILE, JSON.stringify({}, null, 2));
  }
}

// Read JSON with validation
async function readData() {
  try {
    await ensureDataFile();
    const data = await readFileAsync(DATA_FILE, 'utf8');

    if (!data.trim()) {
      return {};
    }

    const parsed = JSON.parse(data);

    // Ensure parsed data is an object
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    return parsed;
  } catch (error) {
    console.error('Error reading antisticker data:', error.message);
    return {};
  }
}

// Write JSON with atomic operation
async function writeData(data) {
  try {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Data must be a non-null object');
    }

    await ensureDataFile();

    // Atomic write
    const tempFile = `${DATA_FILE}.tmp`;
    await writeFileAsync(tempFile, JSON.stringify(data, null, 2));
    await fs.promises.rename(tempFile, DATA_FILE);

    return true;
  } catch (error) {
    console.error('Error writing antisticker data:', error.message);
    throw new Error(`Failed to write antisticker data: ${error.message}`);
  }
}

// Validate chat ID
function validateChatId(chatId) {
  if (!chatId || typeof chatId !== 'string') {
    throw new Error('Invalid chat ID: must be a non-empty string');
  }
  return chatId;
}

// Validate action
function validateAction(action) {
  const validActions = ['delete', 'warn', 'kick'];
  if (action && !validActions.includes(action)) {
    throw new Error(`Invalid action: must be one of ${validActions.join(', ')}`);
  }
  return action || 'delete';
}

// Set config with validation
async function setAntisticker(chatId, status, action) {
  try {
    const validChatId = validateChatId(chatId);
    const enabled = status === 'on' || status === true;
    const validAction = validateAction(action);

    const data = await readData();

    // Create new config
    data[validChatId] = {
      enabled,
      action: validAction,
      updatedAt: new Date().toISOString()
    };

    await writeData(data);
    return data[validChatId];
  } catch (error) {
    console.error('Error setting antisticker:', error.message);
    throw error;
  }
}

// Get config with validation
async function getAntisticker(chatId) {
  try {
    const validChatId = validateChatId(chatId);
    const data = await readData();
    const config = data[validChatId];

    // Return null if no config exists
    return config ? { ...config } : null;
  } catch (error) {
    console.error('Error getting antisticker:', error.message);
    return null;
  }
}

// Remove config
async function removeAntisticker(chatId) {
  try {
    const validChatId = validateChatId(chatId);
    const data = await readData();

    if (!data[validChatId]) {
      return false; // Config didn't exist
    }

    delete data[validChatId];
    await writeData(data);
    return true;
  } catch (error) {
    console.error('Error removing antisticker:', error.message);
    throw error;
  }
}

// Get all antisticker settings
async function getAllAntisticker() {
  try {
    return await readData();
  } catch (error) {
    console.error('Error getting all antisticker settings:', error.message);
    return {};
  }
}

// Clear all antisticker settings
async function clearAllAntisticker() {
  try {
    await writeData({});
    return true;
  } catch (error) {
    console.error('Error clearing antisticker settings:', error.message);
    throw error;
  }
}

// ==================== ANTI-IMAGE SETTINGS ====================
const ANTIIMAGE_FILE = path.join(__dirname, '../data/antiimage.json');

async function ensureAntiimageFile() {
  await ensureDirectory(ANTIIMAGE_FILE);
  try {
    await accessAsync(ANTIIMAGE_FILE);
  } catch {
    await writeFileAsync(ANTIIMAGE_FILE, JSON.stringify({}, null, 2));
  }
}

async function readAntiimageData() {
  try {
    await ensureAntiimageFile();
    const data = await readFileAsync(ANTIIMAGE_FILE, 'utf8');
    if (!data.trim()) return {};
    const parsed = JSON.parse(data);
    return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
  } catch (error) {
    console.error('Error reading antiimage data:', error.message);
    return {};
  }
}

async function writeAntiimageData(data) {
  try {
    if (typeof data !== 'object' || data === null) throw new Error('Data must be a non-null object');
    await ensureAntiimageFile();
    const tempFile = `${ANTIIMAGE_FILE}.tmp`;
    await writeFileAsync(tempFile, JSON.stringify(data, null, 2));
    await fs.promises.rename(tempFile, ANTIIMAGE_FILE);
    return true;
  } catch (error) {
    console.error('Error writing antiimage data:', error.message);
    throw error;
  }
}

async function setAntiimage(chatId, enabled, action) {
  const validChatId = validateChatId(chatId);
  const validActions = ['delete', 'warn', 'kick'];
  const validAction = (action && validActions.includes(action)) ? action : 'delete';
  const data = await readAntiimageData();
  data[validChatId] = { enabled: !!enabled, action: validAction, updatedAt: new Date().toISOString() };
  await writeAntiimageData(data);
  return data[validChatId];
}

async function getAntiimage(chatId) {
  try {
    const validChatId = validateChatId(chatId);
    const data = await readAntiimageData();
    return data[validChatId] || null;
  } catch (error) {
    console.error('Error getting antiimage:', error.message);
    return null;
  }
}

async function removeAntiimage(chatId) {
  const validChatId = validateChatId(chatId);
  const data = await readAntiimageData();
  if (!data[validChatId]) return false;
  delete data[validChatId];
  await writeAntiimageData(data);
  return true;
}

module.exports = {
  // Anti-call
  getAntiCallSettings,
  updateAntiCallSettings,

  // Anti-sticker
  setAntisticker,
  getAntisticker,
  removeAntisticker,
  getAllAntisticker,
  clearAllAntisticker,

  // Anti-image
  setAntiimage,
  getAntiimage,
  removeAntiimage
};
