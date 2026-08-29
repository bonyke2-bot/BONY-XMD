export default async (sock, m, {from})=>{
  await sock.sendMessage(from, {text: "*🤖 BONY XMD ALIVE!*\n\n✅ Online\n👑 Owner: BONY KE\n🔗 Pair: https://bony-xmd-pair.onrender.com\n\n*BONY XMD 2026*"}, {quoted: m});
}
