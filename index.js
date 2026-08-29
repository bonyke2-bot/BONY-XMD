import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import config from "./config.js";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure files
if(!fs.existsSync("./auth")) fs.mkdirSync("./auth",{recursive:true});
if(!fs.existsSync("./settings.json")) fs.writeFileSync("./settings.json", JSON.stringify({antilink:{}, welcome:{}, autostatus:false}));

if(process.env.SESSION_ID){
  try{
    let b64 = process.env.SESSION_ID.trim();
    if(b64.includes("BONY-BOT~")) b64 = b64.split("BONY-BOT~")[1];
    else if(b64.includes("WOLF-BOT~")) b64 = b64.split("WOLF-BOT~")[1];
    else if(b64.includes("~")) b64 = b64.split("~").pop();
    fs.writeFileSync("./auth/creds.json", Buffer.from(b64,'base64'));
    console.log("✅ Session OK");
  }catch(e){ console.log("Session fail:", e.message); }
}

const { state, saveCreds } = await useMultiFileAuthState("./auth");
const sock = makeWASocket({
  auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:"silent"})) },
  logger: pino({level:"silent"}),
  browser: ["BONY XMD","Chrome","110"],
  printQRInTerminal: false
});
sock.ev.on("creds.update", saveCreds);
sock.ev.on("connection.update", async (u)=>{
  const {connection, lastDisconnect} = u;
  if(connection==="open") console.log("🤖 BONY XMD ONLINE");
  if(connection==="close"){
    if(lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) process.exit(0);
  }
});

sock.ev.on("messages.upsert", async ({messages})=>{
  const m = messages[0];
  if(!m.message || m.key.fromMe) return;
  const from = m.key.remoteJid;
  const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";

  // === ANTILINK SYSTEM ===
  try{
    let db = JSON.parse(fs.readFileSync("./settings.json"));
    if(db.antilink[from] && from.endsWith("@g.us")){
      if(body.includes("https://") || body.includes("http://") || body.includes("wa.me") || body.includes("chat.whatsapp.com")){
        await sock.sendMessage(from, {delete: m.key});
        await sock.sendMessage(from, {text: `*🚫 @${m.key.participant?.split("@")[0]} Link deleted! Antilink ON*`, mentions: [m.key.participant]}, {quoted: m});
        return;
      }
    }
  }catch{}

  if(!body.startsWith(config.botPrefix)) return;
  const args = body.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const text = args.join(" ");
  const path = join(__dirname,"commands",cmd+".js");
  if(fs.existsSync(path)){
    try{
      const mod = await import(`./commands/${cmd}.js?u=${Date.now()}`);
      await mod.default(sock,m,{args,text,from,config,prefix: config.botPrefix});
    }catch(e){ console.log(e.message); }
  }
});
