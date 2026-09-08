module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;
    const inputArg = args ? args.join(" ") : "";
    
    let targetNewsletter = "";

    try {
        // If the user provides a WhatsApp channel link
        if (inputArg.includes("whatsapp.com/channel/")) {
            let inviteCode = inputArg.split("channel/")[1]?.trim();
            if (inviteCode) {
                // Fetch the channel metadata from WhatsApp to get its true JID
                let metadata = await sock.newsletterMetadata("invite", inviteCode);
                if (metadata && metadata.id) {
                    targetNewsletter = metadata.id;
                }
            }
        }

        // If not found via the link, use the input text or a default error message
        if (!targetNewsletter) {
            targetNewsletter = inputArg.trim() || "Invalid link or JID not found";
        }

        const responseText = `╭━━━〔 *NEWSLETTER JID* 〕━━━⬣
┃ 📢 *Channel JID:* 
┃ ${targetNewsletter}
┃ 🤖 *Bot:* BONY-XMD 
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

        await sock.sendMessage(chatJid, { 
            text: responseText 
        }, { quoted: m });

    } catch (e) {
        console.error("Error fetching newsletter JID:", e);
        await sock.sendMessage(chatJid, { text: "❌ Error: Could not fetch the JID for this channel." }, { quoted: m });
    }
};
