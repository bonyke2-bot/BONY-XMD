const { Telegraf } = require("telegraf");
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
        res.end("RIFT-MD TELEGRAM IS ONLINE");
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
// START TELEGRAM BOT
// ======================================================

async function startBot() {
    // Sèvi ak Token Telegram ki nan settings ou oswa nan varyab anviwònman
    const token = settings.telegramToken || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error("❌ FATAL: Telegram Bot Token manke nan settings.js oswa process.env!");
        process.exit(1);
    }

    const bot = new Telegraf(token);

    // Enfòmasyon sou demaraj bot la
    bot.catch((err, ctx) => {
        console.error(`❌ Telegraf Error for ${ctx.updateType}:`, err);
    });

    // Lè bot la limen
    bot.telegram.getMe().async ? await bot.telegram.getMe() : null;
    console.log("\n🎊 RIFT-MD TELEGRAM CONNECTED!");

    // Voye mesaj bay mèt la si sa nesesè oswa jere kòmand yo
    try {
        const ownerId = settings.ownerId || settings.ownerNumber;
        if (ownerId) {
            await bot.telegram.sendMessage(ownerId, 
                `╭━━━〔 🤖 *RIFT-MD STATUS* 〕━━━⬣\n` +
                `┃ ✨ *Bot:* Online & Ready (Telegram)!\n` +
                `┃ 🚀 *Status:* Fully Connected\n` +
                `┃ ⚡ *Mode:* Active\n` +
                `┃ 📦 *Commands:* ${Object.keys(commands).length}\n` +
                `╰━━━━━━━━━━━━━━━━━━━━⬣`,
                { parse_mode: "Markdown" }
            );
        }
    } catch (e) {
        console.error("Owner notification error:", e.message);
    }

    // ==================================================
    // MESSAGES / TEXT HANDLER
    // ==================================================
    bot.on("text", async (ctx) => {
        try {
            const globalDb = getDb();
            const body = ctx.message.text || "";
            const sender = String(ctx.from.id);
            const from = String(ctx.chat.id);
            const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";

            // Mode Check (Public / Private)
            const ownerId = String(settings.ownerId || settings.ownerNumber || "");
            const isOwner = sender === ownerId;

            if ((globalDb.mode || "public") === "private" && !isOwner) return;

            // ANTILINK sou Telegram
            if (isGroup) {
                const db = getDb();
                if (Array.isArray(db.antilink) && db.antilink.includes(from)) {
                    const linkRegex = /t\.me\/|https?:\/\//i;
                    if (linkRegex.test(body)) {
                        try {
                            const member = await ctx.telegram.getChatMember(from, ctx.from.id);
                            const isAdmin = member.status === "creator" || member.status === "administrator";
                            if (!isAdmin && !isOwner) {
                                await ctx.deleteMessage();
                                await ctx.reply(`🚫 *Link Detected!*\n\n@${ctx.from.username || ctx.from.first_name}, links are not allowed!`, { parse_mode: "Markdown" });
                                return;
                            }
                        } catch (e) {
                            console.error("Antilink Error:", e.message);
                        }
                    }
                }
            }

            const prefix = settings.prefix || ".";
            if (!body.startsWith(prefix)) return;

            const input = body.slice(prefix.length).trim();
            if (!input) return;

            const parts = input.split(/\s+/);
            const commandName = parts.shift().toLowerCase();
            const args = parts;

            // FAKE `m` ak `sock` objè pou adapte kòmand ki te fèt pou Baileys yo
            // Sa ap pèmèt kòmand ki te ekri pou WhatsApp yo fonksyone pi fasil sou Telegram
            const sock = {
                sendMessage: async (jid, content, options) => {
                    let targetChat = jid === "status@broadcast" ? from : jid;
                    if (content.text) {
                        return await bot.telegram.sendMessage(targetChat, content.text, { parse_mode: "Markdown" });
                    } else if (content.image) {
                        const imgUrl = typeof content.image.url === "string" ? content.image.url : "";
                        return await bot.telegram.sendPhoto(targetChat, imgUrl, { caption: content.caption || "", parse_mode: "Markdown" });
                    } else if (content.video) {
                        const vidUrl = typeof content.video.url === "string" ? content.video.url : "";
                        return await bot.telegram.sendVideo(targetChat, vidUrl, { caption: content.caption || "", parse_mode: "Markdown" });
                    }
                },
                groupMetadata: async (jid) => {
                    const chat = await bot.telegram.getChat(jid);
                    return { subject: chat.title || "Group" };
                }
            };

            const m = {
                key: {
                    remoteJid: from,
                    fromMe: isOwner,
                    id: ctx.message.message_id,
                    participant: sender
                },
                message: { conversation: body }
            };

            // ANTILINK COMMAND
            if (commandName === "antilink") {
                if (!isOwner) return await ctx.reply("❌ Owner only!");
                const db = getDb();
                if (!Array.isArray(db.antilink)) db.antilink = [];
                if (args[0] === "on") {
                    if (!db.antilink.includes(from)) db.antilink.push(from);
                    saveDb(db);
                    return await ctx.reply("🛡️ *AntiLink:* Activated! ✅", { parse_mode: "Markdown" });
                } else if (args[0] === "off") {
                    db.antilink = db.antilink.filter(i => i !== from);
                    saveDb(db);
                    return await ctx.reply("🛡️ *AntiLink:* Deactivated! ❌", { parse_mode: "Markdown" });
                }
                return await ctx.reply(`❌ Usage: \`${prefix}antilink on/off\``, { parse_mode: "Markdown" });
            }

            // SETPREFIX COMMAND
            if (commandName === "setprefix") {
                if (!isOwner) return await ctx.reply("❌ Owner only!");
                if (!args[0]) return await ctx.reply(`❌ Usage: \`${prefix}setprefix !\``, { parse_mode: "Markdown" });
                try {
                    const sp = path.join(__dirname, "settings.js");
                    let sc = fs.readFileSync(sp, "utf8");
                    sc = sc.replace(/prefix:\s*["'`].*?["'`]/, `prefix: "${args[0]}"`);
                    fs.writeFileSync(sp, sc, "utf8");
                    settings.prefix = args[0];
                    return await ctx.reply(`✅ Prefix: \`${args[0]}\``, { parse_mode: "Markdown" });
                } catch {
                    return await ctx.reply("❌ Failed to update prefix.");
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
                    await commands[resolvedCommand](sock, m, args, ctx);
                } catch (error) {
                    console.error(`❌ Error in ${commandName}:`, error);
                    await ctx.reply(`❌ *Command Error:* ${commandName}\n\n⚠️ ${error.message}`, { parse_mode: "Markdown" });
                }
            }

        } catch (error) {
            console.error("Message Handler Error:", error);
        }
    });

    // Lanse Bot la
    bot.launch();
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

// ======================================================
// START
// ======================================================

startBot().catch(err => console.error("❌ FATAL:", err));
