// BONY XMD - Powered by bonyxmd.co.ke
// Official BONY KE Command Handler - Deobfuscated & Clean

var tabCmds = [];
let cm = [];

function bonyke(options, func) {
  let cmd = options;
  if (!cmd.categorie) cmd.categorie = "general";
  if (!cmd.reaction) cmd.reaction = "✅";
  cmd.function = func;
  cm.push(cmd);
  return cmd;
}

const __integrityToken = "BONYKE_BONYXMD_INTEGRITY_v1_bonyxmd.co.ke";

module.exports = {
  bonyke: bonyke,
  bonyxmd: bonyke,
  blazetz: bonyke, // backward compatibility - plugins za zamani zitaendelea kuwaka
  Module: bonyke,
  cm: cm,
  tabCmds: tabCmds,
  __integrityToken: __integrityToken
};
// Powered by BONY KE | https://bonyxmd.co.ke
