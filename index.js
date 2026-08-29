import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import config from "./config.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// === BONY-BOT~ SESSION HANDLER (Supports BONY-BOT~, WOLF-BOT~, BONY-XMD~) ===
if(!fs.existsSync("./auth")) fs.mkdirSync("./auth",{recursive:true});
if(process.env.SESSION_ID){
  try{
    let b64 = process.env.SESSION_ID.trim();
    if(b64.includes("BONY-BOT~")) b64 = b64.split("BONY-BOT~")[1];
    else if(b64.includes("WOLF-BOT~")) b64 = b64.split("WOLF-BOT~")[1];
    else if(b64.includes("~")) b64 = b64.split("~").pop();
    const buff = Buffer.from(b64, 'base64');
    fs.writeFileSync("./auth/creds.json", buff);
    console.log("✅ BONY-BOT Session Loaded!");
  }catch(e){
    console.log("❌ Session Failed:", e.message);
    console.log("👉 Get from:", config.pairSite);
  }
}

const { state, saveCreds } = await useMultiFileAuthState("./auth");
const sock = makeWASocket({
  auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:"silent"})) },
  logger: pino({level:"silent"}),
  browser: ["BONY XMD","Chrome","110.0"],
  printQRInTerminal: false
});
sock.ev.on("creds.update", saveCreds);

sock.ev.on("connection.update", async (u)=>{
  const {connection, lastDisconnect} = u;
  if(connection==="open"){
    console.log(`🤖 ${config.botName} ONLINE!`);
    await delay(2000);
    try{
      await sock.sendMessage(config.ownerNumber[0]+"@s.whatsapp.net", {text: `*🤖 ${config.botName} CONNECTED!*\n\n✅ Bot is online\n⚡ Prefix: ${config.botPrefix}\n🔗 Pair: ${config.pairSite}\n\nType ${config.botPrefix}menu`});
    }catch{}
  }
  if(connection==="close"){
    const code = lastDisconnect?.error?.output?.statusCode;
    if(code!== DisconnectReason.loggedOut){
      console.log("Reconnecting...");
      setTimeout(()=>process.exit(0),3000);
    } else {
      console.log("Logged out - Get new session:", config.pairSite);
    }
  }
});

// COMMAND HANDLER - Load from commands/
sock.ev.on("messages.upsert", async ({messages})=>{
  const m = messages[0];
  if(!m.message || m.key.fromMe) return;
  const from = m.key.remoteJid;
  const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
  if(!body.startsWith(config.botPrefix)) return;

  const args = body.slice(config.botPrefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const text = args.join(" ");

  // Try load command file
  const cmdPath = join(__dirname, "commands", cmdName+".js");
  if(fs.existsSync(cmdPath)){
    try{
      const command = await import(`./commands/${cmdName}.js?update=${Date.now()}`);
      await command.default(sock, m, {args, text, from, config, prefix: config.botPrefix});
    }catch(e){ console.log(`Cmd ${cmdName} error:`, e.message); }
  } else if(cmdName==="menu" || cmdName==="help" || cmdName==="bony"){
    // BUILT-IN MENU
    let menu = `*🤖 BONY XMD - ROBOT MODE*\n\n`;
    menu+= `╭─「 OWNER 」\n`;
    menu+= `│• ${config.botPrefix}alive - Bot alive?\n`;
    menu+= `│• ${config.botPrefix}ping - Speed\n`;
    menu+= `│• ${config.botPrefix}owner - Owner\n`;
    menu+= `│• ${config.botPrefix}pair - Get session\n`;
    menu+= `╰─\n\n`;
    menu+= `╭─「 DOWNLOAD 」\n`;
    menu+= `│• ${config.botPrefix}play <song>\n`;
    menu+= `│• ${config.botPrefix}song <name>\n`;
    menu+= `│• ${config.botPrefix}ytmp3 <link>\n`;
    menu+= `│• ${config.botPrefix}ytmp4 <link>\n`;
    menu+= `│• ${config.botPrefix}tiktok <link>\n`;
    menu+= `╰─\n\n`;
    menu+= `╭─「 GROUP 」\n`;
    menu+= `│• ${config.botPrefix}tagall\n`;
    menu+= `│• ${config.botPrefix}kick @\n`;
    menu+= `│• ${config.botPrefix}promote @\n`;
    menu+= `╰─\n\n`;
    menu+= `*Pair Site:* ${config.pairSite}\n*Owner:* ${config.ownerName}\n${config.footer}`;
    await sock.sendMessage(from, {image: {url: config.menuImage}, caption: menu}, {quoted: m});
  }
});
