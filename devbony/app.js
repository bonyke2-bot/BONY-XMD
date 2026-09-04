"use strict";
// BONY XMD - Powered by bonyxmd.co.ke
// BONY KE Official - React Function

Object.defineProperty(exports, "__esModule", { value: true });
exports.reagir = void 0;

async function reagir(dest, zok, msg, emoji) {
    try {
        await zok.sendMessage(dest, { react: { text: emoji, key: msg.key } });
    } catch (e) {
        console.log("BONY-XMD React Error:", e.message);
    }
}

exports.reagir = reagir;
// Powered by BONY KE | bonyxmd.co.ke
