import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore, DisconnectReason, delay } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import config from "./config.js";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

if(!fs.existsSync("./auth")) fs.mkdirSync("./auth",{recursive:true});
if(process.env.SESSION_ID){
  try{
    let b64 = process.env.SESSION_ID.trim();
    if(b64.includes("BONY-BOT~")) b64 = b64.split("BONY-BOT~")[1];
    else if(b64.includes("WOLF-BOT~")) b64 = b64.split("WOLF-BOT~")[1];
    else if(b64.includes("~")) b64 = b64.split("~").pop();
    fs.writeFileSync("./auth/creds.json", Buffer.from(b64,'base64'));
    console.log("✅ BONY-BOT Session OK");
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
  if(connection==="open"){
    console.log("🤖 BONY XMD ONLINE");
    try{ await sock.sendMessage(config.ownerNumber[0]+"@s.whatsapp.net", {text: `*🤖 ${config.botName} CONNECTED!*\n\nType.menu`}); }catch{}
  }
  if(connection==="close"){
    const c = lastDisconnect?.error?.output?.statusCode;
    if(c!== DisconnectReason.loggedOut) process.exit(0);
  }
});

sock.ev.on("messages.upsert", async ({messages})=>{
  const m = messages[0];
  if(!m.message || m.key.fromMe) return;
  const from = m.key.remoteJid;
  const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";
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
