const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");
const http = require("http");
const settings = require("./settings");

// ======================================================
// RIFT-MD WEB SERVER
// ======================================================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain"
    });

    res.end("RIFT-MD IS ONLINE 🚀");
});

server.listen(PORT, () => {
    console.log(`🌐 RIFT-MD running on port ${PORT}`);
});

// ======================================================
// DATABASE
// ======================================================

const dbPath = path.join(__dirname, "database.json");

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
        dbPath,
        JSON.stringify({
            antilink: []
        }, null, 2)
    );
}

// ======================================================
// COMMAND LOADER
// ======================================================

const commands = {};
const commandsPath = path.join(__dirname, "commands");

if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, {
        recursive: true
    });
}

function loadCommands() {
    const files = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    console.log("\n==============================");
    console.log("📦 LOADING COMMANDS");
    console.log("==============================");

    for (const file of files) {
        const commandName = path
            .basename(file, ".js")
            .toLowerCase();

        const filePath = path.join(
            commandsPath,
            file
        );

        try {
            delete require.cache[
                require.resolve(filePath)
            ];

            const command = require(filePath);

            if (typeof command !== "function") {
                console.log(
                    `❌ ${file} → must export a function`
                );
                continue;
            }

            commands[commandName] = command;

            console.log(
                `✅ Loaded: ${commandName}`
            );

        } catch (error) {
            console.log(
                `❌ Failed: ${file}`
            );

            console.log(
                `   ${error.message}`
            );
        }
    }

    console.log("==============================");
    console.log(
        `📦 TOTAL COMMANDS: ${Object.keys(commands).length}`
    );
    console.log("==============================\n");
}

loadCommands();

// ======================================================
// START BOT
// ======================================================

async function startBot() {

    console.log("🔄 Starting RIFT-MD...");

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(
        path.join(__dirname, "session")
    );

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
            "RIFT-MD",
            "Chrome",
            "1.0.0"
        ],

        printQRInTerminal: false,

        generateHighQualityLinkPreview: true
    });

    // ==================================================
    // SAVE SESSION
    // ==================================================

    sock.ev.on(
        "creds.update",
        saveCreds
    );

    // ==================================================
    // WELCOME / GOODBYE EVENTS
    // ==================================================

    try {

        const eventsPath = path.join(
            __dirname,
            "events.js"
        );

        if (fs.existsSync(eventsPath)) {

            const events = require(eventsPath);

            if (typeof events === "function") {

                events(sock);

                console.log(
                    "✅ Welcome/Goodbye events loaded."
                );

            } else {

                console.log(
                    "⚠️ events.js must export a function."
                );
            }

        } else {

            console.log(
                "⚠️ events.js not found."
            );
        }

    } catch (error) {

        console.error(
            "❌ Events Error:",
            error.message
        );
    }

    // ==================================================
    // PAIRING CODE
    // ==================================================

    if (!sock.authState.creds.registered) {

        const ownerNumber =
            String(settings.ownerNumber || "")
                .replace(/[^0-9]/g, "");

        if (!ownerNumber) {

            console.log(
                "❌ ownerNumber missing in settings.js"
            );

        } else {

            console.log(
                `📱 Requesting pairing code for ${ownerNumber}...`
            );

            setTimeout(async () => {

                try {

                    let code =
                        await sock.requestPairingCode(
                            ownerNumber
                        );

                    code =
                        code
                            ?.match(/.{1,4}/g)
                            ?.join("-") ||
                        code;

                    console.log(
                        "\n================================"
                    );

                    console.log(
                        `🔐 PAIRING CODE: ${code}`
                    );

                    console.log(
                        "================================\n"
                    );

                } catch (error) {

                    console.error(
                        "❌ Pairing Error:",
                        error.message
                    );
                }

            }, 3000);
        }
    }

    // ==================================================
    // CONNECTION
    // ==================================================

    sock.ev.on(
        "connection.update",
        async (update) => {

            const {
                connection,
                lastDisconnect
            } = update;

            if (connection === "open") {

                console.log(
                    "\n🎉 RIFT-MD CONNECTED SUCCESSFULLY!"
                );

                console.log(
                    `📦 Commands: ${Object.keys(commands).length}`
                );

                console.log(
                    "🚀 Bot is ready!"
                );
            }

            if (connection === "close") {

                const statusCode =
                    lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode;

                if (
                    statusCode ===
                    DisconnectReason.loggedOut
                ) {

                    console.log(
                        "❌ WhatsApp logged out."
                    );

                    return;
                }

                console.log(
                    "🔄 Connection closed."
                );

                console.log(
                    "♻️ Reconnecting in 3 seconds..."
                );

                setTimeout(() => {
                    startBot();
                }, 3000);
            }
        }
    );

    // ==================================================
    // MESSAGE HANDLER
    // ==================================================

    sock.ev.on(
        "messages.upsert",
        async ({ messages, type }) => {

            try {

                if (type !== "notify") {
                    return;
                }

                const m = messages?.[0];

                if (!m || !m.message) {
                    return;
                }

                const from =
                    m.key.remoteJid;

                if (!from) {
                    return;
                }

                if (
                    from === "status@broadcast"
                ) {
                    return;
                }

                // ======================================
                // MESSAGE TEXT
                // ======================================

                const body =
                    m.message.conversation ||
                    m.message.extendedTextMessage?.text ||
                    m.message.imageMessage?.caption ||
                    m.message.videoMessage?.caption ||
                    m.message.documentMessage?.caption ||
                    "";

                if (!body) {
                    return;
                }

                // ======================================
                // PREFIX
                // ======================================

                const prefix =
                    settings.prefix || ".";

                if (
                    !body.startsWith(prefix)
                ) {
                    return;
                }

                // ======================================
                // PARSE COMMAND
                // ======================================

                const input =
                    body
                        .slice(prefix.length)
                        .trim();

                if (!input) {
                    return;
                }

                const parts =
                    input.split(/\s+/);

                const commandName =
                    parts.shift()
                        .toLowerCase();

                const args = parts;

                console.log(
                    `📥 ${prefix}${commandName} ${args.join(" ")}`
                );

                // ======================================
                // UNKNOWN COMMAND
                // ======================================

                if (!commands[commandName]) {

                    return await sock.sendMessage(
                        from,
                        {
                            text:
                                `❌ Command *${prefix}${commandName}* not found.\n\n` +
                                `Use *${prefix}menu* to see available commands.`
                        },
                        {
                            quoted: m
                        }
                    );
                }

                // ======================================
                // EXECUTE COMMAND
                // ======================================

                try {

                    await commands[
                        commandName
                    ](
                        sock,
                        m,
                        args
                    );

                } catch (error) {

                    console.error(
                        `❌ ${commandName} ERROR:`,
                        error
                    );

                    await sock.sendMessage(
                        from,
                        {
                            text:
                                `❌ *${commandName} Error*\n\n` +
                                `⚠️ ${error.message || "Unknown error"}`
                        },
                        {
                            quoted: m
                        }
                    );
                }

            } catch (error) {

                console.error(
                    "❌ Message Handler Error:",
                    error
                );
            }
        }
    );
}

// ======================================================
// RUN BOT
// ======================================================

startBot().catch(error => {

    console.error(
        "\n❌ FATAL ERROR:"
    );

    console.error(error);
});
