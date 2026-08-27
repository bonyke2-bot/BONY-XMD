module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;

    // 1. Tcheke si se nan yon gwoup
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ Kòmand sa fèt pou gwoup sèlman!" }, { quoted: m });
    }

    try {
        // 2. Jwenn enfòmasyon gwoup la ak tout moun ki ladan l
        const groupMetadata = await sock.groupMetadata(chatJid);
        const participants = groupMetadata.participants;
        
        // 3. Pran mesaj itilizatè a ekri apre .hidetag la
        const messageText = args.join(" ") || "📢 Atansyon tout moun!";

        // 4. Voye mesaj la ak yon "mention" envizib pou tout moun
        await sock.sendMessage(chatJid, { 
            text: messageText, 
            mentions: participants.map(a => a.id) 
        });

    } catch (err) {
        console.error("Erè nan hidetag:", err);
        await sock.sendMessage(chatJid, { text: "⚠️ Mwen pa ka jwenn lis moun yo. Asire m se Admin mwen ye!" }, { quoted: m });
    }
}
