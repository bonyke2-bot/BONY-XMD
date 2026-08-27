
module.exports = async (sock, m) => {

    const message = `
*Hello! 👋*

I couldn't recognize that command. Please use the button or command below to see what I can do for you:

📜 *Command:* .menu
🤖 *Bot:* QUEEN COLAMBIA

_Type .menu to explore all features._
    `.trim();

    await sock.sendMessage(m.key.remoteJid, {
        text: message,
        contextInfo: {
            externalAdReply: {
                title: "QUEEN COLAMBIA HELP CENTER",
                body: "Click to see my command list",
                thumbnailUrl: "https://files.catbox.moe/3dwe96.jpg", // Foto bot ou a
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V", 
                mediaType: 1,
                renderLargerThumbnail: false // Mete l 'true' si ou vle gwo foto
            }
        }
    }, { quoted: m });

}
