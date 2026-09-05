const fs = require('fs-extra');
const path = require('path');
const http = require('http');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const config = require('./set');

// Load BONY-XMD banner
console.log('\n');
console.log('🔥🔥🔥 B O N Y - X M D 🔥🔥🔥');
console.log('Powered by Bonyke');
console.log(`Bot: ${config.BOT} | Prefix: ${config.PREFIXE} | Mode: ${config.MODE}`);
console.log('\n');

// Optional: Serve deploy.html on port 3000 (for hosting)
try {
  const htmlPath = path.join(__dirname, 'deploy.html');
  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlContent);
    });
    server.listen(process.env.PORT || 3000, () => {
      console.log(`[BONY-XMD] Web server running on port ${process.env.PORT || 3000}`);
    });
  }
} catch {}

async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            printQRInTerminal: true,
            browser: Browsers.macOS('Desktop'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => { return undefined; }
        });

        // Load commands
        sock.commands = new Map();
        const cmdPath = path.join(__dirname, 'commandes');
        if (fs.existsSync(cmdPath)) {
            const files = fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'));
            for (const file of files) {
                try {
                    const cmd = require(path.join(cmdPath, file));
                    if (cmd.name) {
                        sock.commands.set(cmd.name.toLowerCase(), cmd);
                        if (cmd.alias) {
                            cmd.alias.forEach(a => sock.commands.set(a.toLowerCase(), cmd));
                        }
                    }
                } catch (e) {
                    console.log(`[BONY-XMD] Failed to load ${file}:`, e.message);
                }
            }
            console.log(`[BONY-XMD] Loaded ${sock.commands.size} commands`);
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output
