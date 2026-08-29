import { readFileSync, writeFileSync } from 'node:fs';
const P = './seed/security-plus-replacements.json';
const doc = JSON.parse(readFileSync(P, 'utf8'));
const R = [
["The audit is required by regulation while the penetration test is a discretionary best practice",
 "The audit is required by regulation while the penetration test is a discretionary practice most firms skip"],
["The metric is accurate, since unregistered hosts fall outside the defined compliance scope",
 "The metric is accurate, since unregistered hosts fall outside the compliance scope as it was formally defined"],
["The metric is invalid and should be replaced with a count of vulnerabilities found",
 "The metric is invalid and should be replaced with a raw count of vulnerabilities found across the estate"],
["The metric is acceptable if the 15% are non-production or low-criticality systems",
 "The metric is acceptable provided the unregistered 15% are non-production or low-criticality systems"],
["Revoking all system access at the moment resignation is submitted",
 "Revoking all system and building access at the moment a resignation is formally submitted to HR"],
["Requiring a longer notice period so exit procedures have more time to run",
 "Requiring a longer notice period so exit procedures have more time to run before the departure date"],
["Mandatory annual re-signing of the acceptable use policy by all staff",
 "Mandatory annual re-signing of the acceptable use policy by all staff with completion tracked"],
["A distributed denial of service attack against the user API endpoint",
 "A distributed denial of service attack saturating the user API endpoint with repeated requests"],
["SQL injection extracting records from the user table",
 "SQL injection through the id parameter extracting successive records from the user table"],
["Session hijacking using stolen authentication cookies",
 "Session hijacking in which stolen authentication cookies are replayed against each account"],
["It uses encryption that endpoint agents are unable to decrypt in transit",
 "It uses encryption that endpoint agents are unable to decrypt while the payload is in transit"],
["It runs with lower privileges than a compiled executable would require",
 "It runs with markedly lower privileges than an equivalent compiled executable would require"],
["It cannot be recorded in Windows event logs under any configuration",
 "It cannot be recorded in Windows event logs under any available auditing configuration"],
["The application correctly blocked the traversal and returned a decoy file",
 "The application correctly blocked the traversal and deliberately returned a decoy file instead"],
["Input is being URL-decoded twice before the path is resolved",
 "Input is being URL-decoded twice by the framework before the final path is resolved"],
["The web server is running with root privileges, which alone permits the traversal",
 "The web server is running with root privileges, which on its own is what permits the traversal"],
["Disk images first, then RAM, then network state, then CPU cache",
 "Disk images first, then RAM, then live network state, then CPU registers and cache"],
["Archived backups first, then disk, then RAM, then CPU registers",
 "Archived backups first, then disk, then RAM, then CPU registers and processor cache"],
["Network packet captures first, then disk, then CPU registers, then RAM",
 "Network packet captures first, then disk, then CPU registers and cache, then RAM"],
["Increase the change board meeting frequency from weekly to twice weekly",
 "Increase the change board meeting frequency from weekly to twice weekly for patch items"],
["Deploy patches without testing to eliminate the validation delay",
 "Deploy patches directly to production without testing, eliminating the validation delay"],
["Purchase a faster patch distribution system with higher bandwidth",
 "Purchase a faster patch distribution system with higher bandwidth to the endpoint estate"],
["Increase log verbosity across all sources to capture more detail going forward",
 "Increase log verbosity across all sources so more detail is captured on every event going forward"],
["Move all logging to the SIEM's real-time alerting tier and drop archival storage",
 "Move all logging into the SIEM's real-time alerting tier and drop archival storage entirely"],
["Reduce retention further to cut storage cost, since the logs were not useful",
 "Reduce retention further to cut storage cost, given that the logs proved unhelpful here"],
];
let n = 0;
for (const [o, w] of R) {
  let hit = false;
  for (const q of doc.questions) {
    const i = q.options.indexOf(o);
    if (i === -1) continue;
    if (i === q.correctAnswer) throw new Error('refusing to rewrite a KEY: ' + o.slice(0, 40));
    q.options[i] = w; hit = true; n++;
  }
  if (!hit) console.log('  no match: ' + o.slice(0, 50));
}
writeFileSync(P, JSON.stringify(doc, null, 1));
console.log(`rewrote ${n} more distractors`);
