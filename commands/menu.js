const fs = require("fs");
const path = require("path");
const os = require("os");
const { getMenuImage } = require("../lib/botConfig");

async function menuCommand(sock, chatId, message) {
    try {
        const pushname = message.pushName || "User";

        const menuText = `╭━━  BONY-XMD ⚡━━⬣
┃ 👤 User: ${pushname}
┃ 🤖 Bot: BONY-XMD
┃ ⏰ Time: ${new Date().toLocaleTimeString()}
┃ 📅 Date: ${new Date().toLocaleDateString()}
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 ⚡ MAIN 〕━━⬣
┃ .alive .ping .owner .menu .repo .help
┃ .botinfo .runtime .uptime .time .date
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 📥 DOWNLOADER 〕━━⬣
┃ .play .song .video .ytplay .ytv .ytaudio
┃ .ytvideo .ytdocplay .ytdocvideo .spotify
┃ .instagram .facebook .tiktok .xvideo
┃ .mediafire .mf .apk .gitclone .lyrics
┃ .whatsong .pinterest .terabox
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 👥 GROUP ADMIN 〕━━⬣
┃ .promote .demote .kick .mute .unmute .ban .unban
┃ .warn .warnings .add .approve .join .killall
┃ .antilink .antibadword .antitag .antisticker
┃ .antidemote .antiimage .antimention .antipromote
┃ .welcome .goodbye .setgroupdesc .setgname .setgpp
┃ .open .close .resetlink .link .revoke
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 🛠 GROUP TOOLS 〕━━⬣
┃ .tagall .tag .hidetag .tagnoadmin .tagnotadmin
┃ .mention .groupinfo .infogroup .admins .listadmin
┃ .listonline .topmembers .leave .pair .chatbot
┃ .clear .delete .getpp .lastseen .drop
┃ .getgcprofile .getgcname .staff .creategroup
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 🎨 STICKER 〕━━⬣
┃ .sticker .stickercrop .tgsticker .take .attp
┃ .emojimix .meme .smeme .blur .removebg .nobg
┃ .crop .simage .toimage
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 🎮 GAMES 〕━━⬣
┃ .tictactoe .connect4 .hangman .trivia .answer
┃ .truth .dare .8ball .cf .scramble .bet
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 ❤️ FUN & SOCIAL 〕━━⬣
┃ .compliment .insult .flirt .shayari .goodnight .gn
┃ .roseday .lovenight .character .rate .ship .simp
┃ .wasted .stupid .joke .quote .fact .oogway .pies .say
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 🌸 ANIME 〕━━⬣
┃ .neko .waifu .loli .nom .poke .cry .kiss .pat
┃ .hug .wink .facepalm .anime .animu
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 📊 STATUS 〕━━⬣
┃ .tostatus .savestatus .togroupstatus
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 🔎 SEARCH & TOOLS 〕━━⬣
┃ .yts .ytsearch .img .image .movie .shazam
┃ .fetch .ss .trt .transcribe .translate
┃ .locate .location .url .tourl .vcf
┃ .vv .vv2 .block .unblock .allblocklist
┃ .enc .viewonce .weather .news .inspect
┃ .chanelid .gif
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 👑 OWNER 〕━━⬣
┃ .mode .autostatus .antidelete .autoread .autotyping
┃ .autoreact .areact .autoreaction .autofont
┃ .autorecording .autoboth .pmblocker .setpp .setbio
┃ .clearsession .cleartmp .sudo .setprefix .setowner
┃ .setbotname .setmenu .restart .menuimage .configimage
┃ .settings .update .paircode .anticall .antibot .antiedit
┃ .antistatusmention .alwaysonline .online .disp
┃ .readreciepts .settimezone
╰━━━━━━━━━━━━━━━━⬣

╭━━〔 🐙 GITHUB 〕━━⬣
┃ .git .github .sc .script .repo .clone
╰━━━━━━━━━━━━━━━━⬣

> © Powered by BONY KE
`;

        const imagePath = getMenuImage();

        if (imagePath && /^https?:\/\//i.test(imagePath)) {
            await sock.sendMessage(
                chatId,
                {
                    image: { url: imagePath },
                    caption: menuText
                },
                {
                    quoted: message
                }
            );
        } else if (imagePath && fs.existsSync(imagePath)) {
            await sock.sendMessage(
                chatId,
                {
                    image: fs.readFileSync(imagePath),
                    caption: menuText
                },
                {}
            );
        } else {
            await sock.sendMessage(
                chatId,
                {
                    text: menuText
                },
                {
                    quoted: message
                }
            );
        }

    } catch (err) {
        console.log(err);
        await sock.sendMessage(chatId, {
            text: "❌ Error displaying menu."
        });
    }
}

module.exports = menuCommand;
