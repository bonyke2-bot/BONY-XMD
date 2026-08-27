module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const settings = require("../settings");
    
    // Tcheke si se Owner la k ap fè kòmand lan
    const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;
    if (!isOwner) return sock.sendMessage(from, { text: "❌ This command is for the bot owner only." });

    const statusText = args.join(" ");
    if (!statusText) return sock.sendMessage(from, { text: "❌ Please provide a message.\nExample: .gstatut Hello everyone!" });

    try {
        const getGroups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(getGroups);

        await sock.sendMessage(from, { text: `🚀 Sending status update to ${groupIds.length} groups...` });

        for (let id of groupIds) {
            try {
                await sock.sendMessage(id, { 
                    text: statusText,
                    contextInfo: {
                        externalAdReply: {
                            title: "👑 QUEEN COLAMBIA UPDATE",
                            body: "Group Status Broadcast",
                            thumbnailUrl: "https://files.catbox.moe/zdk50s.jpg",
                            sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
                // Poz 2 segonn pou sekirite
                await new Promise(res => setTimeout(res, 2000));
            } catch (err) {
                console.log(`Failed to send to: ${id}`);
            }
        }
        await sock.sendMessage(from, { text: "✅ Broadcast completed successfully!" });

    } catch (e) {
        console.error(e);
        await sock.sendMessage(from, { text: "❌ An error occurred while fetching groups." });
    }
};
