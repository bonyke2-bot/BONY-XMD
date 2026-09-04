// BONY XMD - Powered by bonyxmd.co.ke
// BONY KE Official Context Handler

module.exports = {
  
  getContextInfo: (ms) => {
    return {
      mentionedJid: [ms.sender || ms.from], 
      forwardingScore: 999,
      isForwarded: true, 
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363416268312345@newsletter', // Weka JID yako ya channel ya BONY
        newsletterName: 'BONY KE TECH', 
        serverMessageId: 143 
      }
    };
  },

  repondre: async (client, dest, ms, text, options = {}) => {
    const contextInfo = {
      ...module.exports.getContextInfo(ms), 
      ...options.contextInfo 
    };

    await client.sendMessage(dest, {
      text: text,
      contextInfo: contextInfo
    }); 
  },

  sendMessage: async (client, dest, ms, options) => {
    const contextInfo = {
      ...module.exports.getContextInfo(ms), 
      ...options.contextInfo 
    };

    await client.sendMessage(dest, {
      ...options,
      contextInfo: contextInfo
    }); 
  }
};
// Powered by BONY KE | https://bonyxmd.co.ke
