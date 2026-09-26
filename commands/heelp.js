
// help.js - Enhanced version with integrated functions
const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getMenuStyle, getMenuSettings, MENU_STYLES } = require('./menuSettings');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { getPrefix, handleSetPrefixCommand } = require('./setprefix');
const { getBotName } = require('../lib/botConfig');

const { getOwnerName } = require('./setowner');

const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// Utility Functions
const { createFakeContact } = require('../lib/fakeContact');
function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;

    return time.trim();
}

function detectHost() {
    const env = process.env;

    if (env.RENDER || env.RENDER_EXTERNAL_URL) return 'Render';
    if (env.DYNO || env.HEROKU_APP_DIR || env.HEROKU_SLUG_COMMIT) return 'Heroku';
    if (env.VERCEL || env.VERCEL_ENV || env.VERCEL_URL) return 'Vercel';
    if (env.PORTS || env.CYPHERX_HOST_ID) return "CypherXHost";
    if (env.RAILWAY_ENVIRONMENT || env.RAILWAY_PROJECT_ID) return 'Railway';
    if (env.REPL_ID || env.REPL_SLUG) return 'Replit';

    const hostname = os.hostname().toLowerCase();
    if (!env.CLOUD_PROVIDER && !env.DYNO && !env.VERCEL && !env.RENDER) {
        if (hostname.includes('vps') || hostname.includes('server')) return 'VPS';
        return 'Panel';
    }

    return 'Unknown Host';
}

// Memory formatting function
const formatMemory = (memory) => {
    return memory < 1024 * 1024 * 1024
        ? Math.round(memory / 1024 / 1024) + ' MB'
        : Math.round(memory / 1024 / 1024 / 1024) + ' GB';
};

// Progress bar function
const progressBar = (used, total, size = 10) => {
    let percentage = Math.round((used / total) * size);
    let bar = '█'.repeat(percentage) + '░'.repeat(size - percentage);
    return `${bar} ${Math.round((used / total) * 100)}%`;
};

// Generate Menu Function
const generateMenu = (pushname, currentMode, hostName, ping, uptimeFormatted, prefix = '.') => {
    const memoryUsage = process.memoryUsage();
    const botUsedMemory = memoryUsage.heapUsed;
    const totalMemory = os.totalmem();
    const systemUsedMemory = totalMemory - os.freemem();
    const prefix2 = getPrefix();
    let newOwner = getOwnerName();
    const menuSettings = getMenuSettings();

    let menu = `┏❐  *❴ BONY-XMD BOT❵* ❐\n`;
    menu += `┃➥ *User:* ${pushname}\n`;
    menu += `┃➥ *Owner:* ${newOwner}\n`;
    menu += `┃➥ *Mode:* ${currentMode}\n`;
    menu += `┃➥ *Host:* ${hostName}\n`;
    menu += `┃➥ *Speed:* ${ping} ms\n`;
    menu += `┃➥ *Prefix:* [${prefix2}]\n`;

    if (menuSettings.showUptime) {
        menu += `┃➥ *Uptime:* ${uptimeFormatted}\n`;
    }

    menu += `┃➥ *version:* v${settings.version}\n`;

    if (menuSettings.showMemory) {
        menu += `┃➥ *Usage:* ${formatMemory(botUsedMemory)} of ${formatMemory(totalMemory)}\n`;
        menu += `┃➥ *RAM:* ${progressBar(systemUsedMemory, totalMemory)}\n`;
    }

    menu += `┗❐\n${readmore}\n`;

    // Owner Menu
    menu += `┏❐ \`OWNER MENU\` ❐\n`;
    menu += `┃ .ban\n┃ .restart\n┃ .unban\n┃ .promote\n┃ .demote\n┃ .mute\n┃ .unmute\n┃ .delete\n┃ .kick\n┃ .warnings\n┃ .antilink\n┃ .antibadword\n┃ .clear\n┃ .chatbot\n`;
    menu += `┗❐\n\n`;

    // Group Menu
    menu += `┏❐ \`GROUP MENU\` ❐\n`;
    menu += `┃ .promote\n┃ .demote\n┃ .settings\n┃ .welcome\n┃ .setgpp\n┃ .getgpp\n┃ .listadmin\n┃ .goodbye\n┃ .tagnoadmin\n┃ .tag\n┃ .antilink\n┃ .set welcome\n┃ .listadmin\n┃ .groupinfo\n┃ .admins\n┃ .warn\n┃ .revoke\n┃ .resetlink\n┃ .open\n┃ .close\n┃ .mention\n`;
    menu += `┗❐\n\n`;

    // Setting Menu
    menu += `┏❐ \`SETTING MENU\` ❐\n`;
    menu += `┃ .mode\n┃ .autostatus\n┃ .pmblock\n┃ .setmention\n┃ .autoread\n┃ .clearsession\n┃ .antidelete\n┃ .cleartmp\n┃ .autoreact\n┃ .getpp\n┃ .setpp\n┃ .sudo\n┃ .autotyping\n┃ .setmenu\n┃ .setprefix\n`;
    menu += `┗❐\n${readmore}\n`;

    // Main Menu
    menu += `┏❐ \`MAIN MENU\` ❐\n`;
    menu += `┃ .url\n┃ .tagall\n┃ .yts\n┃ .play\n┃ .spotify\n┃ .trt\n┃ .alive\n┃ .ping\n┃ .apk\n┃ .vv\n┃ .video\n┃ .song\n┃ .ssweb\n┃ .instagram\n┃ .facebook\n┃ .tiktok\n┃ .ytmp4\n`;
    menu += `┗❐\n\n`;

    // Stick Menu
    menu += `┏❐ \`STICK MENU\` ❐\n`;
    menu += `┃ .blur\n┃ .simage\n┃ .sticker\n┃ .tgsticker\n┃ .meme\n┃ .take\n┃ .emojimix\n`;
    menu += `┗❐\n\n`;

    // Game Menu
    menu += `┏❐ \`GAME MENU\` ❐\n`;
    menu += `┃ .tictactoe\n┃ .hangman\n┃ .guess\n┃ .trivia\n┃ .answer\n┃ .truth\n┃ .dare\n┃ .8ball\n`;
    menu += `┗❐\n\n`;

    // GitHub Menu
    menu += `┏❐ \`GITHUB CMD\` ❐\n`;
    menu += `┃ .git\n┃ .github\n┃ .sc\n┃ .script\n┃ .repo\n`;
    menu += `┗❐\n${readmore}\n`;

    // Maker Menu
    menu += `┏❐ \`MAKER MENU\`❐\n`;
    menu += `┃ .compliment\n┃ .insult\n┃ .flirt\n┃ .shayari\n┃ .goodnight\n┃ .roseday\n┃ .character\n┃ .wasted\n┃ .ship\n┃ .simp\n┃ .stupid\n`;
    menu += `┗❐\n\n`;

    // Anime Menu
    menu += `┏❐ \`ANIME MENU\` ❐\n`;
    menu += `┃ .neko\n┃ .waifu\n┃ .loli\n┃ .nom\n┃ .poke\n┃ .cry\n┃ .kiss\n┃ .pat\n┃ .hug\n┃ .wink\n┃ .facepalm\n`;
    menu += `┗❐\n\n`;

    return menu;
};

// Helper function to safely load thumbnail
async function loadThumbnail(thumbnailPath) {
    try {
        if (fs.existsSync(thumbnailPath)) {
            return fs.readFileSync(thumbnailPath);
        } else {
            console.log(`Thumbnail not found: ${thumbnailPath}, using fallback`);
            // Create a simple 1x1 pixel buffer as fallback
            return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
        }
    } catch (error) {
        console.error('Error loading thumbnail:', error);
        // Return fallback buffer
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    }
}

// YOUR EXACT MENU STYLE FUNCTION WITH FIXED tylorkids AND fkontak FOR ALL STYLES
async function sendMenuWithStyle(sock, chatId, message, menulist, menustyle, thumbnailBuffer, pushname) {
    const fkontak = createFakeContact(message);
    const botname = getBotName();
    const ownername = pushname;
    const tylorkids = thumbnailBuffer; // Fixed: using thumbnails from assets
    const plink = "https://github.com/bonyke2-bot";

    if (menustyle === '1') {
        await sock.sendMessage(chatId, {
            document: {
                url: "https://i.ibb.co/2W0H9Jq/avatar-contact.png",
            },
            caption: menulist,
            mimetype: "application/zip",
            fileName: `${botname}`,
            fileLength: "9999999",
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: false,
                    title: "",
                    body: "",
                    thumbnail: tylorkids,
                    sourceUrl: plink,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                },
            },
        }, { quoted: createFakeContact(message) });
    } else if (menustyle === '2') {
        await sock.sendMessage(chatId, {
            text: menulist
        }, { quoted: createFakeContact(message) });
    } else if (menustyle === '3') {
        await sock.sendMessage(chatId, {
            text: menulist,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: false,
                    title: botname,
                    body: ownername,
                    thumbnail: tylorkids,
                    sourceUrl: plink,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                },
            },
        }, { quoted: createFakeContact(message) });
    } else if (menustyle === '4') {
        await sock.sendMessage(chatId, {
            image: tylorkids,
            caption: menulist,
        }, { quoted: createFakeContact(message) });
    } else if (menustyle === '5') {
        let massage = generateWAMessageFromContent(chatId, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: null,
                        },
                        footer: {
                            text: menulist,
                        },
                        nativeFlowMessage: {
                            buttons: [{
                                text: null
                            }],
                        },
                    },
                },
            },
        }, { quoted: createFakeContact(message) });
        await sock.relayMessage(chatId, massage.message, { messageId: massage.key.id });
    } else if (menustyle === '6') {
        await sock.relayMessage(chatId, {
            requestPaymentMessage: {
                currencyCodeIso4217: 'USD',
                requestFrom: '0@s.whatsapp.net',
                amount1000: '1',
                noteMessage: {
                    extendedTextMessage: {
                        text: menulist,
                        contextInfo: {
                            mentionedJid: [message.key.participant || message.key.remoteJid],
                            externalAdReply: {
                                showAdAttribution: false,
                            },
                        },
                    },
                },
            },
        }, {});
    } else {
        // Default fallback
        await sock.sendMessage(chatId, {
            text: menulist
        }, { quoted: createFakeContact(message) });
    }
}

// Main help command function
async function helpCommand(sock, chatId, message) {
    const pushname = message.pushName || "Unknown User";
    const menuStyle = getMenuStyle();

    console.log('Current menu style:', menuStyle);

    let data = JSON.parse(fs.readFileSync('./data/messageCount.json'));

    // Create fake contact for enhanced reply
    const fkontak = createFakeContact(message);

    const start = Date.now();
    await sock.sendMessage(chatId, {
        text: '_Wait loading menu..._'
    }, { quoted: createFakeContact(message) });
    const end = Date.now();
    const ping = Math.round((end - start) / 2);

    const uptimeInSeconds = process.uptime();
    const uptimeFormatted = formatTime(uptimeInSeconds);
    const currentMode = data.isPublic ? 'public' : 'private';
    const hostName = detectHost();

    const menulist = generateMenu(pushname, currentMode, hostName, ping, uptimeFormatted);

    // Random thumbnail selection from local files
    const thumbnailFiles = [
        'menu1.jpg',
        'menu2.jpg',
        'menu3.jpg',
        'menu4.jpg',
        'menu5.jpg'
    ];
    const randomThumbFile = thumbnailFiles[Math.floor(Math.random() * thumbnailFiles.length)];
    const thumbnailPath = path.join(__dirname, '../assets', randomThumbFile);

    // Send reaction
    await sock.sendMessage(chatId, {
        react: { text: '📔', key: message.key }
    });

    try {
        // Load thumbnail using helper function
        const thumbnailBuffer = await loadThumbnail(thumbnailPath);

        // Send menu using YOUR EXACT menu style function
        await sendMenuWithStyle(sock, chatId, message, menulist, menuStyle, thumbnailBuffer, pushname);

        // Success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('Error in help command:', error);
        // Fallback to simple text
        try {
            await sock.sendMessage(chatId, {
                text: menulist
            }, { quoted: createFakeContact(message) });
        } catch (fallbackError) {
            console.error('Even fallback failed:', fallbackError);
        }
    }
}

module.exports = helpCommand;
