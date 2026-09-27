
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile, unlink, readdir, stat } = require('fs/promises');
const { getOwnerNumber } = require('../lib/botConfig');

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// Enhanced configuration with multiple modes
const DEFAULT_CONFIG = {
    enabled: false,
    mode: 'private', // 'private', 'chat', 'both'
    notifyGroups: true,
    notifyPM: true,
    maxStorageMB: 200,
    cleanupInterval: 60, // minutes
    autoCleanup: true,
    excludedChats: [],
    captureMedia: true,
    captureText: true,
    antiViewOnce: true,
    maxMessages: 5000 // Prevent memory leaks
};

// Initialize system on load
let cleanupInterval = null;
initializeSystem();

const { createFakeContact } = require('../lib/fakeContact');
function initializeSystem() {
    ensureTempDir();
    startCleanupInterval();
}

// Ensure tmp dir exists
async function ensureTempDir() {
    try {
        await fs.promises.mkdir(TEMP_MEDIA_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating temp directory:', err);
    }
}

// Enhanced folder size calculation with async
async function getFolderSizeInMB(folderPath) {
    try {
        const files = await readdir(folderPath);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            try {
                const stats = await stat(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                }
            } catch (err) {
                // Skip files that can't be stated
                continue;
            }
        }

        return totalSize / (1024 * 1024);
    } catch (err) {
        console.error('Error getting folder size:', err);
        return 0;
    }
}

// Enhanced cleanup with async operations and better file management
async function cleanTempFolder() {
    try {
        const config = loadAntideleteConfig();
        const sizeMB = await getFolderSizeInMB(TEMP_MEDIA_DIR);

        if (sizeMB > config.maxStorageMB) {
            const files = await readdir(TEMP_MEDIA_DIR);
            let deletedCount = 0;

            // Delete files one by one to avoid overwhelming the system
            for (const file of files) {
                const filePath = path.join(TEMP_MEDIA_DIR, file);
                try {
                    await unlink(filePath);
                    deletedCount++;
                } catch (err) {
                    console.error(`Error deleting file ${file}:`, err);
                }
            }

            console.log(`🧹 Cleaned temp folder: ${deletedCount} files removed`);
            return deletedCount;
        }
        return 0;
    } catch (err) {
        console.error('Temp cleanup error:', err);
        return 0;
    }
}

// Enhanced config management
function loadAntideleteConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            saveAntideleteConfig(DEFAULT_CONFIG);
            return DEFAULT_CONFIG;
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        return { ...DEFAULT_CONFIG, ...config };
    } catch (err) {
        console.error('Config load error:', err);
        return DEFAULT_CONFIG;
    }
}

function saveAntideleteConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        console.error('Config save error:', err);
        return false;
    }
}

// Start cleanup interval
function startCleanupInterval() {
    const config = loadAntideleteConfig();
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
    }

    cleanupInterval = setInterval(() => {
        cleanTempFolder().catch(console.error);
    }, config.cleanupInterval * 60 * 1000);
}

// Check if user is authorized
async function isAuthorized(message) {
    try {
        const { isSudo } = require('../lib/index');
        const senderId = message.key.participant || message.key.remoteJid;
        return message.key.fromMe || await isSudo(senderId);
    } catch (err) {
        return message.key.fromMe;
    }
}

// Enhanced command handler with multiple modes
async function handleAntideleteCommand(sock, chatId, message, match) {
    if (!await isAuthorized(message)) {
        return sock.sendMessage(chatId, {
            text: '*🚫 Only the bot owner can use this command.*'
        }, { quoted: createFakeContact(message) });
    }

    const config = loadAntideleteConfig();

    if (!match) {
        return showStatus(sock, chatId, message, config);
    }

    const command = match.toLowerCase().trim();
    return processCommand(sock, chatId, message, command, config);
}

async function showStatus(sock, chatId, message, config) {
    const statusEmoji = config.enabled ? '✅' : '❌';
    const modeEmoji = {
        private: '🔒',
        chat: '💬',
        both: '🔔'
    }[config.mode] || '❓';

    const sizeMB = await getFolderSizeInMB(TEMP_MEDIA_DIR);

    let text = `*🛡️ ANTIDELETE SYSTEM*\n\n`;
    text += `*Status:* ${statusEmoji} ${config.enabled ? 'ENABLED' : 'DISABLED'}\n`;
    text += `*Mode:* ${modeEmoji} ${config.mode.toUpperCase()}\n`;
    text += `*🗃️ Storage:* ${sizeMB.toFixed(2)}MB / ${config.maxStorageMB}MB\n`;
    text += `*📨 Messages Tracked:* ${messageStore.size}\n`;
    text += `*🚫 Excluded Chats:* ${config.excludedChats.length}\n\n`;

    text += `*📋 COMMANDS:*\n`;
    text += `• *antidelete on/off* - Toggle system\n`;
    text += `• *antidelete private* - Notify only bot owner\n`;
    text += `• *antidelete chat* - Notify in same chat\n`;
    text += `• *antidelete both* - Notify both owner and chat\n`;
    text += `• *antidelete exclude* - Exclude current chat\n`;
    text += `• *antidelete include* - Include current chat\n`;
    text += `• *antidelete clean* - Clean temp files\n`;
    text += `• *antidelete stats* - Show statistics\n`;

    return sock.sendMessage(chatId, { text }, { quoted: createFakeContact(message) });
}

async function processCommand(sock, chatId, message, command, config) {
    let responseText = '';

    switch (command) {
        case 'on':
            config.enabled = true;
            responseText = '✅ *Antidelete system ENABLED*';
            break;

        case 'off':
            config.enabled = false;
            responseText = '❌ *Antidelete system DISABLED*';
            break;

        case 'private':
            config.mode = 'private';
            responseText = '🔒 *Mode set to PRIVATE* - Notifications will be sent to bot owner only';
            break;

        case 'chat':
            config.mode = 'chat';
            responseText = '💬 *Mode set to CHAT* - Notifications will be sent in the same chat';
            break;

        case 'both':
            config.mode = 'both';
            responseText = '🔔 *Mode set to BOTH* - Notifications will be sent to both owner and chat';
            break;

        case 'exclude':
            if (!config.excludedChats.includes(chatId)) {
                config.excludedChats.push(chatId);
                responseText = '🚫 *Chat added to exclusion list*';
            } else {
                responseText = 'ℹ️ *Chat is already excluded*';
            }
            break;

        case 'include':
            config.excludedChats = config.excludedChats.filter(id => id !== chatId);
            responseText = '✅ *Chat removed from exclusion list*';
            break;

        case 'clean':
            const deletedCount = await cleanTempFolder();
            responseText = `🧹 *Temporary files cleaned* (${deletedCount} files removed)`;
            break;

        case 'stats':
            const sizeMB = await getFolderSizeInMB(TEMP_MEDIA_DIR);
            responseText = `*📊 SYSTEM STATISTICS*\n\n` +
                          `*Messages in memory:* ${messageStore.size}\n` +
                          `*Storage used:* ${sizeMB.toFixed(2)}MB\n` +
                          `*Excluded chats:* ${config.excludedChats.length}\n` +
                          `*Uptime:* ${Math.floor(process.uptime() / 60)} minutes`;
            break;

        default:
            responseText = '❌ *Invalid command. Use* `.antidelete` *to see all options.*';
    }

    if (responseText && !responseText.includes('Invalid')) {
        const saved = saveAntideleteConfig(config);
        if (saved) {
            startCleanupInterval();
        } else {
            responseText += '\n\n⚠️ *Warning: Config could not be saved*';
        }
    }

    return sock.sendMessage(chatId, { text: responseText }, { quoted: createFakeContact(message) });
}

// Enhanced message storage with better media handling
async function storeMessage(sock, message) {
    try {
        await ensureTempDir();

        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        // Check if chat is excluded
        const chatId = message.key.remoteJid;
        if (config.excludedChats.includes(chatId)) return;

        if (!message.key?.id) return;

        // Clean old messages if limit reached
        if (messageStore.size >= config.maxMessages) {
            const firstKey = messageStore.keys().next().value;
            const oldMessage = messageStore.get(firstKey);
            messageStore.delete(firstKey);
            // Cleanup old media file
            if (oldMessage?.mediaPath) {
                unlink(oldMessage.mediaPath).catch(() => {});
            }
        }

        const messageId = message.key.id;
        const sender = message.key.participant || message.key.remoteJid;
        const senderPhone = message.key.participantPn || message.key.senderPn || global.lidPhoneMap?.get(message.key.id) || null;

        const storedMessage = {
            content: '',
            mediaType: '',
            mediaPath: '',
            sender,
            senderPhone,
            chatId,
            group: chatId.endsWith('@g.us') ? chatId : null,
            timestamp: Date.now(),
            isViewOnce: false
        };

        // Extract content and media
        await extractMessageContent(message, storedMessage, config);

        if (storedMessage.content || storedMessage.mediaType) {
            messageStore.set(messageId, storedMessage);

            // Handle view-once immediately
            if (storedMessage.isViewOnce && storedMessage.mediaPath) {
                await handleViewOnceForward(sock, config, storedMessage);
            }
        }

    } catch (err) {
        console.error('storeMessage error:', err);
    }
}

async function extractMessageContent(message, storedMessage, config) {
    try {
        const viewOnceContainer = message.message?.viewOnceMessageV2?.message ||
                               message.message?.viewOnceMessage?.message;

        if (viewOnceContainer && config.antiViewOnce) {
            await handleViewOnceMessage(viewOnceContainer, storedMessage);
            return;
        }

        // Text messages
        if (config.captureText) {
            if (message.message?.conversation) {
                storedMessage.content = message.message.conversation;
            } else if (message.message?.extendedTextMessage?.text) {
                storedMessage.content = message.message.extendedTextMessage.text;
            }
        }

        // Media messages
        if (config.captureMedia) {
            await handleMediaMessage(message, storedMessage);
        }

    } catch (err) {
        console.error('extractMessageContent error:', err);
    }
}

async function handleViewOnceMessage(viewOnceContainer, storedMessage) {
    try {
        storedMessage.isViewOnce = true;

        if (viewOnceContainer.imageMessage) {
            storedMessage.mediaType = 'image';
            storedMessage.content = viewOnceContainer.imageMessage.caption || '';
            storedMessage.mediaPath = await downloadMedia(
                viewOnceContainer.imageMessage,
                'image',
                `${storedMessage.timestamp}_viewonce.jpg`
            );
        } else if (viewOnceContainer.videoMessage) {
            storedMessage.mediaType = 'video';
            storedMessage.content = viewOnceContainer.videoMessage.caption || '';
            storedMessage.mediaPath = await downloadMedia(
                viewOnceContainer.videoMessage,
                'video',
                `${storedMessage.timestamp}_viewonce.mp4`
            );
        }
    } catch (err) {
        console.error('handleViewOnceMessage error:', err);
    }
}

async function handleMediaMessage(message, storedMessage) {
    try {
        const msg = message.message;

        if (msg.imageMessage) {
            storedMessage.mediaType = 'image';
            storedMessage.content = msg.imageMessage.caption || '';
            storedMessage.mediaPath = await downloadMedia(
                msg.imageMessage,
                'image',
                `${storedMessage.timestamp}.jpg`
            );
        } else if (msg.stickerMessage) {
            storedMessage.mediaType = 'sticker';
            storedMessage.mediaPath = await downloadMedia(
                msg.stickerMessage,
                'sticker',
                `${storedMessage.timestamp}.webp`
            );
        } else if (msg.videoMessage) {
            storedMessage.mediaType = 'video';
            storedMessage.content = msg.videoMessage.caption || '';
            storedMessage.mediaPath = await downloadMedia(
                msg.videoMessage,
                'video',
                `${storedMessage.timestamp}.mp4`
            );
        } else if (msg.audioMessage) {
            storedMessage.mediaType = 'audio';
            const mime = msg.audioMessage.mimetype || '';
            const ext = mime.includes('mpeg') ? 'mp3' : (mime.includes('ogg') ? 'ogg' : 'mp3');
            storedMessage.mediaPath = await downloadMedia(
                msg.audioMessage,
                'audio',
                `${storedMessage.timestamp}.${ext}`
            );
        } else if (msg.documentMessage) {
            storedMessage.mediaType = 'document';
            storedMessage.content = msg.documentMessage.fileName || 'Document';
            const fileName = msg.documentMessage.fileName || 'file';
            storedMessage.mediaPath = await downloadMedia(
                msg.documentMessage,
                'document',
                `${storedMessage.timestamp}_${fileName}`
            );
        }
    } catch (err) {
        console.error('handleMediaMessage error:', err);
    }
}

// Helper function for media download
async function downloadMedia(message, type, fileName) {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const filePath = path.join(TEMP_MEDIA_DIR, fileName);
        await writeFile(filePath, buffer);
        return filePath;
    } catch (err) {
        console.error(`Error downloading ${type}:`, err);
        return null;
    }
}

// Enhanced view-once handling with mode support
async function handleViewOnceForward(sock, config, storedMessage) {
    try {
        if (!storedMessage.mediaPath || !fs.existsSync(storedMessage.mediaPath)) return;

        const senderName = storedMessage.sender.split('@')[0];
        const mediaOptions = {
            caption: `*🔒 Anti-ViewOnce ${storedMessage.mediaType.toUpperCase()}*\nFrom: @${senderName}\nChat: ${storedMessage.chatId}`,
            mentions: [storedMessage.sender]
        };

        const targets = getNotificationTargets(sock, storedMessage.chatId, config);

        for (const target of targets) {
            try {
                if (storedMessage.mediaType === 'image') {
                    await sock.sendMessage(target, {
                        image: { url: storedMessage.mediaPath },
                        ...mediaOptions
                    }, { quoted: createFakeContact(message) });
                } else if (storedMessage.mediaType === 'video') {
                    await sock.sendMessage(target, {
                        video: { url: storedMessage.mediaPath },
                        ...mediaOptions
                    }, { quoted: createFakeContact(message) });
                }
            } catch (e) {
                console.error(`Error sending view-once to ${target}:`, e);
            }
        }

        // Cleanup view-once immediately after forwarding
        try {
            await unlink(storedMessage.mediaPath);
            messageStore.delete(storedMessage.timestamp); // Use timestamp as key
        } catch (e) {
            // Ignore cleanup errors
        }
    } catch (e) {
        console.error('ViewOnce forward error:', e);
    }
}

// Get notification targets based on mode
function getNotificationTargets(sock, chatId, config) {
    const targets = [];
    const ownerNumber = `${getOwnerNumber().replace(/[^0-9]/g, '')}@s.whatsapp.net`;

    if (config.mode === 'private' || config.mode === 'both') {
        targets.push(ownerNumber);
    }

    if ((config.mode === 'chat' || config.mode === 'both') && chatId !== ownerNumber) {
        targets.push(chatId);
    }

    return targets;
}

// Enhanced message deletion handler
async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig();
        if (!config.enabled) return;

        const messageId = revocationMessage.message?.protocolMessage?.key?.id;
        if (!messageId) return;

        const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Don't process if bot deleted the message
        if (deletedBy.includes(sock.user.id) || deletedBy === ownerNumber) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        // Don't process if chat is excluded
        if (config.excludedChats.includes(original.chatId)) {
            messageStore.delete(messageId);
            return;
        }

        const targets = getNotificationTargets(sock, original.chatId, config);
        if (targets.length === 0) return;

        await sendDeletionNotification(sock, original, deletedBy, targets);

        // Cleanup
        cleanupStoredMessage(messageId, original);

    } catch (err) {
        console.error('handleMessageRevocation error:', err);
    }
}

function cleanupStoredMessage(messageId, original) {
    messageStore.delete(messageId);

    if (original.mediaPath && fs.existsSync(original.mediaPath)) {
        unlink(original.mediaPath).catch(err => {
            console.error('Media cleanup error:', err);
        });
    }
}

// Enhanced notification sending
async function sendDeletionNotification(sock, original, deletedBy, targets) {
    try {
        const senderName = original.sender.split('@')[0];
        const deleterName = deletedBy.split('@')[0];

        let groupName = '';
        if (original.group) {
            try {
                const metadata = await sock.groupMetadata(original.group);
                groupName = metadata.subject;
            } catch (e) {
                groupName = 'Unknown Group';
            }
        }

        const time = new Date(original.timestamp).toLocaleString('en-US', {
            timeZone: 'Africa/Nairobi',
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        let text = `*🗑️ ANTIDELETE REPORT 🗑️*\n\n` +
            `*🗑️ Deleted By:* @${deleterName}\n` +
            `*👤 Sender:* @${senderName}\n` +
            `*📱 Number:* ${(original.senderPhone || original.sender).split('@')[0].split(':')[0]}\n` +
            `*🕒 Time:* ${time}\n`;

        if (groupName) {
            text += `*👥 Group:* ${groupName}\n`;
        }

        if (original.isViewOnce) {
            text += `*🔒 Type:* View Once ${original.mediaType?.toUpperCase() || 'Media'}\n`;
        }

        if (original.content) {
            text += `\n*💬 Deleted Message:*\n${original.content}`;
        }

        const textMessage = {
            text,
            mentions: [deletedBy, original.sender]
        };

        // Send text notification to all targets
        for (const target of targets) {
            try {
                await sock.sendMessage(target, textMessage);
            } catch (err) {
                console.error(`Error sending text to ${target}:`, err);
            }
        }

        // Send media if exists
        if (original.mediaType && original.mediaPath && fs.existsSync(original.mediaPath)) {
            await sendMediaNotification(sock, original, targets);
        }

    } catch (err) {
        console.error('sendDeletionNotification error:', err);
    }
}

// Enhanced media notification
async function sendMediaNotification(sock, original, targets) {
    const senderName = original.sender.split('@')[0];
    const mediaOptions = {
        caption: `*Deleted ${original.mediaType}*${original.isViewOnce ? ' (View Once)' : ''}\nFrom: @${senderName}`,
        mentions: [original.sender]
    };

    for (const target of targets) {
        try {
            switch (original.mediaType) {
                case 'image':
                    await sock.sendMessage(target, {
                        image: { url: original.mediaPath },
                        ...mediaOptions
                    });
                    break;
                case 'sticker':
                    await sock.sendMessage(target, {
                        sticker: { url: original.mediaPath },
                        ...mediaOptions
                    });
                    break;
                case 'video':
                    await sock.sendMessage(target, {
                        video: { url: original.mediaPath },
                        ...mediaOptions
                    });
                    break;
                case 'audio':
                    await sock.sendMessage(target, {
                        audio: { url: original.mediaPath },
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        ...mediaOptions
                    });
                    break;
                case 'document':
                    await sock.sendMessage(target, {
                        document: { url: original.mediaPath },
                        fileName: path.basename(original.mediaPath),
                        ...mediaOptions
                    });
                    break;
            }
        } catch (err) {
            console.error(`Error sending media to ${target}:`, err);
        }
    }
}

module.exports = {
    handleAntideleteCommand,
    handleMessageRevocation,
    storeMessage,
    cleanTempFolder
};
