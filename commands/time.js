module.exports = async (sock, m) => {

const time = new Date().toLocaleTimeString()

await sock.sendMessage(
m.key.remoteJid,
{ text: "⏰ Time: " + time },
{ quoted: m }
)

}
