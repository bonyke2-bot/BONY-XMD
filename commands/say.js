module.exports = async (sock, m, args) => {

if(!args[0]) return

await sock.sendMessage(
m.key.remoteJid,
{ text: args.join(" ") }
)

}
