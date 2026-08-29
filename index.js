console.log("BONY-XMD starting...");

async function startBot() {
  console.log("BONY-XMD is ready to be configured.");
}

startBot().catch((error) => {
  console.error("Bot startup error:", error);
  process.exit(1);
});
