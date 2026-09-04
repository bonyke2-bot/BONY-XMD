"use strict";
/**
 * database/db.js
 *
 * Unified storage for BONY XMD, ported from BONY-XMD's database/config.js
 * Backend selection:
 * - If process.env.DATABASE_URL is set, tries PostgreSQL first.
 * - Otherwise falls back to a single JSON file (./bony-data.json)
 * - bonyxmd.co.ke
 */
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

// ---------------------------------------------------------------------
// JSON fallback backend
// ---------------------------------------------------------------------
const _jsonDefaults = () => ({
    settings: {},
    group_settings: {},
    sudo_users: [],
    banned_users: [],
    warn_data: {},
    lid_mapping: {},
});

let _jsonData = null;
let _jsonSaveTimer = null;
const _jsonPath = path.resolve(__dirname, '../bony-data.json');

function _jsonFlush() {
    try { fs.writeFileSync(_jsonPath, JSON.stringify(_jsonData, null, 2)); } catch {}
}

function _jsonSave() {
    if (_jsonSaveTimer) clearTimeout(_jsonSaveTimer);
    _jsonSaveTimer = setTimeout(_jsonFlush, 400);
}

function initJson() {
    try {
        if (fs.existsSync(_jsonPath)) {
            const raw = fs.readFileSync(_jsonPath, 'utf-8');
            _jsonData = Object.assign(_jsonDefaults(), JSON.parse(raw));
        } else {
            _jsonData = _jsonDefaults();
        }
        _backend = 'json';
        console.log('✅ [BONY XMD DB] Using JSON file database (bony-data.json) | bonyxmd.co.ke');
    } catch (e) {
        console.log('⚠️ [BONY XMD DB] JSON init failed:', e.message);
        throw e;
    }
}

const _GS_DEFAULTS = {
    jid: '',
    antidelete: 1,
    events: 0,
    antidemote: 'off',
    antipromote: 'off',
    antilink: 'off',
    antilink_action: 'delete',
    welcome: 'off',
    goodbye: 'off',
    warn_limit: 3,
    custom_welcome: '',
    custom_goodbye: '',
    antisticker: 'off',
    antispam: 'off',
    antibot: 'off',
    antibot_action: 'remove',
};

function _getGroupRowJson(jid) {
    if (!_jsonData.group_settings[jid]) {
        _jsonData.group_settings[jid] = {..._GS_DEFAULTS, jid };
    }
    return _jsonData.group_settings[jid];
}

// ---------------------------------------------------------------------
// PostgreSQL backend
// ---------------------------------------------------------------------
let _backend = null;
let _pg = null;
let _ready = null;

const PG_SCHEMA = [
    `CREATE TABLE IF NOT EXISTS lid_mapping (lid TEXT PRIMARY KEY, phone TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS group_settings (
        jid TEXT PRIMARY KEY, antidelete INTEGER DEFAULT 1,
        events INTEGER DEFAULT 0, antidemote TEXT DEFAULT 'off', antipromote TEXT DEFAULT 'off',
        antilink TEXT DEFAULT 'off', antilink_action TEXT DEFAULT 'delete',
        welcome TEXT DEFAULT 'off', goodbye TEXT DEFAULT 'off', warn_limit INTEGER DEFAULT 3,
        custom_welcome TEXT DEFAULT '', custom_goodbye TEXT DEFAULT '',
        antisticker TEXT DEFAULT 'off',
        antispam TEXT DEFAULT 'off', antibot TEXT DEFAULT 'off', antibot_action TEXT DEFAULT 'remove'
    )`,
    `CREATE TABLE IF NOT EXISTS sudo_users (num TEXT PRIMARY KEY)`,
    `CREATE TABLE IF NOT EXISTS banned_users (num TEXT PRIMARY KEY)`,
    `CREATE TABLE IF NOT EXISTS warn_data (jid TEXT NOT NULL, "user" TEXT NOT NULL, warns INTEGER DEFAULT 0, PRIMARY KEY (jid, "user"))`,
];

async function tryInitPg() {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 300000,
            max: 5,
            min: 1,
            allowExitOnIdle: false,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
        });
        pool.on('error', (err) => { console.log('⚠️ [PG POOL ERROR]:', err.message); });
        await Promise.race([
            pool.query('SELECT 1'),
            new Promise((_, rej) => setTimeout(() => rej(new Error('PG connect timeout')), 20000)),
        ]);
        for (const sql of PG_SCHEMA) { try { await pool.query(sql); } catch {} }
        setInterval(() => { pool.query('SELECT 1').catch(() => {}); }, 3 * 60 * 1000);
        _pg = pool;
        _backend = 'pg';
        console.log('✅ [BONY XMD DB] Using PostgreSQL | bonyxmd.co.ke');
        return true;
    } catch (e) {
        console.log(`⚠️ [BONY XMD DB] PostgreSQL unavailable (${e.message}) — using fallback`);
        return false;
    }
}

_ready = (async () => {
    if (process.env.DATABASE_URL) {
        const ok = await tryInitPg();
        if (!ok) {
            try { initJson(); } catch (e) { console.log('⚠️ [BONY XMD DB] JSON fallback also failed:', e.message); }
        }
    } else {
        try { initJson(); } catch (e) { console.log('⚠️ [BONY XMD DB] JSON init failed:', e.message); }
    }
})();

async function ensureReady() { await _ready; }
function getBackend() { return _backend; }

async function getGroupSettings(jid) {
    await ensureReady();
    if (_backend === 'pg') {
        const row = await _pg.query('SELECT * FROM group_settings WHERE jid = $1', [jid]);
        if (row.rows[0]) return row.rows[0];
        await _pg.query('INSERT INTO group_settings (jid) VALUES ($1) ON CONFLICT DO NOTHING', [jid]);
        const row2 = await _pg.query('SELECT * FROM group_settings WHERE jid = $1', [jid]);
        return row2.rows[0] || {..._GS_DEFAULTS, jid };
    }
    return {..._getGroupRowJson(jid) };
}

async function updateGroupSetting(jid, field, value) {
    await ensureReady();
    if (!(field in _GS_DEFAULTS)) throw new Error(`Unknown group setting field: ${field}`);
    if (_backend === 'pg') {
        await _pg.query(
            `INSERT INTO group_settings (jid, ${field}) VALUES ($1, $2)
             ON CONFLICT (jid) DO UPDATE SET ${field} = $2`,
            [jid, value]
        );
        return;
    }
    const row = _getGroupRowJson(jid);
    row[field] = value;
    _jsonSave();
}

async function getSudoUsers() {
    await ensureReady();
    if (_backend === 'pg') {
        const rows = await _pg.query('SELECT num FROM sudo_users');
        return rows.rows.map((r) => r.num);
    }
    return [..._jsonData.sudo_users];
}

async function addSudoUser(num) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query('INSERT INTO sudo_users (num) VALUES ($1) ON CONFLICT DO NOTHING', [num]);
        return;
    }
    if (!_jsonData.sudo_users.includes(num)) _jsonData.sudo_users.push(num);
    _jsonSave();
}

async function removeSudoUser(num) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query('DELETE FROM sudo_users WHERE num = $1', [num]);
        return;
    }
    _jsonData.sudo_users = _jsonData.sudo_users.filter((n) => n!== num);
    _jsonSave();
}

async function getBannedUsers() {
    await ensureReady();
    if (_backend === 'pg') {
        const rows = await _pg.query('SELECT num FROM banned_users');
        return rows.rows.map((r) => r.num);
    }
    return [..._jsonData.banned_users];
}

async function banUser(num) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query('INSERT INTO banned_users (num) VALUES ($1) ON CONFLICT DO NOTHING', [num]);
        return;
    }
    if (!_jsonData.banned_users.includes(num)) _jsonData.banned_users.push(num);
    _jsonSave();
}

async function unbanUser(num) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query('DELETE FROM banned_users WHERE num = $1', [num]);
        return;
    }
    _jsonData.banned_users = _jsonData.banned_users.filter((n) => n!== num);
    _jsonSave();
}

async function getWarnCount(jid, user) {
    await ensureReady();
    if (_backend === 'pg') {
        const row = await _pg.query('SELECT warns FROM warn_data WHERE jid = $1 AND "user" = $2', [jid, user]);
        return row.rows[0]?.warns || 0;
    }
    return _jsonData.warn_data[jid]?.[user] || 0;
}

async function addWarn(jid, user) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query(
            `INSERT INTO warn_data (jid, "user", warns) VALUES ($1, $2, 1)
             ON CONFLICT (jid, "user") DO UPDATE SET warns = warn_data.warns + 1
             RETURNING warns`,
            [jid, user]
        );
        const row = await _pg.query('SELECT warns FROM warn_data WHERE jid = $1 AND "user" = $2', [jid, user]);
        return row.rows[0]?.warns || 1;
    }
    _jsonData.warn_data[jid] = _jsonData.warn_data[jid] || {};
    _jsonData.warn_data[jid][user] = (_jsonData.warn_data[jid][user] || 0) + 1;
    _jsonSave();
    return _jsonData.warn_data[jid][user];
}

async function resetWarn(jid, user) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query('DELETE FROM warn_data WHERE jid = $1 AND "user" = $2', [jid, user]);
        return;
    }
    if (_jsonData.warn_data[jid]) delete _jsonData.warn_data[jid][user];
    _jsonSave();
}

async function setWarnLimit(jid, limit) {
    return updateGroupSetting(jid, 'warn_limit', limit);
}

async function getWarnLimit(jid) {
    const settings = await getGroupSettings(jid);
    return settings.warn_limit?? 3;
}

async function getSettings() {
    await ensureReady();
    if (_backend === 'pg') {
        const rows = await _pg.query('SELECT key, value FROM settings');
        const out = {};
        for (const row of rows.rows) out[row.key] = row.value;
        return out;
    }
    return {..._jsonData.settings };
}

async function updateSetting(key, value) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query(
            `INSERT INTO settings (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2`,
            [key, String(value)]
        );
        return;
    }
    _jsonData.settings[key] = String(value);
    _jsonSave();
}

async function mapLidToPhone(lid, phone) {
    await ensureReady();
    if (_backend === 'pg') {
        await _pg.query(
            `INSERT INTO lid_mapping (lid, phone) VALUES ($1, $2)
             ON CONFLICT (lid) DO UPDATE SET phone = $2`,
            [lid, phone]
        );
        return;
    }
    _jsonData.lid_mapping[lid] = phone;
    _jsonSave();
}

async function getPhoneFromLid(lid) {
    await ensureReady();
    if (_backend === 'pg') {
        const row = await _pg.query('SELECT phone FROM lid_mapping WHERE lid = $1', [lid]);
        return row.rows[0]?.phone || null;
    }
    return _jsonData.lid_mapping[lid] || null;
}

module.exports = {
    getBackend,
    getGroupSettings,
    updateGroupSetting,
    getSudoUsers,
    addSudoUser,
    removeSudoUser,
    getBannedUsers,
    banUser,
    unbanUser,
    getWarnCount,
    addWarn,
    resetWarn,
    setWarnLimit,
    getWarnLimit,
    ensureReady,
    getSettings,
    updateSetting,
    mapLidToPhone,
    getPhoneFromLid,
};
