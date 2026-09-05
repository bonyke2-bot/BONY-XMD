// BONY-XMD | Bonyke 254748339103 | bonyxmd.co.ke
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

const __integrityToken = "BONYKE_BONYXMD_INTEGRITY_v1";

module.exports = {
  bonyke: bonyke,
  bonyxmd: bonyke,
  blazetz: bonyke, // backward compat
  Module: bonyke,
  bonytz: bonyke, // keep legacy name so old plugins still work
  cm: cm,
  tabCmds: tabCmds,
  __integrityToken: __integrityToken
};
// Powered by BONY KE | https://bonyxmd.co.ke | 254748339103
