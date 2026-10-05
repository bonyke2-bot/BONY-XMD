const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

const antiStatusMentionData = { settings: {}, warns: {} };

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'antistatusmention.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadData() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, 'utf8');
            Object.assign(antiStatusMentionData, JSON.parse(raw));
        }
    } catch (e) {
        console.error('\x1b[35m[AntiStatusMention] Load error:\x1b[0m', e);
    }
}

function saveData() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(antiStatusMentionData, null, 2));
    } catch (e) {
        console.error('\x1b[35m[AntiStatusMention] Save error:\x1b[0m', e);
    }
}

loadData();

async function getSettings(chatId) {
    return antiStatusMentionData.settings[chatId] || { action: 'off', warn_limit: 3 };
}

async function updateSettings(chatId, updates) {
    if (!antiStatusMentionData.settings[chatId]) {
        antiStatusMentionData.settings[chatId] = { action: 'off', warn_limit: 3 };
    }
    Object.assign(antiStatusMentionData.settings[chatId], updates);
    saveData();
}

async function getWarnCount(chatId, userId) {
    return antiStatusMentionData.warns[chatId]?.[userId] || 0;
}

async function addWarn(chatId, userId) {
    if (!antiStatusMentionData.warns[chatId]) antiStatusMentionData.warns[chatId] = {};
    antiStatusMentionData.warns[chatId][userId] = (antiStatusMentionData.warns[chatId][userId] || 0) + 1;
    saveData();
    return antiStatusMentionData.warns[chatId][userId];
}

async function resetWarn(chatId, userId) {
    if (antiStatusMentionData.warns[chatId]?.[userId]) {
        delete antiStatusMentionData.warns[chatId][userId];
        saveData();
    }
}

async function clearAllWarns(chatId) {
    delete antiStatusMentionData.warns[chatId];
    saveData();
}

// Dedicated status-mention message types introduced in newer WhatsApp / Baileys versions
const STATUS_MENTION_TYPES = [
    'statusMentionMessage',
    'groupStatusMentionMessage',
    'groupStatusMessage',
    'groupStatusMessageV2',
];

// Regular message types that can carry contextInfo with a status@broadcast reference
const MSG_TYPES = [
    'extendedTextMessage', 'imageMessage', 'videoMessage', 'audioMessage',
    'documentMessage', 'stickerMessage', 'buttonsMessage', 'templateMessage',
    'listMessage', 'locationMessage', 'contactMessage', 'pollCreationMessage',
    'pollUpdateMessage', 'reactionMessage', 'liveLocationMessage',
    'conversation',
];

// Wrapper types whose inner .message should also be inspected
const WRAPPERS = [
    'ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2',
    'viewOnceMessageV2Extension', 'documentWithCaptionMessage',
    'messageContextInfo', 'statusMentionMessage', 'groupStatusMentionMessage',
    'groupStatusMessage', 'groupStatusMessageV2',
];

function unwrapMessage(msg) {
    const candidates = [msg];
    for (const wrapper of WRAPPERS) {
        const inner = msg[wrapper]?.message;
        if (inner) candidates.push(inner);
    }
    return candidates;
}

function hasStatusBroadcast(message) {
    const msg = message.message;
    if (!msg) return false;

    for (const candidate of unwrapMessage(msg)) {
        // 1. Dedicated status-mention message types — presence alone is sufficient
        for (const type of STATUS_MENTION_TYPES) {
            if (candidate[type] != null) return true;
        }

        // 2. contextInfo-based detection (forwarded status / @status mention in text)
        for (const type of MSG_TYPES) {
            const ctx = candidate[type]?.contextInfo;
            if (ctx) {
                if (Array.isArray(ctx.mentionedJid) && ctx.mentionedJid.includes('status@broadcast')) return true;
                if (ctx.remoteJid === 'status@broadcast') return true;
                if (ctx.participant === 'status@broadcast') return true;
            }
        }

        // 3. Top-level contextInfo on the candidate itself
        const topCtx = candidate.contextInfo;
        if (topCtx) {
            if (Array.isArray(topCtx.mentionedJid) && topCtx.mentionedJid.includes('status@broadcast')) return true;
            if (topCtx.remoteJid === 'status@broadcast') return true;
            if (topCtx.participant === 'status@broadcast') return true;
        }
    }
    return false;
}

async function antistatusmentionCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '❌ *Group Command Only*\n\nThis command can only be used in groups!',
                mentions: [message.key.participant || message.key.remoteJid]
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🛡️', key: message.key } });

        const userId = message.key.participant || message.key.remoteJid;
        const adminResult = await isAdmin(sock, chatId, userId);

        if (!adminResult.isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: '❌ *Admin Only*\n\nThis command is only for group admins!',
                mentions: [userId]
            }, { quoted: message });
            return;
        }

        if (!adminResult.isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '❌ *Bot Admin Required*\n\nPlease make the bot an admin first!',
                mentions: [userId]
            }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.trim().split(/\s+/);
        const sub = args[1]?.toLowerCase();
        const val = args[2];

        const groupMetadata = await sock.groupMetadata(chatId).catch(() => null);
        const groupName = groupMetadata ? groupMetadata.subject : chatId;
        const settings = await getSettings(chatId);

        const actionLabel = {
            off:    '❌ OFF',
            warn:   '⚠️ WARN (delete + warn, kick on limit)',
            delete: '🗑️ DELETE (silent delete)',
            kick:   '🚫 KICK (delete + kick immediately)'
        };

        if (!sub || sub === 'status' || sub === 'info') {
            const warnedCount = Object.keys(antiStatusMentionData.warns[chatId] || {}).length;
            return await sock.sendMessage(chatId, {
                text: `*🛡️ Anti-Status-Mention*\n\n` +
                      `┌ *Group:* ${groupName}\n` +
                      `│ *Mode:* ${actionLabel[settings.action] || settings.action}\n` +
                      `│ *Warn limit:* ${settings.warn_limit}\n` +
                      `│ *Users warned:* ${warnedCount}\n` +
                      `└──────────────\n\n` +
                      `*📝 Commands:*\n` +
                      `▸ *.antistatusmention off* — Disable\n` +
                      `▸  *warn* — Delete + warn (kick on limit)\n` +
                      `▸  *delete* — Silent delete only\n` +
                      `▸  *kick* — Delete + kick immediately\n` +
                      `▸  *limit <1-10>* — Set warn limit\n` +
                      `▸  *resetwarns* — Clear all warns`,
                mentions: [userId]
            }, { quoted: message });
        }

        switch (sub) {
            case 'off':
            case 'warn':
            case 'delete':
            case 'kick':
                await updateSettings(chatId, { action: sub });
                await sock.sendMessage(chatId, {
                    text: `✅ *Updated*\n\nAnti-status-mention set to: *${sub.toUpperCase()}*\n\n*Group:* ${groupName}`,
                    mentions: [userId]
                }, { quoted: message });
                break;

            case 'limit': {
                const n = parseInt(val);
                if (isNaN(n) || n < 1 || n > 10) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Please provide a number between *1* and *10*.',
                        mentions: [userId]
                    }, { quoted: message });
                    return;
                }
                await updateSettings(chatId, { warn_limit: n });
                await sock.sendMessage(chatId, {
                    text: `✅ *Warn limit set to ${n}*\n\n*Group:* ${groupName}`,
                    mentions: [userId]
                }, { quoted: message });
                break;
            }

            case 'resetwarns':
                await clearAllWarns(chatId);
                await sock.sendMessage(chatId, {
                    text: `✅ *All warns cleared*\n\n*Group:* ${groupName}`,
                    mentions: [userId]
                }, { quoted: message });
                break;

            default:
                await sock.sendMessage(chatId, {
                    text: '❌ *Unknown subcommand*\n\nUse: *off / warn / delete / kick / limit / resetwarns*',
                    mentions: [userId]
                }, { quoted: message });
        }

    } catch (error) {
        console.error('\x1b[35m[AntiStatusMention] Command error:\x1b[0m', error);
        await sock.sendMessage(chatId, {
            text: `🚫 *Error*\n\n${error.message}`,
            mentions: [message.key.participant || message.key.remoteJid]
        }, { quoted: message });
    }
}

async function handleAntiStatusMention(sock, message) {
    try {
        const chatId = message.key.remoteJid;
        if (!chatId.endsWith('@g.us')) return;

        const settings = await getSettings(chatId);
        if (settings.action === 'off') return;
        if (!hasStatusBroadcast(message)) return;

        const userId = message.key.participant || message.key.remoteJid;
        const adminResult = await isAdmin(sock, chatId, userId);
        if (adminResult.isSenderAdmin) return;
        if (!adminResult.isBotAdmin) return;

        const groupMetadata = await sock.groupMetadata(chatId).catch(() => null);
        const groupName = groupMetadata ? groupMetadata.subject : 'the group';
        const username = userId.split('@')[0];

        // Build an explicit key for admin-delete in Baileys 7.x
        const deleteKey = {
            remoteJid: chatId,
            fromMe: false,
            id: message.key.id,
            participant: message.key.participant || userId,
        };

        switch (settings.action) {

            case 'warn': {
                // Always delete the message first
                try { await sock.sendMessage(chatId, { delete: deleteKey }); } catch (e) {
                    console.error('\x1b[35m[AntiStatusMention] Delete failed:\x1b[0m', e.message);
                }

                const warnCount = await addWarn(chatId, userId);

                if (warnCount >= settings.warn_limit) {
                    // Warn limit reached — kick the member
                    await resetWarn(chatId, userId);
                    try { await sock.groupParticipantsUpdate(chatId, [userId], 'remove'); } catch (e) {
                        console.error('\x1b[35m[AntiStatusMention] Kick failed:\x1b[0m', e.message);
                    }
                    await sock.sendMessage(chatId, {
                        text: `🚫 *Member Removed*\n\n` +
                              `@${username} has been removed after reaching the warn limit for mentioning *@status*.\n\n` +
                              `┌ *Details*\n` +
                              `│ Warns: ${warnCount}/${settings.warn_limit}\n` +
                              `│ Group: ${groupName}\n` +
                              `└──────────────`,
                        mentions: [userId]
                    });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ *Warning — Status Mention*\n\n` +
                              `@${username} please do not mention *@status* in this group!\n\n` +
                              `┌ *Details*\n` +
                              `│ Warns: ${warnCount}/${settings.warn_limit}\n` +
                              `│ Group: ${groupName}\n` +
                              `└──────────────\n\n` +
                              `_You will be removed when warns reach the limit._`,
                        mentions: [userId]
                    });
                }
                break;
            }

            case 'delete': {
                // Delete the message silently and notify
                try { await sock.sendMessage(chatId, { delete: deleteKey }); } catch (e) {
                    console.error('\x1b[35m[AntiStatusMention] Delete failed:\x1b[0m', e.message);
                }
                break;
            }

            case 'kick': {
                // Delete the message then immediately kick the member
                try { await sock.sendMessage(chatId, { delete: deleteKey }); } catch (e) {
                    console.error('\x1b[35m[AntiStatusMention] Delete failed:\x1b[0m', e.message);
                }
                try { await sock.groupParticipantsUpdate(chatId, [userId], 'remove'); } catch (e) {
                    console.error('\x1b[35m[AntiStatusMention] Kick failed:\x1b[0m', e.message);
                }
                await sock.sendMessage(chatId, {
                    text: `🚫 *Member Removed*\n\n` +
                          `@${username} has been removed from the group for mentioning *@status*.\n\n` +
                          `*Group:* ${groupName}`,
                    mentions: [userId]
                });
                break;
            }
        }

    } catch (error) {
        console.error('\x1b[35m[AntiStatusMention] Handler error:\x1b[0m', error);
    }
}

module.exports = {
    antistatusmentionCommand,
    handleAntiStatusMention
};
