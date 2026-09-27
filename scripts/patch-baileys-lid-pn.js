const fs = require('fs')
const path = require('path')

const file = path.join(
  __dirname,
  '..',
  'node_modules',
  '@whiskeysockets',
  'baileys',
  'lib',
  'Utils',
  'decode-wa-message.js'
)

if (!fs.existsSync(file)) {
  throw new Error('[Baileys patch] decode-wa-message.js not found')
}

const s = fs.readFileSync(file, 'utf8')

if (s.includes('primary identity failed to decrypt')) {
  console.log('[Baileys patch] LID/PN fallback already present')
  process.exit(0)
}

const old = `                            case 'pkmsg':
                            case 'msg':
                                const user = isJidUser(sender) ? sender : author;
                                msgBuffer = await repository.decryptMessage({
                                    jid: user,
                                    type: e2eType,
                                    ciphertext: content
                                });
                                break;`

const replacement = `                            case 'pkmsg':
                            case 'msg': {
                                const user = isJidUser(sender) ? sender : author;
                                try {
                                    msgBuffer = await repository.decryptMessage({
                                        jid: user,
                                        type: e2eType,
                                        ciphertext: content
                                    });
                                }
                                catch (err) {
                                    const altUser = isLidUser(user)
                                        ? stanza.attrs.participant_pn || stanza.attrs.sender_pn
                                        : stanza.attrs.participant_lid || stanza.attrs.sender_lid;
                                    if (!altUser || altUser === user) {
                                        throw err;
                                    }
                                    logger.debug({
                                        key: fullMessage.key,
                                        primary: user,
                                        retryWith: altUser
                                    }, 'primary identity failed to decrypt, retrying with stanza-provided PN/LID pairing');
                                    try {
                                        msgBuffer = await repository.decryptMessage({
                                            jid: altUser,
                                            type: e2eType,
                                            ciphertext: content
                                        });
                                    }
                                    catch {
                                        throw err;
                                    }
                                }
                                break;
                            }`

if (!s.includes(old)) {
  throw new Error('[Baileys patch] Expected 6.7.24 block not found; no changes made')
}

fs.writeFileSync(file, s.replace(old, replacement))
console.log('[Baileys patch] Applied LID/PN decrypt fallback')
