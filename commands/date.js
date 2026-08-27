module.exports = async (sock, m) => {

const date = new Date().toDateString()

await sock.sendMessage(
m.key.remoteJid,
{ text: "📅 Date: " + date },
{ quoted: m }
)

}
