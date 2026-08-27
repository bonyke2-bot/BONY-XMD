module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    const prefix = body.charAt(0) || ".";
    
    const lang = args[0]; // Example: en, fr, ht, es
    const text = args.slice(1).join(" "); // The text to translate

    if (!lang || !text) {
        return await sock.sendMessage(chatId, { 
            text: `╭━━━〔 *RIFT-MD TRANSLATOR* 〕━━━⡱\n┃ ❌ *Invalid Usage!*\n┃ 📌 *Format:* \`${prefix}translate [lang] [text]\`\n┃ 💡 *Example:* \`${prefix}translate en Bonjou\`` 
        }, { quoted: m });
    }

    try {
        // Reaction 🌎
        await sock.sendMessage(chatId, { react: { text: "🌎", key: m.key } });

        const apiUrl = `https://api.popcat.xyz/translate?to=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data || !data.translated) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ *Error:* Translation failed or unsupported language code." }, { quoted: m });
        }

        const responseText = `╭━━━〔 *TRANSLATION RESULT* 〕━━━⡱
┃ 🌐 *Target Lang:* ${lang.toUpperCase()}
┃ 📝 *Translated Text:* 
┃ 
┃ ${data.translated}
┃ 🤖 *Bot:* RIFT-MD
╰━━━━━━━━━━━━━━━━━━━━⬣`;

        await sock.sendMessage(chatId, { 
            text: responseText 
        }, { quoted: m });

        // Reaction ✅
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Translate Error:", error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Critical Error:* Translation API encountered a problem." }, { quoted: m });
    }
};
