#!/usr/bin/env node
/**
 * Predeploy guard for the email senders.
 *
 * WHY THIS EXISTS
 * scheduleOnboardingDrip and sendLeadMagnetWelcome are both written to be
 * deploy-safe: if RESEND_API_KEY is absent they log a warning and no-op. That
 * is the right runtime behaviour — a missing key should never crash a trigger.
 *
 * But it meant the onboarding drip deployed, ran on every signup, and sent
 * nothing at all for weeks. Nobody reads Cloud Logging, so the warning was
 * invisible. Confirmed 2026-08-06 from logs dated 2026-08-03 and 2026-08-05.
 *
 * A second runtime warning would have failed the same way. So this check runs
 * at DEPLOY time, where a human is watching, and stops the deploy rather than
 * letting a dead mail system ship quietly again.
 *
 * Bypass (deliberately one line, printed in the failure message):
 *   ALLOW_MISSING_RESEND=1 npx firebase deploy --only functions
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = join(HERE, "..", ".env");

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function readEnvNames() {
  if (!existsSync(ENV_FILE)) return {};
  const out = {};
  for (const raw of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    // Value is only ever tested for emptiness — never printed, never logged.
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const env = readEnvNames();
const key = process.env.RESEND_API_KEY || env.RESEND_API_KEY || "";
const from = process.env.RESEND_FROM || env.RESEND_FROM || "";

const problems = [];
if (!key) problems.push("RESEND_API_KEY is missing or empty");
if (!from) problems.push("RESEND_FROM is missing or empty");

if (problems.length === 0) {
  console.log("email config OK — RESEND_API_KEY and RESEND_FROM are both set.");
  // Cheap sanity note; not a hard failure because we can't verify domains here.
  const m = from.match(/<([^>]+)>/);
  const addr = m ? m[1] : from;
  console.log(
    `           sending as ${addr} — this domain must be verified in Resend or every send 4xx's.`,
  );
  process.exit(0);
}

if (process.env.ALLOW_MISSING_RESEND === "1") {
  console.warn(
    `${YELLOW}${BOLD}!  email config incomplete, continuing because ALLOW_MISSING_RESEND=1${RESET}`,
  );
  for (const p of problems) console.warn(`${YELLOW}   - ${p}${RESET}`);
  console.warn(
    `${YELLOW}   Email-sending functions will deploy and send NOTHING.${RESET}`,
  );
  process.exit(0);
}

console.error("");
console.error(`${RED}${BOLD}  DEPLOY STOPPED — email is not configured${RESET}`);
console.error("");
for (const p of problems) console.error(`${RED}   - ${p}${RESET}`);
console.error("");
console.error("  scheduleOnboardingDrip and sendLeadMagnetWelcome will deploy");
console.error("  successfully, run on every trigger, and send zero emails.");
console.error("  That already happened once — the drip was silent for weeks.");
console.error("");
console.error(`${BOLD}  Fix:${RESET} set both in functions/.env`);
console.error("     RESEND_API_KEY=re_...");
console.error("     RESEND_FROM=Dave at CipherExam <dave@cipherexam.com>");
console.error("");
console.error(`${BOLD}  Or bypass deliberately:${RESET}`);
console.error("     ALLOW_MISSING_RESEND=1 npx firebase deploy --only functions");
console.error("");
process.exit(1);
