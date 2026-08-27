module.exports = async (sock, m) => {

const info = `
🤖 BOT INFO

Name: QUEEN COLAMBIA BOT
Version: 1.0
Library: Baileys
`

await sock.sendMessage(
m.key.remoteJid,
{ text: info },
{ quoted: m }
)

}
