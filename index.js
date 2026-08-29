const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const http = require("http");
const path = require("path");
const settings = require("./settings");

// ======================================================
// UPTIME SERVER
// ======================================================

const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("RIFT-MD IS ONLINE");
    });
    server.listen(port, () => console.log(`🌐 Server on port ${port}`));
    server.on("error", (e) => {
        if (e.code === "EADDRINUSE") startServer(port + 1);
        else console.error("Server Error:", e);
    });
};
startServer(process.env.PORT || 3000);

// ======================================================
// DATABASE
// ======================================================

const dbPath = path.join(__dirname, "database.json");

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
        antilink: [], autoreact: false, autoread: false,
        mode: "public", groups: {}
    }, null, 2));
}

function getDb() {
    try {
        if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    } catch {}
    return { antilink: [], autoreact: false, autoread: false, mode: "public", groups: {} };
}

function saveDb(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// ======================================================
// LOAD COMMANDS
// ======================================================

const commands = {};
const commandsPath = path.join(__dirname, "commands");

function loadCommands() {
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
    for (const file of files) {
        const commandName = path.basename(file, ".js").toLowerCase();
        const filePath = path.join(commandsPath, file);
        try {
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);
            if (typeof command !== "function") continue;
            commands[commandName] = command;
        } catch (error) {
            console.error(`❌ Failed to load: ${file} →`, error.message);
        }
    }
    console.log(`📦 Commands loaded: ${Object.keys(commands).length}\n`);
}

loadCommands();

// ======================================================
// START BOT
// ======================================================

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    // ==================================================
    // PAIRING CODE
    // ==================================================

    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, "");
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n✅ YOUR PAIRING CODE: ${code}\n`);
            } catch (err) {
                console.log("❌ Pairing Error:", err.message);
            }
        }, 5000);
    }

    // ==================================================
    // CONNECTION UPDATE
    // ==================================================

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("🔄 Reconnecting...");
                setTimeout(() => startBot(), 3000);
            } else {
                console.log("❌ Logged out.");
            }
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            console.log("\n🎊 RIFT-MD CONNECTED!");
            try {
                await sock.sendMessage(ownerJid, {
                    image: { url: "https://files.catbox.moe/vv674d.jpg" },
                    caption:
                        `╭━━━〔 🤖 *RIFT-MD STATUS* 〕━━━⬣\n` +
                        `┃ ✨ *Bot:* Online & Ready!\n` +
                        `┃ 🚀 *Status:* Fully Connected\n` +
                        `┃ ⚡ *Mode:* Active\n` +
                        `┃ 📦 *Commands:* ${Object.keys(commands).length}\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━⬣`,
                    contextInfo: {
                        forwardingScore: 999, isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363407561123100@newsletter",
                            newsletterName: "RIFT-MD", serverMessageId: -1
                        }
                    }
                });
            } catch (e) {
                console.error("Owner notification error:", e.message);
            }
        }
    });

    // ==================================================
    // GOODBYE via group-participants.update
    // ==================================================

    sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
        console.log(`\n📢 EVENT: ${action} | GROUP: ${id} | USERS: ${participants}`);
        try {
            const db = getDb();
            const gs = db.groups?.[id] || {};

            if (action !== "remove" || gs.goodbye !== true) return;

            let groupName = "Group";
            try {
                const meta = await sock.groupMetadata(id);
                groupName = meta.subject;
            } catch {}

            for (const p of participants) {
                const participant = typeof p === "string" ? p : (p.id || p.jid || String(p));
                const number = participant.split("@")[0];
                const profilePic = "https://files.catbox.moe/vv674d.jpg";

                console.log(`✅ Sending GOODBYE to @${number}`);
                await sock.sendMessage(id, {
                    image: { url: profilePic },
                    caption:
                        `╭━━━〔 👋 *GOODBYE* 〕━━━⬣\n` +
                        `┃ 👤 *Member Left:* @${number}\n` +
                        `┃ 🏠 *Group:* ${groupName}\n` +
                        `┃ 💔 We will miss you!\n` +
                        `┃ 🙏 Best of luck in your life.\n` +
                        `╰━━━━━━━━━━━━━━━━━━━━⬣`,
                    mentions: [participant]
                });
            }
        } catch (err) {
            console.error("Goodbye Error:", err.message);
        }
    });

    // ==================================================
    // MESSAGES UPSERT (status + messages)
    // ==================================================

    sock.ev.on("messages.upsert", async (chatUpdate) => {

        // --- AUTO STATUS ---
        try {
            const ms = chatUpdate.messages?.[0];
            if (ms?.message && ms.key.remoteJid === "status@broadcast") {
                const emojis = ["💚","🔥","✨","🙌","💯","👑","🚀","😍","⚡","💎"];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                const participant = ms.key.participant || ms.participant;
                if (participant) {
                    await sock.readMessages([ms.key]);
                    await sock.sendMessage("status@broadcast", {
                        react: { text: randomEmoji, key: ms.key }
                    }, { statusJidList: [participant] });
                }
            }
        } catch {}

        // --- MESSAGE HANDLER ---
        try {
            const { messages, type } = chatUpdate;
            if (type !== "notify") return;

            const m = messages?.[0];
            if (!m || !m.message) return;

            const from = m.key.remoteJid;
            if (!from || from === "status@broadcast") return;

            const globalDb = getDb();

            if (globalDb.autoread) {
                try { await sock.readMessages([m.key]); } catch {}
            }
            if (globalDb.autoreact) {
                try {
                    const emojis = ["💚","🔥","✨","🙌","💯","👑","🚀","😍","⚡","💎"];
                    await sock.sendMessage(from, {
                        react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: m.key }
                    });
                } catch {}
            }

            const isGroup = from.endsWith("@g.us");
            const sender = m.key.participant || m.key.remoteJid;

            const body =
                m.message.conversation ||
                m.message.extendedTextMessage?.text ||
                m.message.imageMessage?.caption ||
                m.message.videoMessage?.caption ||
                m.message.documentMessage?.caption || "";

            if (!body) return;

            const prefix = settings.prefix || ".";
            const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, "");
            const isOwner = sender.includes(ownerNumber) || m.key.fromMe;

            if ((globalDb.mode || "public") === "private" && !isOwner) return;

            // ANTILINK
            if (isGroup) {
                const db = getDb();
                if (Array.isArray(db.antilink) && db.antilink.includes(from)) {
                    const linkRegex = /chat\.whatsapp\.com\/|https?:\/\//i;
                    if (linkRegex.test(body)) {
                        try {
                            const meta = await sock.groupMetadata(from);
                            const admins = meta.participants.filter(p => p.admin).map(p => p.id);
                            const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
                            if (!admins.includes(sender) && !isOwner && admins.includes(botId)) {
                                await sock.sendMessage(from, { delete: m.key });
                                await sock.sendMessage(from, {
                                    text: `🚫 *Link Detected!*\n\n@${sender.split("@")[0]}, links are not allowed!`,
                                    mentions: [sender]
                                });
                            }
                        } catch {}
                    }
                }
            }

            if (!body.startsWith(prefix)) return;
            const input = body.slice(prefix.length).trim();
            if (!input) return;

            const parts = input.split(/\s+/);
            const commandName = parts.shift().toLowerCase();
            const args = parts;

            // ANTILINK COMMAND
            if (commandName === "antilink") {
                if (!isOwner) return await sock.sendMessage(from, { text: "❌ Owner only!" }, { quoted: m });
                const db = getDb();
                if (!Array.isArray(db.antilink)) db.antilink = [];
                if (args[0] === "on") {
                    if (!db.antilink.includes(from)) db.antilink.push(from);
                    saveDb(db);
                    return await sock.sendMessage(from, { text: "🛡️ *AntiLink:* Activated! ✅" }, { quoted: m });
                } else if (args[0] === "off") {
                    db.antilink = db.antilink.filter(i => i !== from);
                    saveDb(db);
                    return await sock.sendMessage(from, { text: "🛡️ *AntiLink:* Deactivated! ❌" }, { quoted: m });
                }
                return await sock.sendMessage(from, { text: `❌ Usage: \`${prefix}antilink on/off\`` }, { quoted: m });
            }

            // SETPREFIX COMMAND
            if (commandName === "setprefix") {
                if (!isOwner) return await sock.sendMessage(from, { text: "❌ Owner only!" }, { quoted: m });
                if (!args[0]) return await sock.sendMessage(from, { text: `❌ Usage: \`${prefix}setprefix !\`` }, { quoted: m });
                try {
                    const sp = path.join(__dirname, "settings.js");
                    let sc = fs.readFileSync(sp, "utf8");
                    sc = sc.replace(/prefix:\s*["'`].*?["'`]/, `prefix: "${args[0]}"`);
                    fs.writeFileSync(sp, sc, "utf8");
                    settings.prefix = args[0];
                    return await sock.sendMessage(from, { text: `✅ Prefix: \`${args[0]}\`` }, { quoted: m });
                } catch {
                    return await sock.sendMessage(from, { text: "❌ Failed to update prefix." }, { quoted: m });
                }
            }

            // ALIASES
            const aliases = {
                "ig": "igdl", "instagram": "igdl",
                "song": "play", "mp3": "play",
                "mp4": "video", "yt": "video"
            };

            const resolvedCommand = aliases[commandName] || commandName;

            if (commands[resolvedCommand]) {
                try {
                    await commands[resolvedCommand](sock, m, args);
                } catch (error) {
                    console.error(`❌ Error in ${commandName}:`, error);
                    await sock.sendMessage(from, {
                        text: `❌ *Command Error:* ${commandName}\n\n⚠️ ${error.message}`
                    }, { quoted: m });
                }
            }

        } catch (error) {
            console.error("Message Handler Error:", error);
        }
    });
}

// ======================================================
// START
// ======================================================

startBot().catch(err => console.error("❌ FATAL:", err));
