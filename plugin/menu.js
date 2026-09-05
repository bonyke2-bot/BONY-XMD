const { zmd } = require("../framework/zmd");

zmd({ nomCom: "menu", categorie: "General" }, async (dest, zk, commandeOptions) => {
  const { ms, repondre } = commandeOptions;
  await repondre(`*BONY-XMD Menu*\n\nBot is working!\nOwner: Bonyke`);
});
