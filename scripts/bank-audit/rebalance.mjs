// Distractors were written short and the keys long, so the correct answer was
// the longest option in 40 of 50 — beatable without knowing any security.
// These rewrites give every distractor the same specificity as the key.
import { readFileSync, writeFileSync } from 'node:fs';
const P = './seed/security-plus-replacements.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));

const R = [
["A penetration test of the vendor's production environment performed by your own red team",
 "A penetration test of the vendor's production environment by your own red team, repeated at each contract renewal"],
["A copy of the vendor's cyber insurance certificate naming your organization",
 "A copy of the vendor's cyber insurance certificate naming your organization as an additional insured party"],
["Evidence that the vendor encrypts data at rest using AES-256 specifically",
 "Evidence that the vendor encrypts data at rest using AES-256 with keys held in a hardware security module"],

["Ransomware — High likelihood, High impact, owner: IT Security, status: open",
 "Ransomware — High likelihood, High impact, owner: IT Security, status: open, review date set for next quarter"],
["Ransomware attacks have increased 40% across the insurance sector this year",
 "Ransomware attacks have increased 40% across the insurance sector this year according to industry threat reporting"],
["Ransomware — mitigated by endpoint detection, offline backups, and user awareness training",
 "Ransomware — mitigated by endpoint detection, offline backups, and annual user awareness training for all staff"],

["Creating strong, unique passwords for financial systems",
 "Creating strong, unique passwords for financial systems and storing them in an approved password manager"],
["Identifying phishing links in email before clicking them",
 "Identifying phishing links in email by hovering to inspect the destination before clicking them"],
["Reporting lost or stolen mobile devices promptly",
 "Reporting lost or stolen mobile devices to the service desk promptly so access can be revoked"],

["Accept the response, since best practice claims are standard in vendor questionnaires",
 "Accept the response, since best practice claims are standard in vendor questionnaires and rarely disputed at review"],
["Require the vendor to adopt your organization's internal encryption standard verbatim",
 "Require the vendor to adopt your organization's internal encryption standard verbatim before the contract is signed"],
["Substitute the vendor's marketing security page as supporting evidence",
 "Substitute the vendor's public marketing security page as supporting evidence in the assessment file"],

["Encrypted primary account numbers may not be stored under any circumstances",
 "Encrypted primary account numbers may not be stored under any circumstances once authorization completes"],
["Performance optimization is prohibited within the cardholder data environment",
 "Performance optimization is prohibited within the cardholder data environment under all operating conditions"],
["Primary account numbers must be hashed rather than encrypted in all cases",
 "Primary account numbers must be hashed rather than encrypted in every cardholder data environment"],

["Suppress the finding permanently, since unreachable code cannot be exploited",
 "Suppress the finding permanently, since code that is unreachable today cannot be exploited later either"],
["Patch all 400 servers as an emergency change within 24 hours",
 "Patch all 400 servers as an emergency change within 24 hours regardless of whether the path is reachable"],
["Remove the library entirely and refactor the application to avoid the dependency",
 "Remove the library entirely and refactor the application to eliminate the dependency this quarter"],

["Increase staffing so the current alert volume can be fully investigated",
 "Increase analyst staffing so the current alert volume can be fully investigated every day"],
["Disable the rule, since it is producing no actionable outcomes",
 "Disable the rule, since it is producing no actionable outcomes for the analysts working it"],
["Route the alerts to a lower-priority queue reviewed weekly",
 "Route the alerts to a lower-priority queue that is reviewed in bulk once each week"],

["A zero-day exploit in the browser's extension sandbox",
 "A zero-day exploit in the browser's extension sandbox permitting reads across origin boundaries"],
["A drive-by download that installed without user interaction",
 "A drive-by download that installed the extension without any user interaction or consent prompt"],
["A rootkit operating below the browser at kernel level",
 "A rootkit operating below the browser at kernel level and intercepting its network calls"],

["A buffer overflow in the service executable's argument parsing",
 "A buffer overflow in the service executable's argument parsing routine reachable at startup"],
["A DLL side-loading opportunity in the application directory",
 "A DLL side-loading opportunity in the application directory searched ahead of the system path"],
["A symbolic link race condition during service startup",
 "A symbolic link race condition during service startup between the access check and the file open"],

["A requirement that the playbook run only during business hours",
 "A requirement that the playbook run only when an analyst is available to review its actions"],
["Encryption of the playbook's configuration file at rest",
 "Encryption of the playbook's configuration file and stored credentials at rest in the platform"],
["A monthly report summarizing how many times the playbook executed",
 "A monthly report summarizing how many times the playbook executed and on which hosts"],

["Endpoint antivirus scan results from the affected subnet",
 "Endpoint antivirus scan results collected from every host on the affected subnet"],
["Windows Security event logs for account logon events",
 "Windows Security event logs filtered for account logon events across the domain controllers"],
["DNS server cache contents on the internal resolvers",
 "DNS server cache contents captured from the internal recursive resolvers before entries expire"],
];

let n = 0;
for (const [oldText, newText] of R) {
  let hit = false;
  for (const q of doc.questions) {
    const i = q.options.indexOf(oldText);
    if (i === -1) continue;
    if (i === q.correctAnswer) throw new Error('refusing to rewrite a KEY: ' + oldText.slice(0, 50));
    q.options[i] = newText; hit = true; n++;
  }
  if (!hit) console.log('  no match (skipped): ' + oldText.slice(0, 55));
}
writeFileSync(P, JSON.stringify(doc, null, 1));
console.log(`rewrote ${n} distractors`);
