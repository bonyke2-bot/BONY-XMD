module.exports = async (sock, m) => {
    // 1. Tcheke si se nan yon gwoup kòmand lan fèt
    if (!m.key.remoteJid.endsWith('@g.us')) {
        return sock.sendMessage(m.key.remoteJid, { text: "Kòmand sa fèt pou gwoup sèlman!" });
    }

    try {
        // 2. Jwenn tout moun ki nan gwoup la
        const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
        const participants = groupMetadata.participants;
        
        // 3. Prepare tèks mesaj la
        let teks = `*📢 TAG ALL*\n\n`;
        let mentions = [];

        for (let mem of participants) {
            teks += `➡️ @${mem.id.split('@')[0]}\n`;
            mentions.push(mem.id); // Sa a enpòtan pou notifikasyon an rive sou telefòn yo
        }

        teks += `\n*Made with ❤️ by Queen Colambia*`;

        // 4. Voye mesaj la ak tout mentions yo
        await sock.sendMessage(
            m.key.remoteJid,
            { 
                text: teks, 
                mentions: mentions 
            },
            { quoted: m }
        );

    } catch (e) {
        console.error(e);
        await sock.sendMessage(m.key.remoteJid, { text: "Mwen pa ka jwenn lis manm yo." });
    }
}
