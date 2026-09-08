const settings = require("../settings.js");
module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');

    const channelInfo = {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '0029Vb8coEnKAwEcRBDDnq0Z@newsletter',
                newsletterName: 'BONY XMD',
                serverMessageId: -1
            }
        }
    };

    if (!isGroup) {
        return await sock.sendMessage(from, { text: "❌ *This command can only be used in groups!*", ...channelInfo }, { quoted: m });
    }

    try {
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Get admin list
        const admins = participants.filter(p => p.admin !== null).map(p => p.id);
        const isSenderAdmin = admins.includes(sender);
        const isOwner = m.key.fromMe || sender.includes(settings.ownerNumber.replace(/[^0-9]/g, "")); // Your number or if sent by you

        // If not admin and not owner
        if (!isSenderAdmin && !isOwner) {
            return await sock.sendMessage(from, { text: "❌ *Access Denied:* Only group admins can use this command.", ...channelInfo }, { quoted: m });
        }

        // Filter out all non-admins and the bot itself
        const membersToKick = participants
            .filter(p => p.admin === null && p.id !== botId)
            .map(p => p.id);

        if (membersToKick.length === 0) {
            return await sock.sendMessage(from, { text: "⚠️ *No regular members to kick in this group!*", ...channelInfo }, { quoted: m });
        }

        await sock.sendMessage(from, { text: `⚠️ *KickAll initiated:* Removing ${membersToKick.length} members from the group...`, ...channelInfo }, { quoted: m });

        // Remove members from the group
        await sock.groupParticipantsUpdate(from, membersToKick, "remove");

        await sock.sendMessage(from, { text: `✅ *Successfully kicked all non-admin members!*`, ...channelInfo }, { quoted: m });

    } catch (e) {
        console.error("KickAll Error:", e);
        await sock.sendMessage(from, { text: "❌ *Failed to execute kickall command. Make sure the bot is an admin in the group.*", ...channelInfo }, { quoted: m });
    }
};
