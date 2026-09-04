"use strict";
/**
 * integrityGuard.js
 *
 * Verifies at startup that devbony/bonytz.js (the core command registry
 * every plugin depends on via require("../../devbony/bonytz")) is present,
 * unmodified in the ways that matter, and still referenced correctly
 * throughout the codebase. If someone renames the "devbony" folder,
 * renames "bonytz.js", or edits enough require() paths / references to
 * break the wiring, the bot refuses to start with a clear message
 * instead of failing later with confusing "module not found" errors
 * scattered across dozens of plugin files.
 *
 * This runs TWO checks:
 *
 * 1. STRUCTURAL — devbony/bonytz.js must exist at its exact path and
 * export { bonytz: function, cm: array, __integrityToken: the
 * expected watermark string }. This catches the file being
 * deleted, moved, or rewritten in a way that breaks its contract
 * (even if the watermark string is left in by accident but the
 * exports are wrong, or vice versa).
 *
 * 2. REFERENCE COUNT — scans every .js file in the project (except
 * node_modules) and counts how many still contain the literal
 * strings "devbony" and "bonytz". This catches someone doing a
 * mass find-and-replace across plugin files (renaming the
 * require() path or the destructured import name everywhere)
 * WITHOUT necessarily touching devbony/bonytz.js itself — which
 * the structural check alone wouldn't notice, since the file
 * would still be intact and correctly exporting things, just no
 * longer being called from anywhere.
 *
 * The thresholds below are set comfortably under the project's actual
 * current counts (as of when this guard was added) so ordinary future
 * development (adding/editing a handful of plugins) never trips it,
 * while a deliberate mass rename clearly would.
 */
const fs = require("fs");
const path = require("path");

const EXPECTED_TOKEN = "DEVBONY_BONYTZ_INTEGRITY_v1";
const BONYTZ_PATH = path.join(__dirname, "..", "devbony", "bonytz.js");

const MIN_FILES_REFERENCING_DEVBONY = 40;
const MIN_FILES_REFERENCING_BONYTZ = 40;
const MIN_TOTAL_OCCURRENCES_DEVBONY = 50;
// The renamed BONY-XMD tree currently contains 83 bonytz references.
// Keep the guard above the current baseline without requiring legacy bonytz naming counts.
const MIN_TOTAL_OCCURRENCES_BONYTZ = 80;

function countReferences(rootDir) {
    let filesWithDevbony = 0;
    let filesWithBonytz = 0;
    let totalDevbony = 0;
    let totalBonytz = 0;

    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name === "node_modules" || entry.name === ".git") continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith(".js")) {
                let content;
                try {
                    content = fs.readFileSync(fullPath, "utf8");
                } catch {
                    continue;
                }
                const devbonyMatches = content.match(/devbony/g);
                const bonytzMatches = content.match(/bonytz/g);
                if (devbonyMatches) {
                    filesWithDevbony++;
                    totalDevbony += devbonyMatches.length;
                }
                if (bonytzMatches) {
                    filesWithBonytz++;
                    totalBonytz += bonytzMatches.length;
                }
            }
        }
    }

    walk(rootDir);
    return { filesWithDevbony, filesWithBonytz, totalDevbony, totalBonytz };
}

/**
 * Runs both checks. On failure, prints a clear message and terminates
 * the process (process.exit(1)) — this is intentionally fatal, since a
 * bot running with a broken/tampered command registry would otherwise
 * fail in confusing, hard-to-diagnose ways command-by-command.
 */
function verifyIntegrity(projectRoot) {
    // --- Check 1: structural ---
    if (!fs.existsSync(BONYTZ_PATH)) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("devbony/bonytz.js is missing or was moved/renamed.");
        console.error("This file is the bot's core command registry — restore it at:");
        console.error("  " + BONYTZ_PATH);
        console.error("to continue.");
        process.exit(1);
    }

    let mod;
    try {
        delete require.cache[require.resolve(BONYTZ_PATH)];
        mod = require(BONYTZ_PATH);
    } catch (e) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("devbony/bonytz.js failed to load:", e.message);
        process.exit(1);
    }

    if (
        typeof mod.bonytz !== "function" ||
        !Array.isArray(mod.cm) ||
        mod.__integrityToken !== EXPECTED_TOKEN
    ) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("devbony/bonytz.js has been modified in a way that breaks its contract.");
        console.error("Restore the original devbony/bonytz.js — it must export");
        console.error('  { bonytz: function, cm: array, __integrityToken: "' + EXPECTED_TOKEN + '" }');
        console.error("to continue.");
        process.exit(1);
    }

    // --- Check 2: reference count across the whole project ---
    const { filesWithDevbony, filesWithBonytz, totalDevbony, totalBonytz } = countReferences(projectRoot);

    if (
        filesWithDevbony < MIN_FILES_REFERENCING_DEVBONY ||
        filesWithBonytz < MIN_FILES_REFERENCING_BONYTZ ||
        totalDevbony < MIN_TOTAL_OCCURRENCES_DEVBONY ||
        totalBonytz < MIN_TOTAL_OCCURRENCES_BONYTZ
    ) {
        console.error("❌ INTEGRITY CHECK FAILED");
        console.error("References to \"devbony\"/\"bonytz\" across the codebase dropped below the expected minimum —");
        console.error("this usually means something renamed how plugins require() the command registry.");
        console.error(
            `  devbony: ${filesWithDevbony} files / ${totalDevbony} occurrences (need >= ${MIN_FILES_REFERENCING_DEVBONY} files / ${MIN_TOTAL_OCCURRENCES_DEVBONY} occurrences)`
        );
        console.error(
            `  bonytz:  ${filesWithBonytz} files / ${totalBonytz} occurrences (need >= ${MIN_FILES_REFERENCING_BONYTZ} files / ${MIN_TOTAL_OCCURRENCES_BONYTZ} occurrences)`
        );
        console.error('Revert those changes back to using "devbony"/"bonytz" to continue.');
        process.exit(1);
    }

    console.log("✅ Integrity check passed (devbony/bonytz.js intact).");
}

module.exports = { verifyIntegrity };
