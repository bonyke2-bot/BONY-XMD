/*************************************
* BONY KE
*************************************/

const originalWrite = process.stdout.write;
process.stdout.write = function (chunk, encoding, callback) {
    const message = chunk.toString();

    if (message.includes('Closing session: SessionEntry') || message.includes('SessionEntry {')) {
        return;
    }

    return originalWrite.apply(this, arguments);
};

const originalWriteError = process.stderr.write;
process.stderr.write = function (chunk, encoding, callback) {
    const message = chunk.toString();
    if (message.includes('Closing session: SessionEntry')) {
        return;
    }
    return originalWriteError.apply(this, arguments);
};

const originalLog = console.log;
console.log = function (message, ...optionalParams) {

    if (typeof message === 'string' && message.startsWith('Closing session: SessionEntry')) {
        return;
    }

    originalLog.apply(console, [message, ...optionalParams]);
};

/*━━━━━━━━━━━━━━━━━━━━*/
// -----Core imports first-----
/*━━━━━━━━━━━━━━━━━━━━*/
const settings = require('./settings');
const { Jimp, ResizeStrategy } = require('jimp');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fs = require('fs');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { jidDecode } = require('@whiskeysockets/baileys');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const isAdmin = require('./lib/isAdmin');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { normalizeJid, compareJids } = require('./lib/jid');
const { createFakeContact } = require('./lib/fakeContact');

// New imports for console logging
const moment = require('moment-timezone');
const lolcatjs = require('lolcatjs');

// Timezone setting
const timezones = settings.timezone || 'Africa/Nairobi';

const _cache = {
    groupMeta: new Map(),
    groupMetaTTL: 120000,
    modeData: null,
    modeDataTime: 0,
    modeDataTTL: 5000
};

function getCachedGroupMeta(sock, chatId) {
    const cached = _cache.groupMeta.get(chatId);
    if (cached && Date.now() - cached.time < _cache.groupMetaTTL) {
        return Promise.resolve(cached.data);
    }
    return sock.groupMetadata(chatId).then(data => {
        _cache.groupMeta.set(chatId, { data, time: Date.now() });
        if (_cache.groupMeta.size > 200) {
            const oldest = _cache.groupMeta.keys().next().value;
            _cache.groupMeta.delete(oldest);
        }
        return data;
    }).catch(() => ({}));
}

function getCachedModeData() {
    const now = Date.now();
    if (_cache.modeData && now - _cache.modeDataTime < _cache.modeDataTTL) {
        return _cache.modeData;
    }
    try {
        _cache.modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        _cache.modeDataTime = now;
    } catch (e) {
        _cache.modeData = { isPublic: true, mode: 'public' };
        _cache.modeDataTime = now;
    }
    return _cache.modeData;
}

/*━━━━━━━━━━━━━━━━━━━━*/
// -----Command imports - Handlers-----
/*━━━━━━━━━━━━━━━━━━━━*/
const {
    autotypingCommand,
    isAutotypingEnabled,
    sendTyping,
    stopTyping
} = require('./commands/autotyping');

const {
    autorecordingCommand,
    isAutorecordingEnabled,
    sendRecording,
    stopRecording
} = require('./commands/autorecording');

const {
    autobothCommand,
    isAutobothEnabled,
    sendBothStart,
    sendBothBackground,
    stopBoth
} = require('./commands/autoboth');

const {
  getPrefix,
  handleSetPrefixCommand
} = require('./commands/setprefix');



const {
 autoreadCommand,
 isAutoreadEnabled,
 handleAutoread
} = require('./commands/autoread');

const { readReceiptsCommand } = require('./commands/autoReadReciepts');
const { alwaysonlineCommand, applyAlwaysOnlineOnStartup } = require('./commands/alwaysonline');

const {
 incrementMessageCount,
 topMembers
} = require('./commands/topmembers');

const {
 setGroupDescription,
 setGroupName,
 setGroupPhoto,
 getGroupProfile,
 getGroupName,
 getGroupDescription,
 setDisappearingMessages
} = require('./commands/groupmanage');

const { handleAntibotCommand, handleAntibotJoin } = require('./commands/antibot');

const {
 handleAntilinkCommand,
 handleLinkDetection
} = require('./commands/antilink');

const {
 handleAntitagCommand,
 handleTagDetection
} = require('./commands/antitag');

const {
 handleMentionDetection,
 mentionToggleCommand,
 setMentionCommand
} = require('./commands/mention');

const {
 handleAntiBadwordCommand,
 handleBadwordDetection
} = require('./lib/antibadword');

const {
 handleChatbotCommand,
 handleChatbotResponse
} = require('./commands/chatbot');

const {
    welcomeCommand,
    handleJoinEvent
} = require('./commands/welcome');


const {
goodbyeCommand,
handleLeaveEvent
} = require('./commands/goodbye');


const {
 handleAntideleteCommand,
 handleMessageRevocation,
 storeMessage
} = require('./commands/antidelete');


const {
 pmblockerCommand,
 readState: readPmBlockerState
} = require('./commands/pmblocker');

const {
 addCommandReaction,
 addMessageReaction,
 handleAreactCommand
} = require('./lib/reactions');

const { fancyCommand, replyHandlers: fancyReplyHandlers } = require('./commands/fancy');

const {
  autoStatusCommand,
  handleStatusUpdate
} = require('./commands/autostatus');

const { getcmdCommand } = require('./commands/getcmd');

const {
 startHangman,
 guessLetter
} = require('./commands/hangman');

const {
 startTrivia,
 answerTrivia
} = require('./commands/trivia');

const {
 miscCommand,
 handleHeart
} = require('./commands/misc');


/*━━━━━━━━━━━━━━━━━━━━*/
// -----Command imports-----
/*━━━━━━━━━━━━━━━━━━━━*/

const joinCommand = require('./commands/join');
const getppCommand = require('./commands/getpp');
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const { handleMenuReply } = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const timeCommand = require('./commands/time');
const botInfoCommand = require('./commands/botinfo');
const setTimezoneCommand = require('./commands/settimezone');
const blurCommand = require('./commands/img-blur');
const githubCommand = require('./commands/github');
const antibadwordCommand = require('./commands/antibadword');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const { resetlinkCommand, linkCommand } = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewonceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const ytdocvideoCommand = require('./commands/ytdocvideo');
const ytdocplayCommand = require('./commands/ytdocplay');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');
const apkCommand = require('./commands/apk');
const menuConfigCommand = require('./commands/menuConfig');
const shazamCommand = require('./commands/shazam');
const saveStatusCommand = require('./commands/saveStatus');
const toAudioCommand = require('./commands/toAudio');
const gitcloneCommand = require('./commands/gitclone');
const leaveGroupCommand = require('./commands/leave');
const kickAllCommand = require('./commands/kickAll');
const ytsCommand = require('./commands/yts');
const setGroupStatusCommand = require('./commands/setGroupStatus');
const handleDevReact = require('./commands/devReact');
const imageCommand = require('./commands/image');
const gpt4Command = require('./commands/aiGpt4');
const vcfCommand = require('./commands/vcf');
const fetchCommand = require('./commands/fetch');
const { ytplayCommand, ytsongCommand }= require('./commands/ytdl');
const { chaneljidCommand }= require('./commands/chanel');
const { connectFourCommand, handleConnectFourMove } = require('./commands/connect4');
const pairCommand = require('./commands/pair');
const addCommand = require('./commands/add');
const tostatusCommand = require('./commands/tostatus');
const mediafireCommand = require('./commands/mf');
const deepseekCommand = require('./commands/deepseek');
const copilotCommand = require('./commands/ai-copilot');
const xvdlCommand = require('./commands/xvdl');
const visionCommand = require('./commands/vision');
const metaiCommand = require('./commands/ai-meta');
const { anticallCommand, handleIncomingCall } = require('./commands/anticall');
const dispCommand = require('./commands/disp');
const {
    livescoreCommand,
    betTipsCommand,
    footballNewsCommand,
    playerSearchCommand,
    teamSearchCommand,
    venueSearchCommand,
    gameEventsCommand,
    sportsHelpCommand,
    leagueCommand,
} = require('./commands/sports');
const { antistickerCommand, handleStickerDetection } = require('./commands/antisticker');
const { antistatusmentionCommand, handleAntiStatusMention } = require('./commands/antimention');
const { startScramble, handleScrambleGuess, endScramble } = require('./commands/scramble');
const { antiimageCommand, handleImageDetection } = require('./commands/antiimage');
const { blockCommand, unblockCommand, unblockallCommand, blocklistCommand } = require('./commands/blockUnblock');
const { ligue1StandingsCommand, laligaStandingsCommand, matchesCommand } = require('./commands/sport1');
const approveCommand = require('./commands/approve');
const smemeCommand = require('./commands/smeme');
const wormgptCommand = require('./commands/wormgpt');
const grokCommand = require('./commands/grok');
const blackboxCommand = require('./commands/ai-blackbox');
const birdCommand = require('./commands/ai-bird');
const speechwriterCommand = require('./commands/ai-speechwriter');
const mistralCommand = require('./commands/ai-mistral');
const ilamaCommand = require('./commands/ai-ilama');
const locationCommand = require('./commands/location');
const perplexityCommand = require('./commands/ai-perplexity');
const movieCommand = require('./commands/movie');
const transcribeCommand = require('./commands/transcribe');
const onlineCommand = require('./commands/online');
const lastseenCommand = require('./commands/lastseen');
const { antidemoteCommand, handleAntidemote } = require('./commands/antidemote');
const { antipromoteCommand, handleAntipromote } = require('./commands/antipromote');
const { setbotconfigCommand, setmenuimageCommand } = require('./commands/menuimage');
const vv2Command = require('./commands/vv2');
const moviesCommand = require('./commands/movies');
const encryptCommand = require('./commands/encrypt');
const trimCommand = require('./commands/trim');
const teraboxCommand = require('./commands/terabox');
const magicstudioCommand = require('./commands/magicstudio');
const gpteditCommand = require('./commands/gptedit');
const pinterestCommand = require('./commands/pinterest');
const setBioCommand = require('./commands/setbio');
const { autofontCommand } = require('./commands/autofont');
const { applyFont } = require('./lib/autoFont');
const { createGroupCommand } = require('./commands/creategroup');
/*━━━━━━━━━━━━━━━━━━━━*/
// Global settings
/*━━━━━━━━━━━━━━━━━━━━*/
global.packname = settings?.packname || "BONY-XMD";
global.author = settings?.author || "BONY KE";
global.channelLink = "";
global.ytchanel = "";

// Channel info for message context
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,

    }
};


/*━━━━━━━━━━━━━━━━━━━━*/
// Main Message Handler
/*━━━━━━━━━━━━━━━━━━━━*/
async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;

        // Status messages are handled upstream in index.js via handleStatus
        // before handleMessages is called — skip them here to avoid double-processing
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;


        await Promise.allSettled([
            handleAutoread(sock, message),
            handleDevReact(sock, message),
            handleAntiStatusMention(sock, message),
            addMessageReaction(sock, message)
        ]);


        if (!sock._callListenerBound) {
            sock.ev.on('call', async (callData) => {
                await handleIncomingCall(sock, callData);
            });
            sock._callListenerBound = true;
        }

        if (!sock._fontPatched) {
            const _origSend = sock.sendMessage.bind(sock);
            sock.sendMessage = async (jid, content, options) => {
                if (content && typeof content.text === 'string') {
                    content = { ...content, text: applyFont(content.text) };
                }
                if (content && typeof content.caption === 'string') {
                    content = { ...content, caption: applyFont(content.caption) };
                }

                // Global BONY-XMD WhatsApp Channel attribution
                if (content && typeof content === 'object') {
                    const existingContextInfo = content.contextInfo || {};
                    content = {
                        ...content,
                        contextInfo: {
                            ...existingContextInfo,
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363430014003120@newsletter',
                                newsletterName: 'BONY-XMD',
                                serverMessageId: -1
                            }
                        }
                    };
                }

                if (content?.image && !content.jpegThumbnail) {
                    try {
                        let imageBuffer;

                        if (Buffer.isBuffer(content.image)) {
                            imageBuffer = content.image;
                        } else if (content.image?.url) {
                            imageBuffer = fs.readFileSync(content.image.url);
                        }

                        if (imageBuffer) {
                            const image = await Jimp.read(imageBuffer);
                            const thumbnail = await image
                                .resize({ w: 32, mode: ResizeStrategy.BILINEAR })
                                .getBuffer('image/jpeg', { quality: 50 });

                            content = {
                                ...content,
                                jpegThumbnail: thumbnail.toString('base64')
                            };
                        }
                    } catch (thumbnailError) {
                        console.error('[THUMBNAIL] Generation failed:', thumbnailError.message);
                    }
                }

                return _origSend(jid, content, options);
            };
            sock._fontPatched = true;
        }

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;



       /*━━━━━━━━━━━━━━━━━━━━*/
        // Dynamic prefix
       /*━━━━━━━━━━━━━━━━━━━━*/
        const prefix = getPrefix();
        const isPrefixless = prefix === '';
        const isGroup = chatId.endsWith('@g.us');
        // true for: bot's own messages, settings.ownerNumber, and any sudo user
        const senderIsSudo = message.key.fromMe || await isOwnerOrSudo(senderId);

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        // Preserve raw message for commands like .tag that need original casing
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';


const fake = createFakeContact(message);

        // ── "> prefix" trigger — anyone can ask for the current prefix ──────
        if (userMessage === '> prefix') {
            const currentPrefix = prefix || '(none — prefixless mode)';
            await sock.sendMessage(chatId, {
                text: `${currentPrefix}`
            }, { quoted: fake });
            return;
        }


        /*━━━━━━━━━━━━━━━━━━━━*/
        // Only log command usage
        /*━━━━━━━━━━━━━━━━━━━━*/
        if (userMessage) {
            /*━━━━━━━━━━━━━━━━━━━━*/
            // Safe decoding of jid
            /*━━━━━━━━━━━━━━━━━━━━*/
            if (!sock.decodeJid) {
                sock.decodeJid = (jid) => normalizeJid(jid);
            }

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Console log imports only
            /*━━━━━━━━━━━━━━━━━━━━*/
            const groupMetadata = isGroup
                ? await getCachedGroupMeta(sock, chatId)
                : {};
            const pushname = message.pushName || "Unknown User";
            const chatType = chatId.endsWith('@g.us') ? 'Group' : 'Private';
            const groupName = isGroup ? (groupMetadata?.subject || 'Unknown Group') : undefined;
            const body = message.message.conversation ||
                        message.message.extendedTextMessage?.text ||
                        message.message.imageMessage?.caption ||
                        message.message.videoMessage?.caption ||
                        '';

            // Determine message type (first key of message.message)
            const mtype = message.message ? Object.keys(message.message)[0] : 'N/A';

            //================== [ CONSOLE LOG] ==================//
            const dayz = moment(Date.now()).tz(timezones).locale('en').format('dddd');
            const timez = moment(Date.now()).tz(timezones).locale('en').format('HH:mm:ss z');
            const datez = moment(Date.now()).tz(timezones).format("DD/MM/YYYY");

            if (message.message) {
                lolcatjs.fromString(`┏━━━━━━━━━━━━━『  BONY-XMD 』━━━━━━━━━━━━━─`);
                lolcatjs.fromString(`»  Sent Time: ${dayz}, ${timez}`);
                lolcatjs.fromString(`»  Date: ${datez}`);
                lolcatjs.fromString(`»  Message Type: ${mtype}`);
                lolcatjs.fromString(`»  Sender Name: ${pushname || 'N/A'}`);
                lolcatjs.fromString(`»  Chat ID: ${chatId?.split('@')[0] || 'N/A'}`);

                if (isGroup) {
                    lolcatjs.fromString(`»  Group: ${groupName || 'N/A'}`);
                    lolcatjs.fromString(`»  Group JID: ${chatId?.split('@')[0] || 'N/A'}`);
                }

                lolcatjs.fromString(`»  Message: ${body || 'N/A'}`);
                lolcatjs.fromString('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─ ⳹\n\n');
            }
            //<================================================>//
        }


        // Enforce private mode BEFORE any replies (except owner/sudo)
        try {
            const data = getCachedModeData();

            if (data.mode === 'group' && !isGroup) return;
            if (data.mode === 'pm' && isGroup) return;
            if (data.mode === 'private' && !message.key.fromMe && !senderIsSudo) return;
        } catch (error) {
            console.error('Error checking access mode:', error);
        }

        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith(`${prefix}unban`)) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        // Intercept replies to fancy styles list
        const fancyStanzaId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (fancyStanzaId && fancyReplyHandlers.has(fancyStanzaId)) {
            await fancyReplyHandlers.get(fancyStanzaId)(message);
            return;
        }
// Intercept replies to BONY-XMD category menus
if (await handleMenuReply(sock, message)) {
    return;
}

/*
        // First check if it's a game move
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

*/

// Add this after your command handler, in the regular message processing:
if (/^[1-9]$/.test(userMessage)) {
    const tttResult = await handleTicTacToeMove(sock, chatId, senderId, userMessage);
    if (!tttResult && parseInt(userMessage) <= 7) {
        await handleConnectFourMove(sock, chatId, senderId, userMessage);
    }
}

if (userMessage && !userMessage.startsWith(prefix)) {
    await handleScrambleGuess(sock, chatId, senderId, userMessage);
}


        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (isGroup && userMessage) {
            await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
        }
        // Run link detection for ALL group messages (links can appear in captions, link previews, documents, etc.)
        if (isGroup && !message.key.fromMe) {
            await handleLinkDetection(sock, chatId, message, userMessage, senderId);
        }

        // PM blocker: silently block non-owner DMs when enabled
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (_) {}
                    return;
                }
            } catch (_) {}
        }

        /*━━━━━━━━━━━━━━━━━━━━*/
        // Check for command prefix
        /*━━━━━━━━━━━━━━━━━━━━*/
    if (!userMessage.startsWith(prefix)) {
            // Show one presence indicator in background (mutually exclusive)
            if (isAutobothEnabled()) {
                sendBothStart(sock, chatId);
                sendBothBackground(sock, chatId, 10000);
            } else if (isAutotypingEnabled()) {
                sendTyping(sock, chatId);
            } else if (isAutorecordingEnabled()) {
                sendRecording(sock, chatId);
            }
 if (isGroup) {
                await Promise.allSettled([
                    handleChatbotResponse(sock, chatId, message, userMessage, senderId),
                    handleTagDetection(sock, chatId, message, senderId),
                    handleMentionDetection(sock, chatId, message),
                    handleStickerDetection(sock, chatId, message, senderId),
                    handleImageDetection(sock, chatId, message, senderId)
                ]);
            }
return;
        }

        // List of admin commands
        const adminCommands = [
            `${prefix}mute`,
            `${prefix}unmute`,
            `${prefix}ban`,
            `${prefix}unban`,
            `${prefix}promote`,
            `${prefix}demote`,
            `${prefix}kick`,
            `${prefix}tagall`,
            `${prefix}tagnotadmin`,
            `${prefix}hidetag`,
            `${prefix}antilink`,
            `${prefix}antitag`,
            `${prefix}setgdesc`,
            `${prefix}setgname`,
            `${prefix}setgpp`,
            `${prefix}antibot`,
            `${prefix}setdispmessage`
        ];
        const isAdminCommand = adminCommands.some(cmd =>
            userMessage === cmd || userMessage.startsWith(cmd + ' ')
        );

        // List of owner commands
        const ownerCommands = [
            `${prefix}mode`,
            `${prefix}autostatus`,
            `${prefix}antidelete`,
            `${prefix}cleartmp`,
            `${prefix}setpp`,
            `${prefix}clearsession`,
            `${prefix}areact`,
            `${prefix}autoreact`,
            `${prefix}autotyping`,
            `${prefix}autorecording`,
            `${prefix}autorecord`,
            `${prefix}autoboth`,
            `${prefix}autoread`,
            `${prefix}pmblocker`,
            `${prefix}readreciepts`,
            `${prefix}alwaysonline`,
            `${prefix}getcmd`
        ];
        const isOwnerCommand = ownerCommands.some(cmd =>
            userMessage === cmd || userMessage.startsWith(cmd + ' ')
        );

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: fake });
                return;
            }

            if (
                userMessage.startsWith(`${prefix}mute`) ||
                userMessage === `${prefix}unmute` ||
                userMessage.startsWith(`${prefix}ban`) ||
                userMessage.startsWith(`${prefix}unban`) ||
                userMessage.startsWith(`${prefix}promote`) ||
                userMessage.startsWith(`${prefix}demote`)
            ) {
                if (!isSenderAdmin && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: 'Sorry, only group admins can use this command.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsSudo) {
                await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
                return;
            }
        }

        // Show presence BEFORE command executes so recipients see it before the reply
        if (isAutobothEnabled()) {
            await sendBothStart(sock, chatId);
            sendBothBackground(sock, chatId, 6000);
        } else if (isAutotypingEnabled()) {
            await sendTyping(sock, chatId);
        } else if (isAutorecordingEnabled()) {
            await sendRecording(sock, chatId);
        }

        // Command handlers
        let commandExecuted = false;

        switch (true) {
            /*━━━━━━━━━━━━━━━━━━━━*/
            // Prefix case
            /*━━━━━━━━━━━━━━━━━━━━*/

            case userMessage.startsWith(`${prefix}setprefix`):
                await handleSetPrefixCommand(sock, chatId, senderId, message, userMessage, prefix);
                break;


            case userMessage === `${prefix}simage`:
            case userMessage === `${prefix}toimage`: {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the toimage command to convert it.', ...channelInfo }, { quoted: fake });
                }
                commandExecuted = true;
                break;
            }

            case userMessage.startsWith(`${prefix}kick`):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;

            case userMessage.startsWith(`${prefix}mute`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes or use .mute with no number to mute immediately.' }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Some owner commands
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage === `${prefix}shazam` ||
                 userMessage === `${prefix}whatsong` ||
                 userMessage === `${prefix}find`:
                await shazamCommand(sock, chatId, message);
                break;


            case userMessage === `${prefix}unmute`:
                await unmuteCommand(sock, chatId, senderId);
                break;

            case userMessage.startsWith(`${prefix}ban`):
                await banCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}gptedit`):
                await gpteditCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}ai` || userMessage.startsWith(`${prefix}ai `):
                await gpt4Command(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}pinterest`):
                await pinterestCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}wormgpt`):
                await wormgptCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}magicstudio`):
                await magicstudioCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}grok`):
                await grokCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}deepseek`):
                await deepseekCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}copilot`):
                await copilotCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}enc`):
                await encryptCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}terabox`):
                await teraboxCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}unban`):
                await unbanCommand(sock, chatId, message);
                break;



            case userMessage === `${prefix}help` ||
                 userMessage === `${prefix}menu` ||
                 userMessage === `${prefix}list`:
                await helpCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            // Add menu configuration command
            case userMessage.startsWith(`${prefix}menuconfig`) ||
                 userMessage.startsWith(`${prefix}menuset`) ||
                 userMessage.startsWith(`${prefix}setmenu`):
                const menuArgs = userMessage.split(' ').slice(1);
                await menuConfigCommand(sock, chatId, message, menuArgs);
                commandExecuted = true;
                break;

            case userMessage === `${prefix}sticker` ||
                 userMessage === `${prefix}s`:
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;


            case userMessage.startsWith(`${prefix}warnings`):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;

            case userMessage.startsWith(`${prefix}warn`):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;

            case userMessage.startsWith(`${prefix}tts`) ||
                 userMessage.startsWith(`${prefix}say`):
                const text = userMessage.slice((prefix + 'tts').length).trim();
                await ttsCommand(sock, chatId, text, message);
                break;

            case userMessage.startsWith(`${prefix}fancy`):
                await fancyCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}delete`) || userMessage.startsWith(`${prefix}del`):
                await deleteCommand(sock, chatId, message, senderId);
                break;


            case userMessage.startsWith(`${prefix}vcf`) ||
                 userMessage.startsWith(`${prefix}vcard`):
                await vcfCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}retrive`) ||
                 userMessage.startsWith(`${prefix}viewonce`):
                await viewonceCommand(sock, chatId, message);
                break;


            case (userMessage === `${prefix}in` || userMessage.startsWith(`${prefix}in `)) ||
                 userMessage.startsWith(`${prefix}join`):
                await joinCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}attp`):
                await attpCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}apk`):
                await apkCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}menuimage`):
                await setmenuimageCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}configimage`):
                await setbotconfigCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}antidemote`):
                await antidemoteCommand(sock, chatId, message, senderId);
                break;

            case userMessage.startsWith(`${prefix}antipromote`):
                await antipromoteCommand(sock, chatId, message, senderId);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Settings
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage === `${prefix}settings`:
            case userMessage === `${prefix}getsettings`:
                await settingsCommand(sock, chatId, message);
                break;



    case userMessage.startsWith(`${prefix}mode`): {
    // Check if sender is the owner
    if (!message.key.fromMe && !senderIsSudo) {
        await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!' }, { quoted: fake });
        return;
    }

    // Read current data first
    let data;
    try {
        data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
    } catch (error) {
        console.error('Error reading access mode:', error);
        await sock.sendMessage(chatId, { text: 'Failed to read bot mode status' }, { quoted: fake });
        return;
    }

    const action = userMessage.split(' ')[1]?.toLowerCase();
    const validModes = ['private', 'public', 'group', 'pm'];

    // Mode descriptions
    const modeDescriptions = {
        private: 'Private mode - Only the owner can use the bot',
        public: 'Public mode - Everyone can use the bot',
        group: 'Group mode - Only groups can use the bot (inbox messages ignored)',
        pm: 'PM mode - Only private messages (inbox) can use the bot (groups ignored)'
    };

    // If no argument provided, show current status
    if (!action) {
        const currentMode = data.mode || (data.isPublic ? 'public' : 'private');
        await sock.sendMessage(chatId, {
            text: `*MODE CONFIGURATION*\n\n` +
                  `Current mode: *${currentMode}*\n\n` +
                  `*AVAILABLE MODES:*\n` +
                  ` ${prefix}mode private - Only owner can use bot\n` +
                  ` ${prefix}mode public - Everyone can use bot\n` +
                  ` ${prefix}mode group - Only groups can use bot\n` +
                  ` ${prefix}mode pm - Only private messages (inbox)\n\n` +
                  `Example:\n${prefix}mode public`
        }, { quoted: fake });
        return;
    }

    // Validate mode
    if (!validModes.includes(action)) {
        await sock.sendMessage(chatId, {
            text: `❌ Invalid mode!\n\n *AVAILABLE MODES:*\n` +
                  ` ${prefix}mode private - Only owner can use bot\n` +
                  ` ${prefix}mode public - Everyone can use bot\n` +
                  ` ${prefix}mode group - Only groups can use bot\n` +
                  ` ${prefix}mode pm - Only private messages (inbox)\n\n` +
                  `Example:\n${prefix}mode group`
        }, { quoted: fake });
        return;
    }

    try {
        // Update mode
        data.mode = action;
        data.isPublic = (action === 'public'); // backward compatibility

        // Save updated data
        fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));

        await sock.sendMessage(chatId, {
            text: `✅ *Mode updated successfully!*\n\n${modeDescriptions[action]}`
        }, { quoted: fake });
    } catch (error) {
        console.error('Error updating access mode:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to update bot mode' }, { quoted: fake });
    }
    break;
}


            case userMessage.startsWith(`${prefix}pmblocker`):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use pmblocker.' }, { quoted: message });
                    commandExecuted = true;
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await pmblockerCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;

            case userMessage === `${prefix}owner`:
                await ownerCommand(sock, chatId);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Group Commands
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage === `${prefix}tagall`:
                if (isSenderAdmin || message.key.fromMe || senderIsSudo) {
                    await tagAllCommand(sock, chatId, senderId, message);
                } else {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use the tagall command.', ...channelInfo }, { quoted: fake });
                }
                break;

            case userMessage === `${prefix}tagnotadmin`:
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;

            case userMessage.startsWith(`${prefix}hidetag`):
                {
                    const messageText = rawText.slice((prefix + 'hidetag').length).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;

            case userMessage.startsWith(`${prefix}tag`):
                const messageText = rawText.slice((prefix + 'tag').length).trim();
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;

            case userMessage.startsWith(`${prefix}antilink`):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: fake });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;

            case userMessage.startsWith(`${prefix}antitag`):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Meme Commands and etc
            /*━━━━━━━━━━━━━━━━━━━━*/


            case userMessage === `${prefix}send` ||
                 userMessage === `${prefix}get` ||
                 userMessage === `${prefix}save`:
                await saveStatusCommand(sock, chatId, message);
                break;



            case userMessage.startsWith(`${prefix}setgstatus`) ||
              userMessage.startsWith(`${prefix}togroupstatus`) ||
              userMessage.startsWith(`${prefix}tosgroup`):
                await setGroupStatusCommand(sock, chatId, message);
                break;



            case userMessage === `${prefix}meme`:
                await memeCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}joke`:
                await jokeCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}quote`:
                await quoteCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}fact`:
                await factCommand(sock, chatId, message, message);
                break;

            case userMessage.startsWith(`${prefix}weather`):
                const city = userMessage.slice((prefix + 'weather').length).trim();
                if (city) {
                    await weatherCommand(sock, chatId, message, city);
                } else {
                    await sock.sendMessage(chatId, { text: `Please specify a city, e.g., ${prefix}weather London`, ...channelInfo }, { quoted: message });
                }
                break;

            case userMessage === `${prefix}news`:
                await newsCommand(sock, chatId);
                break;

// Inside your command switch/case statement:
case userMessage.startsWith(`${prefix}ttt`) ||
     userMessage.startsWith(`${prefix}tictactoe`):
    const tttText = userMessage.split(' ').slice(1).join(' ');
    await tictactoeCommand(sock, chatId, senderId, tttText);
    break;

case userMessage.startsWith(`${prefix}move`):
    const position = parseInt(userMessage.split(' ')[1]);
    if (isNaN(position)) {
        await sock.sendMessage(chatId, {
            text: 'Please provide a valid position number for Tic-Tac-Toe move.',
            ...channelInfo
        });
    } else {
        await handleTicTacToeMove(sock, chatId, senderId, position);
    }
    break;

// === CONNECT FOUR HANDLERS ===
case userMessage.startsWith(`${prefix}connect4`) ||
     userMessage.startsWith(`${prefix}cf`):
    const cfText = userMessage.split(' ').slice(1).join(' ');
    await connectFourCommand(sock, chatId, senderId, cfText);
    break;

case userMessage.startsWith(`${prefix}drop`):
    const column = parseInt(userMessage.split(' ')[1]);
    if (isNaN(column)) {
        await sock.sendMessage(chatId, {
            text: 'Please provide a valid column number (1-7) for Connect Four move.',
            ...channelInfo
        });
    } else {
        const handled = await handleConnectFourMove(sock, chatId, senderId, column.toString());
        if (!handled) {
            await sock.sendMessage(chatId, {
                text: 'You are not in an active Connect Four game. Start one with `.connectfour`',
                ...channelInfo
            });
        }
    }
    break;

          // === FORFEIT/SURRENDER FOR BOTH GAMES ===
case userMessage === `${prefix}forfeit` ||
     userMessage === `${prefix}surrender`:
    // Try Connect Four first
    const cfHandled = await handleConnectFourMove(sock, chatId, senderId, 'forfeit');
    // Then try Tic-Tac-Toe
    const tttHandled = await handleTicTacToeMove(sock, chatId, senderId, 'forfeit');

    if (!cfHandled && !tttHandled) {
        await sock.sendMessage(chatId, {
            text: 'You are not in any active game. Start one with `.ttt` or `.connectfour`',
            ...channelInfo
        });
    }
    break;


   case userMessage === `${prefix}topmembers`:
       topMembers(sock, chatId, isGroup);
      break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Game commands
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}hangman`):
                startHangman(sock, chatId);
                break;

            case userMessage.startsWith(`${prefix}guess`):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    guessLetter(sock, chatId, guessedLetter);
                } else {
                    sock.sendMessage(chatId, { text: `Please guess a letter using ${prefix}guess <letter>`, ...channelInfo }, { quoted: message });
                }
                break;

            case userMessage.startsWith(`${prefix}trivia`):
                startTrivia(sock, chatId);
                break;

            case userMessage.startsWith(`${prefix}answer`):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) {
                    answerTrivia(sock, chatId, answer);
                } else {
                    sock.sendMessage(chatId, { text: `Please provide an answer using ${prefix}answer <answer>`, ...channelInfo }, { quoted: message });
                }
                break;

            case userMessage.startsWith(`${prefix}compliment`):
                await complimentCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}insult`):
                await insultCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}scramble`): {
                const scrambleMode = userMessage.split(' ')[1];
                await startScramble(sock, chatId, senderId, scrambleMode || '');
                break;
            }

            case userMessage.startsWith(`${prefix}endscramble`):
                await endScramble(sock, chatId);
                break;


            case userMessage.startsWith(`${prefix}vv2`):
                await vv2Command(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}8ball`):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                break;

            case userMessage.startsWith(`${prefix}lyrics`):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Game commands
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage === `${prefix}simp` || userMessage.startsWith(`${prefix}simp `):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;

            case userMessage.startsWith(`${prefix}stupid`) || userMessage.startsWith(`${prefix}itssostupid`) || userMessage.startsWith(`${prefix}iss`):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;

            case userMessage === `${prefix}dare`:
                await dareCommand(sock, chatId, message);
                break;


            case userMessage === `${prefix}truth`:
                await truthCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}clear`:
                if (isGroup) await clearCommand(sock, chatId);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Group Command
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}promote`):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;

            case userMessage.startsWith(`${prefix}demote`):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;

            case userMessage === `${prefix}ping` ||
                 userMessage === `${prefix}p`:
                await pingCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}time` ||
                 userMessage === `${prefix}date` ||
                 userMessage === `${prefix}datetime`:
                await timeCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}botinfo` ||
                 userMessage === `${prefix}info` ||
                 userMessage === `${prefix}status`:
                await botInfoCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}settimezone`) ||
                 userMessage.startsWith(`${prefix}settz`) ||
                 userMessage.startsWith(`${prefix}timezone`):
                {
                    const tzArgs = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setTimezoneCommand(sock, chatId, message, tzArgs, isOwner);
                }
                break;

            case userMessage === `${prefix}getpp`:
                await getppCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}block`):
                await blockCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}unblock`):
                await unblockCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}unblockall`:
                await unblockallCommand(sock, chatId, message);
                break;



            case userMessage === `${prefix}link`:
                await linkCommand(sock, chatId, message);
                break;


            case userMessage === `${prefix}allblocklist` ||
                 userMessage === `${prefix}listblock`:
                await blocklistCommand(sock, chatId, message);
                break;


            case userMessage === `${prefix}uptime` ||
                 userMessage === `${prefix}up` ||
                 userMessage === `${prefix}runtime`:
                await aliveCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}mention`):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                }
                break;

            case userMessage === `${prefix}setmention`:
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                }
                break;

            case userMessage.startsWith(`${prefix}blur`):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;

            case userMessage.startsWith(`${prefix}welcome`):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe || senderIsSudo) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;

            case userMessage.startsWith(`${prefix}goodbye`):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe || senderIsSudo) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;

      /*━━━━━━━━━━━━━━━━━━━━*/
            // GitHub
     /*━━━━━━━━━━━━━━━━━━━━*/


            case userMessage === `${prefix}git`:
            case userMessage === `${prefix}github`:
            case userMessage === `${prefix}sc`:
            case userMessage === `${prefix}script`:
            case userMessage === `${prefix}repo`:
                await githubCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}antibadword`):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;

            case userMessage.startsWith(`${prefix}chatbot`):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }
                // Check if sender is admin or bot owner
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: '*Only admins or bot owner can use this command*', ...channelInfo }, { quoted: message });
                    return;
                }

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Some sticker cmds & fun
            /*━━━━━━━━━━━━━━━━━━━━*/
                const match = userMessage.slice((prefix + 'chatbot').length).trim();
                await handleChatbotCommand(sock, chatId, message, match);
                break;

        case userMessage.startsWith(`${prefix}yts`) ||
             userMessage.startsWith(`${prefix}ytsearch`):
             await ytsCommand(sock, chatId, senderId, message, userMessage);
               break;

        case userMessage.startsWith(`${prefix}fetch`) ||
             userMessage.startsWith(`${prefix}inspect`):
             await fetchCommand(sock, chatId, message);
               break;

                  break;


        case userMessage.startsWith(`${prefix}setbio`):
             await setBioCommand(sock, chatId, message);
                  break;

        case userMessage.startsWith(`${prefix}league1standings`):
             await ligue1StandingsCommand(sock, chatId, message);
                break;

       case userMessage.startsWith(`${prefix}laligastandings`):
            await laligaStandingsCommand(sock, chatId, message);
                break;

       case userMessage.startsWith(`${prefix}maches`):
           await matchesCommand(sock, chatId, message);
                break;


        case userMessage.startsWith(`${prefix}mf`) ||
             userMessage.startsWith(`${prefix}mediafire`):
             await mediafireCommand(sock, chatId, message);
             break;

        case userMessage.startsWith(`${prefix}pair`) ||
             userMessage.startsWith(`${prefix}paircode`):
             await pairCommand(sock, chatId, message);
               break;

        case userMessage.startsWith(`${prefix}xvideo`) ||
             userMessage.startsWith(`${prefix}xvdl`):
             await xvdlCommand(sock, chatId, message);
               break;


        case userMessage.startsWith(`${prefix}siries`) ||
             userMessage.startsWith(`${prefix}stream`):
             await moviesCommand(sock, chatId, message);
               break;


        case userMessage.startsWith(`${prefix}trim`) ||
             userMessage.startsWith(`${prefix}trimed`):
             await trimCommand(sock, chatId, message);
               break;


        case userMessage.startsWith(`${prefix}smeme`) ||
             userMessage.startsWith(`${prefix}wmeme`):
             await smemeCommand(sock, chatId, message);
               break;

        case userMessage.startsWith(`${prefix}ytvideo`) ||
             userMessage.startsWith(`${prefix}ytv`):
             await ytplayCommand(sock, chatId, message);
               break;

        case userMessage.startsWith(`${prefix}ytaudio`) ||
             userMessage.startsWith(`${prefix}ytplay`):
             await ytsongCommand(sock, chatId, message);
               break;


        case userMessage.startsWith(`${prefix}antisticker`) ||
             userMessage.startsWith(`${prefix}nosticker`):
             await antistickerCommand(sock, chatId, message, senderId);
               break;

        case userMessage.startsWith(`${prefix}antiimage`) ||
             userMessage.startsWith(`${prefix}noimage`):
             await antiimageCommand(sock, chatId, message, senderId);
               break;


        case userMessage.startsWith(`${prefix}anticall`) ||
             userMessage.startsWith(`${prefix}nocall`):
                 await anticallCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}disp`):
                await dispCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}livescore` ||
                 userMessage === `${prefix}ls`:
                await livescoreCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}bettips`) ||
                 userMessage.startsWith(`${prefix}bet`):
                await betTipsCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}fnews` ||
                 userMessage === `${prefix}footballnews`:
                await footballNewsCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}player`):
                await playerSearchCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}team`):
                await teamSearchCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}venue`):
                await venueSearchCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}gameevents`):
                await gameEventsCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}sports`:
                await sportsHelpCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}epl`):
                await leagueCommand(sock, chatId, message, 'epl');
                break;

            case userMessage.startsWith(`${prefix}laliga`):
                await leagueCommand(sock, chatId, message, 'laliga');
                break;

            case userMessage.startsWith(`${prefix}ucl`):
                await leagueCommand(sock, chatId, message, 'ucl');
                break;

            case userMessage.startsWith(`${prefix}bundesliga`):
                await leagueCommand(sock, chatId, message, 'bundesliga');
                break;

            case userMessage.startsWith(`${prefix}seriea`):
                await leagueCommand(sock, chatId, message, 'seriea');
                break;

            case userMessage.startsWith(`${prefix}euros`):
                await leagueCommand(sock, chatId, message, 'euros');
                break;

            case userMessage.startsWith(`${prefix}fifa`):
                await leagueCommand(sock, chatId, message, 'fifa');
                break;


            case userMessage.startsWith(`${prefix}antistatusmention`) ||
                 userMessage.startsWith(`${prefix}antistatus`) ||
                 userMessage.startsWith(`${prefix}antigroupmention`) ||
                 userMessage.startsWith(`${prefix}antistatusgroup`) ||
                 userMessage.startsWith(`${prefix}antigcmention`):
                await antistatusmentionCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}take`):
                const takeArgs = rawText.slice((prefix + 'take').length).trim().split(' ');
                await takeCommand(sock, chatId, message, takeArgs);
                break;

            case userMessage === `${prefix}flirt`:
                await flirtCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}rate`):
                await characterCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}add`):
                await addCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}approve`):
                await approveCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}creategroup`):
                await createGroupCommand(sock, chatId, senderId, message, rawText);
                break;

            case userMessage.startsWith(`${prefix}wasted`):
                await wastedCommand(sock, chatId, message);
                break;

        case userMessage.startsWith(`${prefix}analyse`) ||
             userMessage.startsWith(`${prefix}vision`):
                await visionCommand(sock, chatId, message);
                break;

        case userMessage.startsWith(`${prefix}meta`) ||
             userMessage.startsWith(`${prefix}metai`):
                await metaiCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}ship`:
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Some group Commands
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage === `${prefix}groupinfo` ||
                 userMessage === `${prefix}infogroup` ||
                 userMessage === `${prefix}infogrupo`:
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}reset` ||
                userMessage === `${prefix}revoke`:
                await resetlinkCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}admin` ||
                 userMessage === `${prefix}listadmin`:
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}tourl`) ||
                 userMessage.startsWith(`${prefix}url`):
                await urlCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}chanelid`) ||
                 userMessage.startsWith(`${prefix}chjid`):
                await chaneljidCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}image`) ||
                 userMessage.startsWith(`${prefix}img`):
                await imageCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}emojimix`) ||
                 userMessage.startsWith(`${prefix}emix`):
                await emojimixCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}tg`) ||
                 userMessage.startsWith(`${prefix}tgsticker`):
                await stickerTelegramCommand(sock, chatId, message);
              break;

            case userMessage.startsWith(`${prefix}clone`) ||
                 userMessage.startsWith(`${prefix}gitclone`):
                await gitcloneCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}tostatus`) ||
                 userMessage.startsWith(`${prefix}setstatus`):
                await tostatusCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}ilama`) ||
                 userMessage.startsWith(`${prefix}illama`):
                await ilamaCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}blackai`) ||
                 userMessage.startsWith(`${prefix}blackbox`):
                await blackboxCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}mist`) ||
                 userMessage.startsWith(`${prefix}mistral`):
                await mistralCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}birdai`) ||
                 userMessage.startsWith(`${prefix}bird`):
                await birdCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}speech`) ||
                 userMessage.startsWith(`${prefix}speechwrite`):
                await speechwriterCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}locate`) ||
                 userMessage.startsWith(`${prefix}location`):
                await locationCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}perplexity`) ||
                 userMessage.startsWith(`${prefix}plexity`):
                await perplexityCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}transcribe`) ||
                 userMessage.startsWith(`${prefix}totext`):
                await transcribeCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}online`) ||
                 userMessage.startsWith(`${prefix}listonline`):
                await onlineCommand(sock, chatId, message);
              break;


            case userMessage.startsWith(`${prefix}movie`) ||
                 userMessage.startsWith(`${prefix}mvie`):
                await movieCommand(sock, chatId, message);
              break;
            /*━━━━━━━━━━━━━━━━━━━━*/
            // Other Commands And Additionals
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage === `${prefix}left` ||
                 userMessage === `${prefix}leave`:
                await leaveGroupCommand(sock, chatId, message);
                break;

           case userMessage === `${prefix}removeall` ||
                userMessage === `${prefix}killall`:
                await kickAllCommand(sock, chatId, message, senderId);
                break;


            case userMessage === `${prefix}toaudio` ||
                userMessage === `${prefix}tomp3`:
            await toAudioCommand(sock, chatId, message);
          break;

            case userMessage.startsWith(`${prefix}ytdocvideo`) ||
                 userMessage.startsWith(`${prefix}docytvideo`):
                await ytdocvideoCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}ytdocplay`) ||
                 userMessage.startsWith(`${prefix}docytplay`):
                await ytdocplayCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}clearsession` || userMessage === `${prefix}clearsesi`:
                await clearSessionCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}autostatus`):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;

            case userMessage.startsWith(`${prefix}getcmd`):
                const getcmdArgs = userMessage.split(' ').slice(1);
                await getcmdCommand(sock, chatId, message, getcmdArgs);
                break;

            case userMessage.startsWith(`${prefix}metallic`):
                await textmakerCommand(sock, chatId, message, userMessage, 'metallic');
                break;

            case userMessage.startsWith(`${prefix}ice`):
                await textmakerCommand(sock, chatId, message, userMessage, 'ice');
                break;

            case userMessage.startsWith(`${prefix}snow`):
                await textmakerCommand(sock, chatId, message, userMessage, 'snow');
                break;

            case userMessage.startsWith(`${prefix}impressive`):
                await textmakerCommand(sock, chatId, message, userMessage, 'impressive');
                break;

            case userMessage.startsWith(`${prefix}matrix`):
                await textmakerCommand(sock, chatId, message, userMessage, 'matrix');
                break;

            case userMessage.startsWith(`${prefix}light`):
                await textmakerCommand(sock, chatId, message, userMessage, 'light');
                break;

            case userMessage.startsWith(`${prefix}neon`):
                await textmakerCommand(sock, chatId, message, userMessage, 'neon');
                break;

            case userMessage.startsWith(`${prefix}devil`):
                await textmakerCommand(sock, chatId, message, userMessage, 'devil');
                break;

            case userMessage.startsWith(`${prefix}purple`):
                await textmakerCommand(sock, chatId, message, userMessage, 'purple');
                break;

            case userMessage.startsWith(`${prefix}thunder`):
                await textmakerCommand(sock, chatId, message, userMessage, 'thunder');
                break;

            case userMessage.startsWith(`${prefix}leaves`):
                await textmakerCommand(sock, chatId, message, userMessage, 'leaves');
                break;

            case userMessage.startsWith(`${prefix}1917`):
                await textmakerCommand(sock, chatId, message, userMessage, '1917');
                break;

            case userMessage.startsWith(`${prefix}arena`):
                await textmakerCommand(sock, chatId, message, userMessage, 'arena');
                break;

            case userMessage.startsWith(`${prefix}hacker`):
                await textmakerCommand(sock, chatId, message, userMessage, 'hacker');
                break;

            case userMessage.startsWith(`${prefix}sand`):
                await textmakerCommand(sock, chatId, message, userMessage, 'sand');
                break;

            case userMessage.startsWith(`${prefix}blackpink`):
                await textmakerCommand(sock, chatId, message, userMessage, 'blackpink');
                break;

            case userMessage.startsWith(`${prefix}glitch`):
                await textmakerCommand(sock, chatId, message, userMessage, 'glitch');
                break;

            case userMessage.startsWith(`${prefix}fire`):
                await textmakerCommand(sock, chatId, message, userMessage, 'fire');
                break;

            case userMessage.startsWith(`${prefix}antidelete`):
                const antideleteMatch = userMessage.slice((prefix + 'antidelete').length).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;

            case userMessage === `${prefix}surrender`:
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                break;

            case userMessage === `${prefix}cleartemp`:
                await clearTmpCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}setpp`:
                await setProfilePicture(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}setgroupdesc`):
                {
                    const text = rawText.slice((prefix + 'setgrouodesc').length).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;

            case userMessage.startsWith(`${prefix}setgroupname`):
                {
                    const text = rawText.slice((prefix + 'setgroupname').length).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;

            case userMessage.startsWith(`${prefix}setgrouppp`):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;

            case userMessage === `${prefix}getgcprofile` ||
                 userMessage.startsWith(`${prefix}getgcprofile `):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message });
                    return;
                }
                await getGroupProfile(sock, chatId, message);
                break;

            case userMessage === `${prefix}getgcname` ||
                 userMessage.startsWith(`${prefix}getgcname `):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message });
                    return;
                }
                await getGroupName(sock, chatId, message);
                break;

            case userMessage === `${prefix}getgcdescription` ||
                 userMessage === `${prefix}getgcdesc` ||
                 userMessage.startsWith(`${prefix}getgcdescription `) ||
                 userMessage.startsWith(`${prefix}getgcdesc `):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message });
                    return;
                }
                await getGroupDescription(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}setdispmessage`):
                {
                    const arg = rawText.slice((prefix + 'setdispmessage').length).trim();
                    await setDisappearingMessages(sock, chatId, senderId, arg, message);
                }
                break;

            case userMessage.startsWith(`${prefix}antibot`):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups!' }, { quoted: message });
                    return;
                }
                await handleAntibotCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Social media downloads
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}instagram`) ||
                 userMessage.startsWith(`${prefix}insta`) ||
                 (userMessage === `${prefix}ig` || userMessage.startsWith(`${prefix}ig `)):
                await instagramCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}igs`):
                await igsCommand(sock, chatId, message, true);
                break;

            case userMessage.startsWith(`${prefix}fb`) || userMessage.startsWith(`${prefix}facebook`):
                await facebookCommand(sock, chatId, message);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Song & play command cases
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}play`):
                await playCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}spotify`):
                await spotifyCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}lastseen`):
                await lastseenCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}song`) ||
                 userMessage.startsWith(`${prefix}mp3`):
                await songCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}video`):
                await videoCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}tiktok`) ||
                 userMessage.startsWith(`${prefix}tt`):
                await tiktokCommand(sock, chatId, message);
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // AI & gemini cmd cases
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}gpt`) ||
                 userMessage.startsWith(`${prefix}gemini`):
                await aiCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}translate`) ||
                 userMessage.startsWith(`${prefix}trt`):
                const commandLength = userMessage.startsWith(`${prefix}translate`) ? (prefix + 'translate').length : (prefix + 'trt').length;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                return;

            case userMessage.startsWith(`${prefix}ss`) ||
                 userMessage.startsWith(`${prefix}ssweb`) ||
                 userMessage.startsWith(`${prefix}screenshot`):
                const ssCommandLength = userMessage.startsWith(`${prefix}screenshot`) ? (prefix + 'screenshot').length : (userMessage.startsWith(`${prefix}ssweb`) ? (prefix + 'ssweb').length : (prefix + 'ss').length);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                break;

            case userMessage.startsWith(`${prefix}areact`) ||
                 userMessage.startsWith(`${prefix}autoreact`) ||
                 userMessage.startsWith(`${prefix}autoreaction`):
                const isOwnerOrSudo = message.key.fromMe || senderIsSudo;
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudo);
                break;

            case userMessage.startsWith(`${prefix}sudo`):
                await sudoCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}goodnight` ||
                 userMessage === `${prefix}lovenight` ||
                 userMessage === `${prefix}gn`:
                await goodnightCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}shayari` ||
                 userMessage === `${prefix}shayri`:
                await shayariCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}roseday`:
                await rosedayCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}imagine`) ||
                 userMessage.startsWith(`${prefix}flux`) ||
                 userMessage.startsWith(`${prefix}dalle`):
                await imagineCommand(sock, chatId, message);
                break;

            case userMessage === `${prefix}jid`:
                await groupJidCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}autotyping`):
                await autotypingCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}autorecording`) ||
                 userMessage.startsWith(`${prefix}autorecord`):
                await autorecordingCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}autoboth`):
                await autobothCommand(sock, chatId, message);
                break;


            case userMessage.startsWith(`${prefix}autoread`):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case userMessage.startsWith(`${prefix}readreciepts`):
                await readReceiptsCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}alwaysonline`):
                await alwaysonlineCommand(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}autofont`) ||
                 userMessage.startsWith(`${prefix}setfont`):
                await autofontCommand(sock, chatId, message, message.key.fromMe || senderIsSudo);
                break;

            case userMessage.startsWith(`${prefix}heart`):
                await handleHeart(sock, chatId, message);
                break;

            case userMessage.startsWith(`${prefix}horny`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['horny', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}circle`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['circle', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}lgbt`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lgbtq', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}lolice`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lolice', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}simpcard`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['simpcard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}misc`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['misc', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}its-so-stupid`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['its-so-stupid', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}namecard`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['namecard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}oogway2`):
            case userMessage.startsWith(`${prefix}oogway`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.startsWith(`${prefix}oogway2`) ? 'oogway2' : 'oogway';
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}tweet`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tweet', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(`${prefix}ytcomment`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['youtube-comment', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Photo Effects Command
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}comrade`):
            case userMessage.startsWith(`${prefix}gay`):
            case userMessage.startsWith(`${prefix}glass`):
            case userMessage.startsWith(`${prefix}jail`):
            case userMessage.startsWith(`${prefix}passed`):
            case userMessage.startsWith(`${prefix}triggered`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.slice(prefix.length).split(/\s+/)[0];
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            /*━━━━━━━━━━━━━━━━━━━━*/
            // Anime commands
            /*━━━━━━━━━━━━━━━━━━━━*/
            case userMessage.startsWith(`${prefix}animu`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await animeCommand(sock, chatId, message, args);
                }
                break;

            // Anime aliases
            case userMessage.startsWith(`${prefix}nome`):
            case userMessage.startsWith(`${prefix}nom`):
            case userMessage.startsWith(`${prefix}poke`):
            case userMessage.startsWith(`${prefix}cry`):
            case userMessage.startsWith(`${prefix}hug`):
            case userMessage.startsWith(`${prefix}pat`):
            case userMessage.startsWith(`${prefix}kiss`):
            case userMessage.startsWith(`${prefix}wink`):
            case userMessage.startsWith(`${prefix}facepalm`):
            case userMessage.startsWith(`${prefix}face-palm`):
            case userMessage.startsWith(`${prefix}loli`):
            case userMessage.startsWith(`${prefix}waifu`):
            case userMessage.startsWith(`${prefix}neko`):
            case userMessage.startsWith(`${prefix}kitsune`):
            case userMessage.startsWith(`${prefix}husbando`):
            case userMessage.startsWith(`${prefix}animequote`):
            case userMessage.startsWith(`${prefix}bite`):
            case userMessage.startsWith(`${prefix}blush`):
            case userMessage.startsWith(`${prefix}cuddle`):
            case userMessage.startsWith(`${prefix}dance`):
            case userMessage.startsWith(`${prefix}slap`):
            case userMessage.startsWith(`${prefix}pout`):
            case userMessage.startsWith(`${prefix}sleep`):
            case userMessage.startsWith(`${prefix}wave`):
            case userMessage.startsWith(`${prefix}smile`):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(prefix.length);
                    if (sub === 'facepalm') sub = 'facepalm';
                    if (sub === 'face-palm') sub = 'facepalm';
                    if (sub === 'nome') sub = 'nom';
                    if (sub === 'loli') sub = 'neko';
                    if (sub === 'animequote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;

            case userMessage === `${prefix}crop`:
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            case userMessage.startsWith(`${prefix}pies`):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    commandExecuted = true;
                }

        break;
            case userMessage === '.china':
                await piesAlias(sock, chatId, message, 'china');
                commandExecuted = true;
                break;
            case userMessage === '.indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                commandExecuted = true;
                break;
            case userMessage === '.japan':
                await piesAlias(sock, chatId, message, 'japan');
                commandExecuted = true;
                break;
            case userMessage === '.korea':
                await piesAlias(sock, chatId, message, 'korea');
                commandExecuted = true;
                break;
            case userMessage === '.hijab':
                await piesAlias(sock, chatId, message, 'hijab');
                commandExecuted = true;
                break;
            case userMessage.startsWith(`${prefix}update`):
            case userMessage.startsWith(`${prefix}start`):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, zipArg);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith(`${prefix}nobg`):
                await removebgCommand.exec(sock, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith(`${prefix}remini`) || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith(`${prefix}sora`):
                await soraCommand(sock, chatId, message);
                break;
            default:
                if (isGroup) {
                    const tasks = [
                        handleTagDetection(sock, chatId, message, senderId),
                        handleMentionDetection(sock, chatId, message),
                        handleStickerDetection(sock, chatId, message, senderId)
                    ];
                    if (userMessage) tasks.unshift(handleChatbotResponse(sock, chatId, message, userMessage, senderId));
                    await Promise.allSettled(tasks);
                }
                commandExecuted = false;
                break;
        }

        if (isGroup) {
            await Promise.allSettled([
                handleStickerDetection(sock, chatId, message, senderId),
                handleImageDetection(sock, chatId, message, senderId)
            ]);
        }

        // Stop presence after command finishes
        if (isAutobothEnabled()) stopBoth(sock, chatId);
        else if (isAutotypingEnabled()) stopTyping(sock, chatId);
        else if (isAutorecordingEnabled()) stopRecording(sock, chatId);

        // Function to handle .groupjid command
        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ This command can only be used in a group."
                });
            }

            await sock.sendMessage(chatId, {
                text: `✅ Group JID: ${groupJid}`
            }, {
                quoted: message
            });
        }


    } catch (error) {
        console.error('❌ Error in message handler:', error.stack || error.message);
        // Only try to send error message if we have a valid chatId
        if (chatId) {
            try {
                await sock.sendMessage(chatId, {
                    text: `❌ Error: ${error.message || 'Unknown error'}`,
                    ...channelInfo
                });
            } catch (_) {}
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        // Check if it's a group
        if (!id.endsWith('@g.us')) return;

        // Respect bot mode: only announce promote/demote in public mode
        let isPublic = true;
        try {
            const modeData = getCachedModeData();
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {
        }

        // Handle promotion events
        if (action === 'promote') {
            const blocked = await handleAntipromote(sock, id, participants, author);
            if (blocked) return;
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // Handle demotion events
        if (action === 'demote') {
            const protected_ = await handleAntidemote(sock, id, participants, author);
            if (protected_) return;
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        // Handle join events
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
            await handleAntibotJoin(sock, id, participants);
        }

        // Handle leave events
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

// Instead, export the handlers along with handleMessages
module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    },
    applyAlwaysOnlineOnStartup
};
