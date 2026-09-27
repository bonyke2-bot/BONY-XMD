const fs = require('fs')
const path = require('path')

const file = path.join(
    __dirname,
    '..',
    'node_modules',
    '@whiskeysockets',
    'baileys',
    'lib',
    'Socket',
    'messages-send.js'
)

if (!fs.existsSync(file)) {
    throw new Error('[Baileys self-send patch] messages-send.js not found')
}

const s = fs.readFileSync(file, 'utf8')

if (s.includes('const selfPnJid = `${authState.creds.me.id.split')) {
    console.log('[Baileys self-send patch] Already present')
    process.exit(0)
}

const old = '            const userJid = authState.creds.me.id;'
const replacement = `            const userJid = authState.creds.me.id;
            const selfPnJid = \`\${authState.creds.me.id.split(':')[0]}@s.whatsapp.net\`;
            const selfLidJid = authState.creds.me.lid
                ? \`\${authState.creds.me.lid.split(':')[0]}@lid\`
                : null;
            if (selfLidJid && jid === selfPnJid) {
                jid = selfLidJid;
            }`

if (!s.includes(old)) {
    throw new Error('[Baileys self-send patch] Expected 6.7.24 block not found; no changes made')
}

fs.writeFileSync(file, s.replace(old, replacement, 1))
console.log('[Baileys self-send patch] Applied')
