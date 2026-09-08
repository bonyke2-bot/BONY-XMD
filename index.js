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
// BONY-XMD UPTIME SERVER
// ======================================================

const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });

        res.end("BONY-XMD IS ONLINE");
    });

    server.listen(port, () => {
        console.log(`🌐 BONY-XMD server running on port ${port}`);
    });

    server.on("error", (e) => {
        if (e.code === "EADDRINUSE") {
            console.log(`⚠️ Port ${port} busy, trying ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error("Server Error:", e);
        }
    });
};

startServer(process.env.PORT || 3000);

// ======================================================
// DATABASE
// ======================================================

const dbPath = path.join(__dirname, "database.json");

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
        dbPath,
        JSON.stringify({
            antilink: [],
            autoreact: false,
            autoread: false,
            mode: "public"
        }, null, 2)
    );
}

// ======================================================
// LOAD COMMANDS
// ======================================================

const commands = {};
const commandsPath = path.join(__dirname, "commands");

function loadCommands() {

    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, {
            recursive: true
        });

        console.log("⚠️ commands folder created.");
        return;
    }

    const files = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {

        const commandName = path
            .basename(file, ".js")
            .toLowerCase();

        const filePath = path.join(commandsPath, file);

        try {

            // Clear require cache
            delete require.cache[require.resolve(filePath)];

            const command = require(filePath);

            if (typeof command !== "function") {
                console.error(
                    `❌ Command ${file} does not export a function.`
                );
                continue;
            }

            commands[commandName] = command;

        } catch (error) {

            console.error(`\n❌ Failed to load command: ${file}`);
            console.error(`➡️ Error: ${error.message}`);

            if (error.stack) {
                console.error(error.stack);
            }

            console.error("");
        }
    }

    console.log(
        `📦 Commands loaded successfully: ${Object.keys(commands).length}\n`
    );
}

loadCommands();

// ======================================================
// START BOT
// ======================================================

async function startBot() {

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState("session");

    const {
        version
    } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({
            level: "silent"
        }),
        auth: state,
        browser: [
            "Ubuntu",
            "Chrome",
            "20.0.04"
        ],
        printQRInTerminal: false
    });

    // ==================================================
    // PAIRING CODE
    // ==================================================

    if (!sock.authState.creds.registered) {

        const ownerPhone =
            settings.ownerNumber
                .replace(/[^0-9]/g, "");

        console.log(
            `\n🔄 Requesting pairing code for: ${ownerPhone}...`
        );

        setTimeout(async () => {

            try {

                let code =
                    await sock.requestPairingCode(ownerPhone);

                code =
                    code?.match(/.{1,4}/g)?.join("-") ||
                    code;

                console.log(
                    `\n✅ YOUR PAIRING CODE: ${code}\n`
                );

            } catch (err) {

                console.log(
                    "❌ Pairing Error:",
                    err.message
                );
            }

        }, 5000);
    }

    // ==================================================
    // SAVE CREDENTIALS
    // ==================================================

    sock.ev.on(
        "creds.update",
        saveCreds
    );

    // ==================================================
    // AUTO STATUS VIEW + REACTION
    // ==================================================

    sock.ev.on(
        "messages.upsert",
        async (chatUpdate) => {

            try {

                const m =
                    chatUpdate.messages?.[0];

                if (!m || !m.message) return;

                if (
                    m.key.remoteJid !==
                    "status@broadcast"
                ) {
                    return;
                }

                const emojis = [
                    "💚",
                    "🔥",
                    "✨",
                    "🙌",
                    "💯",
                    "👑",
                    "🚀",
                    "😍",
                    "⚡",
                    "💎"
                ];

                const randomEmoji =
                    emojis[
                        Math.floor(
                            Math.random() *
                            emojis.length
                        )
                    ];

                const participant =
                    m.key.participant ||
                    m.participant;

                if (!participant) return;

                // View status
                await sock.readMessages([
                    m.key
                ]);

                // React to status
                await sock.sendMessage(
                    "status@broadcast",
                    {
                        react: {
                            text: randomEmoji,
                            key: m.key
                        }
                    },
                    {
                        statusJidList: [
                            participant
                        ]
                    }
                );

            } catch (error) {

                console.error(
                    "Auto Status Error:",
                    error.message
                );
            }
        }
    );

    // ==================================================
    // CONNECTION UPDATE
    // ==================================================

    sock.ev.on(
        "connection.update",
        async (update) => {

            const {
                connection,
                lastDisconnect
            } = update;

            if (connection === "close") {

                const statusCode =
                    lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode;

                if (
                    statusCode !==
                    DisconnectReason.loggedOut
                ) {

                    console.log(
                        "🔄 Connection closed. Reconnecting..."
                    );

                    setTimeout(() => {
                        startBot();
                    }, 3000);

                } else {

                    console.log(
                        "❌ WhatsApp logged out."
                    );
                }

            } else if (connection === "open") {

                const ownerJid =
                    settings.ownerNumber
                        .replace(/[^0-9]/g, "") +
                    "@s.whatsapp.net";

                console.log(
                    "\n🎊 BONY-XMD IS CONNECTED!"
                );

                const channelInfo = {
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid:
                                "0029Vb8coEnKAwEcRBDDnq0Z@newsletter",
                            newsletterName:
                                "BONY-XMD",
                            serverMessageId: -1
                        }
                    }
                };

                try {

                    await sock.sendMessage(
                        ownerJid,
                        {
                            image: {
                                url:
                                    "https://files.catbox.moe/vv674d.jpg"
                            },

                            caption:
                                `╭━━━〔 🤖 *BONY-XMD STATUS* 〕━━━⬣\n` +
                                `┃ ✨ *Bot:* Online & Ready!\n` +
                                `┃ 🚀 *Status:* Fully Connected\n` +
                                `┃ ⚡ *Mode:* Active\n` +
                                `┃ 📦 *Commands:* ${Object.keys(commands).length}\n` +
                                `╰━━━━━━━━━━━━━━━━━━━━⬣`,

                            ...channelInfo
                        }
                    );

                } catch (error) {

                    console.error(
                        "Owner notification error:",
                        error.message
                    );
                }
            }
        }
    );

    // ==================================================
    // MESSAGE HANDLER
    // ==================================================

    sock.ev.on(
        "messages.upsert",
        async ({
            messages,
            type
        }) => {

            try {

                if (type !== "notify") return;

                const m =
                    messages?.[0];

                if (!m || !m.message) return;

                const from =
                    m.key.remoteJid;

                if (
                    !from ||
                    from === "status@broadcast"
                ) {
                    return;
                }

                // ======================================
                // DATABASE READ FOR GLOBAL FEATURES
                // ======================================
                let globalDb = { antilink: [], autoreact: false, autoread: false, mode: "public" };
                if (fs.existsSync(dbPath)) {
                    try {
                        globalDb = JSON.parse(fs.readFileSync(dbPath, "utf8"));
                    } catch {
                        globalDb = { antilink: [], autoreact: false, autoread: false, mode: "public" };
                    }
                }

                // AUTOREAD FEATURE
                if (globalDb.autoread) {
                    try {
                        await sock.readMessages([m.key]);
                    } catch (e) {
                        console.error("AutoRead Error:", e.message);
                    }
                }

                // AUTOREACT FEATURE
                if (globalDb.autoreact) {
                    try {
                        const emojis = ["💚", "🔥", "✨", "🙌", "💯", "👑", "🚀", "😍", "⚡", "💎"];
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await sock.sendMessage(from, {
                            react: {
                                text: randomEmoji,
                                key: m.key
                            }
                        });
                    } catch (e) {
                        console.error("AutoReact Error:", e.message);
                    }
                }

                const isGroup =
                    from.endsWith("@g.us");

                const sender =
                    m.key.participant ||
                    m.key.remoteJid;

                // ======================================
                // MESSAGE BODY
                // ======================================

                // ======================================
                // MESSAGE BODY
                // ======================================

                let msg = m.message;

                // Unwrap common WhatsApp message containers
                if (msg.ephemeralMessage?.message) {
                    msg = msg.ephemeralMessage.message;
                }

                if (msg.viewOnceMessage?.message) {
                    msg = msg.viewOnceMessage.message;
                }

                if (msg.viewOnceMessageV2?.message) {
                    msg = msg.viewOnceMessageV2.message;
                }

                if (msg.viewOnceMessageV2Extension?.message) {
                    msg = msg.viewOnceMessageV2Extension.message;
                }

                const body =
                    msg.conversation ||
                    msg.extendedTextMessage?.text ||
                    msg.imageMessage?.caption ||
                    msg.videoMessage?.caption ||
                    msg.documentMessage?.caption ||
                    msg.buttonsResponseMessage?.selectedButtonId ||
                    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
                    msg.templateButtonReplyMessage?.selectedId ||
                    "";

                if (!body) return;

                const prefix =
                    settings.prefix || ".";

                const ownerNumber =
                    settings.ownerNumber
                        .replace(/[^0-9]/g, "");

                const isOwner =
                    sender.includes(ownerNumber) ||
                    m.key.fromMe;

                // ======================================
                // MODE CHECK (PUBLIC / PRIVATE)
                // ======================================
                const botMode = globalDb.mode || "public";
                if (botMode === "private" && !isOwner) {
                    return; // Bloke tout lòt moun si l an Private epi se pa ou menm
                }

                // ======================================
                // ANTILINK
                // ======================================

                if (isGroup && body) {

                    let db = {
                        antilink: []
                    };

                    if (fs.existsSync(dbPath)) {

                        try {

                            db = JSON.parse(
                                fs.readFileSync(
                                    dbPath,
                                    "utf8"
                                )
                            );

                        } catch {

                            db = {
                                antilink: []
                            };
                        }
                    }

                    if (
                        Array.isArray(db.antilink) &&
                        db.antilink.includes(from)
                    ) {

                        const linkRegex =
                            /chat\.whatsapp\.com\/|https?:\/\//i;

                        if (
                            linkRegex.test(body)
                        ) {

                            try {

                                const metadata =
                                    await sock.groupMetadata(
                                        from
                                    );

                                const admins =
                                    metadata.participants
                                        .filter(
                                            p =>
                                                p.admin !== null
                                        )
                                        .map(
                                            p => p.id
                                        );

                                const botId =
                                    sock.user.id
                                        .split(":")[0] +
                                    "@s.whatsapp.net";

                                const isBotAdmin =
                                    admins.includes(
                                        botId
                                    );

                                const isSenderAdmin =
                                    admins.includes(
                                        sender
                                    );

                                if (
                                    !isSenderAdmin &&
                                    !isOwner &&
                                    isBotAdmin
                                ) {

                                    await sock.sendMessage(
                                        from,
                                        {
                                            delete:
                                                m.key
                                        }
                                    );

                                    await sock.sendMessage(
                                        from,
                                        {
                                            text:
                                                `🚫 *Link Detected!*\n\n` +
                                                `@${sender.split("@")[0]}, links are not allowed here!`,
                                            mentions: [
                                                sender
                                            ]
                                        }
                                    );
                                }

                            } catch (error) {

                                console.error(
                                    "AntiLink Error:",
                                    error.message
                                );
                            }
                        }
                    }
                }

                // ======================================
                // PREFIX CHECK
                // ======================================

                if (
                    !body.startsWith(prefix)
                ) {
                    return;
                }

                const input =
                    body
                        .slice(prefix.length)
                        .trim();

                if (!input) return;

                const parts =
                    input.split(/\s+/);

                const commandName =
                    parts.shift()
                        .toLowerCase();

                const args = parts;

                // ======================================
                // ANTILINK COMMAND
                // ======================================

                if (
                    commandName === "antilink"
                ) {

                    if (!isOwner) {

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    "❌ *Access Denied:* Only the Bot Owner can use this command."
                            },
                            {
                                quoted: m
                            }
                        );
                    }

                    let db = {
                        antilink: []
                    };

                    try {

                        if (
                            fs.existsSync(dbPath)
                        ) {

                            db = JSON.parse(
                                fs.readFileSync(
                                    dbPath,
                                    "utf8"
                                )
                            );
                        }

                    } catch {

                        db = {
                            antilink: []
                        };
                    }

                    if (
                        !Array.isArray(
                            db.antilink
                        )
                    ) {

                        db.antilink = [];
                    }

                    if (
                        args[0] === "on"
                    ) {

                        if (
                            !db.antilink.includes(
                                from
                            )
                        ) {

                            db.antilink.push(
                                from
                            );
                        }

                        fs.writeFileSync(
                            dbPath,
                            JSON.stringify(
                                db,
                                null,
                                2
                            )
                        );

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    "🛡️ *AntiLink System:* Activated! ✅"
                            },
                            {
                                quoted: m
                            }
                        );

                    } else if (
                        args[0] === "off"
                    ) {

                        db.antilink =
                            db.antilink.filter(
                                id =>
                                    id !== from
                            );

                        fs.writeFileSync(
                            dbPath,
                            JSON.stringify(
                                db,
                                null,
                                2
                            )
                        );

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    "🛡️ *AntiLink System:* Deactivated! ❌"
                            },
                            {
                                quoted: m
                            }
                        );

                    } else {

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    `❌ *Usage:* \`${prefix}antilink on/off\``
                            },
                            {
                                quoted: m
                            }
                        );
                    }
                }

                // ======================================
                // SET PREFIX
                // ======================================

                if (
                    commandName === "setprefix"
                ) {

                    if (!isOwner) {

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    "❌ *Access Denied:* Only the Bot Owner can use this command."
                            },
                            {
                                quoted: m
                            }
                        );
                    }

                    if (!args[0]) {

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    `❌ *Usage:* \`${prefix}setprefix [new_prefix]\`\n` +
                                    `💡 *Example:* \`${prefix}setprefix !\``
                            },
                            {
                                quoted: m
                            }
                        );
                    }

                    const newPrefix =
                        args[0];

                    try {

                        const settingsPath =
                            path.join(
                                __dirname,
                                "settings.js"
                            );

                        let settingsContent =
                            fs.readFileSync(
                                settingsPath,
                                "utf8"
                            );

                        settingsContent =
                            settingsContent.replace(
                                /prefix:\s*["'`].*?["'`]/,
                                `prefix: "${newPrefix}"`
                            );

                        fs.writeFileSync(
                            settingsPath,
                            settingsContent,
                            "utf8"
                        );

                        settings.prefix =
                            newPrefix;

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    `✅ *Prefix successfully changed to:* \`${newPrefix}\``
                            },
                            {
                                quoted: m
                            }
                        );

                    } catch (error) {

                        console.error(
                            "SetPrefix Error:",
                            error.message
                        );

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    "❌ *Error:* Failed to update settings.js"
                            },
                            {
                                quoted: m
                            }
                        );
                    }
                }

                // ======================================
                // COMMAND ALIASES
                // ======================================

                const aliases = {
                    "ig": "igdl",
                    "instagram": "igdl",
                    "song": "play",
                    "mp3": "play",
                    "mp4": "video",
                    "yt": "video"
                };

                const resolvedCommand =
                    aliases[commandName] || commandName;

                // ======================================
                // COMMAND EXECUTION
                // ======================================

                if (
                    commands[resolvedCommand]
                ) {

                    try {

                        await commands[
                            resolvedCommand
                        ](
                            sock,
                            m,
                            args
                        );

                    } catch (error) {

                        console.error(
                            `❌ Error executing ${commandName}:`,
                            error
                        );

                        await sock.sendMessage(
                            from,
                            {
                                text:
                                    `❌ *Command Error:* ${commandName}\n\n` +
                                    `⚠️ ${error.message}`
                            },
                            {
                                quoted: m
                            }
                        );
                    }

                    return;
                }

            } catch (error) {

                console.error(
                    "Message Handler Error:",
                    error
                );
            }
        }
    );
}

// ======================================================
// START
// ======================================================

startBot().catch(error => {
    console.error(
        "❌ FATAL BOT ERROR:",
        error
    );
});
