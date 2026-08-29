export default async (sock, m, {from, config})=>{
  await sock.sendMessage(from, {text: `*🔗 GET BONY-BOT SESSION*\n\nOpen: ${config.pairSite}\n\n1. Enter number 2547...\n2. Get code\n3. Link in WhatsApp\n4. You get BONY-BOT~...`}, {quoted: m});
}
