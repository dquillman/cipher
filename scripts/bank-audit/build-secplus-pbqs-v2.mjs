/**
 * Authors the second Security+ (SY0-701) PBQ set and writes
 * seed/security-plus-pbqs-v2.json. Run: node build-secplus-pbqs-v2.mjs
 *
 * Content lives here rather than in raw JSON so the reasoning stays readable
 * and reviewable in a diff. Same pattern as build-secplus-pbqs.mjs.
 *
 * ── The bar these are written against ────────────────────────────
 * CompTIA's own example simulation (demosim.comptia.org) is a network the
 * candidate investigates, not a sorting widget. Reading its app.js and its
 * SimulationInit payload, four things make it hard:
 *
 *   1. THE CANDIDATE PRODUCES THE EVIDENCE. `ping` is parsed by a regex and
 *      answered by a live ACL evaluator over real subnet arithmetic
 *      (pingFailed -> networkAccessControl -> parseIpAddress). Nothing is
 *      narrated. The question text never says which host is broken or what
 *      its address is; you learn 192.168.0.82 by running ipconfig, and you
 *      learn it matters by noticing the other workstation is .68.
 *   2. The symptom pattern is the clue, and it is raw: "can send internal
 *      Email, use the intranet, and print on the local area network printer."
 *      What still works narrows the fault as sharply as what fails.
 *   3. It penalises over-fixing — "Only make changes to correct the
 *      connectivity issue." Ten ACL lines each default to keep; exactly one
 *      must go, and every extra deletion is a decision scored wrong.
 *   4. Partial credit across many independent decisions.
 *
 * The instructions deliberately say only "Check the IP addresses and test the
 * connectivity"; they never say what to look for. That is the half a weak
 * imitation skips.
 *
 * ── What the first draft of this set got wrong ───────────────────
 * A critic took the previous 24 apart, and the rewrite is organised around
 * the findings. Recorded here because every one of them is a trap that will
 * be walked into again by whoever authors set three.
 *
 *   • LAYOUT LEAKED 32% OF THE MARKS. DragDropPBQ rendered items and zones in
 *     array order and FillTablePBQ rendered options in array order, so items
 *     listed in zone order and tables whose correct option index equalled the
 *     row index were free. A zero-knowledge candidate scored 50%. Fixed at
 *     BOTH ends: PBQQuestion.tsx now shuffles at render (useShuffledOnce /
 *     useOptionShuffler), and decorrelate() below shuffles the authored order
 *     so a leaked seed file is not an answer key either. The loader rejects
 *     any seed that regresses.
 *   • COMMAND SCENARIOS ANSWERED THEIR OWN STEM. `config.scenario` renders
 *     directly above the terminal, and it said things like "list every
 *     regular file that has the setuid bit set" — the diagnosis, handed over,
 *     leaving only typing. A scenario now states the GOAL and never the
 *     method, and the loader rejects a scenario containing a tool name or a
 *     flag from its own accepted commands.
 *   • ONE PLAUSIBLE TOOL IS NOT A DECISION. Every command question now
 *     accepts at least two genuinely different binaries, so choosing the tool
 *     is part of what is graded, and the real-world variants practitioners
 *     actually type are accepted rather than one blessed spelling.
 *   • ITEMS THAT STATE THEIR OWN ANSWER. "its CMOS battery is dead and it
 *     boots to 2019" placed into "Client clock outside the validity window"
 *     is transcription, not diagnosis. Evidence only; the inference is the
 *     candidate's.
 *   • STEMS THAT STATE THE DECISION RULE. Three stems gave the rule and then
 *     asked for it to be executed, which is the reverse of demosim. The rule
 *     is the thing under test and is now withheld.
 *   • DEPENDENT SECOND COLUMNS SOLD AS INDEPENDENT DECISIONS. In three
 *     tables the second column's correct index equalled the first's in every
 *     row. Every table now contains at least two rows that agree in column
 *     one and disagree later, and the loader proves it.
 *   • TWO QUESTIONS THAT WERE THE SAME QUESTION. The 5-gram check missed it
 *     because it measures wording and only ran against the old file.
 *     Duplicate detection now runs pairwise WITHIN this set, on declared
 *     concept keys here and on content-derived labels and rare tokens in the
 *     loader.
 *   • ORDER-STEPS THAT READ THEIR OWN ORDER OFF THE STEP TEXT ("before any
 *     account is touched", "once legal closes the matter"), and pairs of
 *     interchangeable steps that scorePBQ punishes with two lost marks for a
 *     defensible answer. Ordering vocabulary is banned by the loader, and
 *     interchangeable pairs are merged into single steps.
 *   • ONE OUTRIGHT ERROR AGAINST THE OBJECTIVES: replication keyed as a
 *     backup for an RPO-0 revenue database. Replication copies deletion,
 *     corruption and ransomware encryption in real time; SY0-701 3.4 lists
 *     them separately for that reason. Now keyed, and explained, as
 *     replication PLUS point-in-time backups.
 *
 * ── Where the evidence-gathering half lives ──────────────────────
 * Our four subtypes cannot run a live ACL evaluator, so the demosim loop is
 * split rather than faked. DD1 scores WHERE a check has to run and which
 * checks cannot discriminate at all. C1 scores producing two pieces of
 * evidence with a tool of your choosing. C2, C3, C4, C5 and C6 each score
 * choosing an instrument for a stated goal. FT1 is the act-on-the-evidence
 * half, and it withholds which of two laptops is broken so the candidate
 * still has to do the subnet arithmetic demosim forces.
 *
 * ── A rendering constraint that shapes the authoring ─────────────
 * Quiz.tsx renders `stem` inside an <h2> with no whitespace-pre-* class, so
 * newlines in a stem COLLAPSE to spaces. A ruleset pasted into a stem arrives
 * as one run-on paragraph. Structured evidence lives in the config, where
 * each piece gets its own element. Stems stay flowing prose.
 *
 * These questions are NOT reviewed by a certified subject matter expert.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arrangeConfig, balanceOptionPositions } from './pbq-leak.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

const EXAM_ID = '79cuGMNydTwDMhyiDjry';
const SOURCE = 'authored-2026-08-secplus-pbq-v2';

const D = {
    concepts: 'General Security Concepts',
    threats: 'Threats, Vulnerabilities, and Mitigations',
    arch: 'Security Architecture',
    ops: 'Security Operations',
    gov: 'Security Program Management and Oversight',
};

// Firestore rejects an array stored directly inside another array, so each
// accepted command sequence is wrapped. PBQQuestion.commandSequences() reads
// both this shape and the plain string[][] form. This exact bug is why no PBQ
// existed in the product until yesterday — do not "simplify" it back.
const seq = (...cmds) => ({ steps: cmds });

/** Cartesian product of command alternatives, as wrapped sequences. Every
 *  sequence a product generates has the same length, which scorePBQ requires
 *  (it compares seq.length to history.length before it compares contents). */
const seqProduct = (...slots) => {
    let acc = [[]];
    for (const slot of slots) {
        const next = [];
        for (const prefix of acc) for (const c of slot) next.push([...prefix, c]);
        acc = next;
    }
    return acc.map((s) => seq(...s));
};

const q = (o) => ({
    examId: EXAM_ID, source: SOURCE, type: 'pbq',
    difficulty: 'medium', bloomLevel: 'Apply', ...o,
});

const questions = [

    // ═════════════ DRAG-DROP (6) ═════════════

    q({
        id: 'dd-vantage',
        domain: D.ops, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['evidence-vantage-point', 'vpn-authentication-failure', 'mfa-enrolment', 'destructive-triage'],
        scenarioType: 'investigation-planning',
        // The demosim question the others skip: not "what is wrong" but "what
        // do I check, and on which host". Two of the six are scored for
        // recognising that a check cannot discriminate — demosim's over-fixing
        // penalty, moved to the evidence stage.
        stem: 'One user cannot sign in to the VPN. Her password works on the intranet and on her laptop, and her two teammates connect to the VPN from the same office without trouble. She replaced her phone on Monday. Nothing has been run yet. Drag each check to the place its result would actually mean something.',
        explanation: 'Where a check runs decides whether its result carries information, and two of these carry none anywhere. The concentrator log is the only place the reason code lives: it is the difference between a rejected credential, a failed second factor and a policy that never matched, and no amount of poking at her laptop will produce it. Which factors are enrolled against her account is meaningful on her account alone, because enrolment is per person — comparing it with a teammate tells you only that two people enrolled their own phones, while a token still bound to the handset she replaced on Monday explains everything the symptom shows. The two comparisons are comparisons for a reason. A group membership list read on its own is just a list; read against a colleague who connects, the missing group jumps out, and that is the same reasoning CompTIA\u2019s own simulation is built on, where one workstation\u2019s address means nothing until you have the other workstation\u2019s to hold it against. Client version and client certificate work the same way. The last two are the trap. Her password is already proven working on the intranet, so resetting it tests something the evidence has settled and costs the user her afternoon. Rebuilding the laptop destroys the state you are trying to read while she was signing in from that laptop successfully to everything except the VPN. Both are motion that looks like progress, and both are what "only make changes to correct the issue" exists to prevent.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'hers', label: 'On her account or her device — meaningful on its own' },
                    { id: 'compare', label: 'On hers and on a working teammate\u2019s, compared side by side' },
                    { id: 'elsewhere', label: 'On a system neither of them owns' },
                    { id: 'skip', label: 'Do not run it — the result cannot separate the possibilities' },
                ],
                items: [
                    { id: 'log', label: 'Read the VPN concentrator\u2019s authentication log for her failed attempts and the reason code it returned', correctZone: 'elsewhere' },
                    { id: 'mfa', label: 'List the multifactor methods currently enrolled against her account', correctZone: 'hers' },
                    { id: 'groups', label: 'Read her directory group memberships against a teammate who connects', correctZone: 'compare' },
                    { id: 'client', label: 'Read the VPN client version and client certificate on her laptop against that teammate\u2019s', correctZone: 'compare' },
                    { id: 'pwreset', label: 'Reset her directory password', correctZone: 'skip' },
                    { id: 'reimage', label: 'Rebuild her laptop from the standard image', correctZone: 'skip' },
                ],
            }
        },
    }),

    q({
        id: 'dd-authpattern',
        domain: D.threats, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['password-spraying', 'credential-stuffing', 'kerberoasting', 'benign-authentication-noise'],
        scenarioType: 'log-pattern-reading',
        stem: 'Overnight the domain controllers produced six authentication patterns. For each one, read how many accounts, how many sources, how many attempts per account, and whether anything failed at all. Two of the six should not be escalated to anybody.',
        explanation: 'Read the shape of the failures, not their count. Password spraying is one password against many accounts, so it shows as a single failure per account across hundreds of accounts, deliberately kept under the lockout threshold — that is the whole technique, and it works the same whether it is compressed into ninety seconds from one host or stretched over nine hours from rented infrastructure to stay under a rate threshold. Credential stuffing replays username-and-password pairs harvested from someone else\u2019s breach, so the tell is inverted: few accounts, an enormous spread of unrelated residential addresses, and a different password on every attempt rather than a shared one. Kerberoasting produces no failed logons at all, which is why counting failures misses it entirely; it is a burst of service-ticket requests for exactly the accounts that carry a service principal name, requested with RC4 so the ticket can be cracked offline at leisure. The two that cost teams their night are the ones that look worst. Thirty-eight failures against one account from the laptop that account uses every day, stopping for good after the user visited the service desk, is a saved credential replaying until somebody typed the new one. Fourteen hundred failures from a single application server, all against one target, ending when the app team restarted the service, is a configuration holding a stale secret in a retry loop. Escalating either burns an analyst\u2019s shift, and escalating the first teaches a user never to call the service desk again.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'spray', label: 'Password spraying' },
                    { id: 'stuff', label: 'Credential stuffing' },
                    { id: 'kerb', label: 'Kerberoasting' },
                    { id: 'benign', label: 'Do not escalate' },
                ],
                items: [
                    { id: 'fast', label: 'One internal host, 480 accounts, exactly one failed logon each, all inside 90 seconds', correctZone: 'spray' },
                    { id: 'slow', label: '200 accounts tried once each across nine hours from four hosting-provider addresses', correctZone: 'spray' },
                    { id: 'residential', label: '340 residential addresses, 12 accounts, every attempt carrying a different password', correctZone: 'stuff' },
                    { id: 'spn', label: 'Nine accounts that carry a service principal name requested as RC4 tickets from one workstation, with no failed logons anywhere', correctZone: 'kerb' },
                    { id: 'saved', label: 'One account, 38 failures over four hours from the laptop it signs in from daily, then a success; the failures stop for good after the user visited the service desk', correctZone: 'benign' },
                    { id: 'svcloop', label: 'One service account, 1,400 failures in an hour from a single application server against a single target, ending when the app team restarted the service', correctZone: 'benign' },
                ],
            }
        },
    }),

    q({
        id: 'dd-tlschain',
        domain: D.concepts, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['trust-store', 'subject-alternative-name', 'intermediate-chain', 'certificate-validity-window', 'revocation'],
        scenarioType: 'differential-diagnosis',
        stem: 'Six TLS failures were reported this week against sites that were working. In each report the useful evidence is not the error text but who fails and who does not. Drag each report to the link in the chain that is broken.',
        explanation: 'Each report names a different link, and the pattern of who succeeds identifies it. When domain-joined machines load the site and an unmanaged contractor laptop does not, the certificate is fine and the client is not: the private root that signed it arrives by group policy and that laptop never received it. The Java reporting job is the same fault wearing a disguise, and it is the one people misfile — the JVM keeps its own trust store, entirely separate from the operating system\u2019s, so browsers on that very server can load the site while the job on it cannot. A name that warns on the apex and not on www is a subject alternative name problem: current clients ignore the common name altogether and match only against the SAN list, so the apex has to be listed there in its own right. Desktop browsers succeeding while curl and a mobile app fail looks like a client bug and is the opposite of one — the server is not sending its intermediate, and browsers conceal that by caching intermediates from earlier visits or fetching them through the certificate\u2019s AIA extension. curl does neither, so it reports the truth about the server. A single kiosk rejecting a certificate every other client on that switch accepts cannot be evidence about the certificate, since the certificate is the one thing all of them share; the variable is the kiosk, and "not yet valid" places its clock behind the certificate\u2019s start date. And when every client breaks the morning after a reissue that followed a key exposure, the old certificate was revoked on purpose and something in the path is still presenting it.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'trust', label: 'The issuing CA is absent from that client\u2019s trust store' },
                    { id: 'san', label: 'The hostname is missing from the certificate\u2019s SAN list' },
                    { id: 'chain', label: 'The server is not sending the intermediate certificate' },
                    { id: 'clock', label: 'The client\u2019s clock is outside the validity window' },
                    { id: 'revoked', label: 'The certificate was revoked by the CA' },
                ],
                items: [
                    { id: 'contractor', label: 'Domain-joined laptops load the site; a contractor\u2019s unmanaged laptop reports an untrusted authority', correctZone: 'trust' },
                    { id: 'java', label: 'A Java reporting job fails with "unable to find valid certification path"; browsers on that same server load the site', correctZone: 'trust' },
                    { id: 'apex', label: 'https://example.net warns of a name mismatch; https://www.example.net on the same server does not', correctZone: 'san' },
                    { id: 'curl', label: 'Desktop browsers succeed; curl and an Android app fail with "unable to get local issuer certificate"', correctZone: 'chain' },
                    { id: 'kiosk', label: 'One lobby kiosk reports the certificate is not yet valid; every other client on that switch loads the site', correctZone: 'clock' },
                    { id: 'reissue', label: 'Every client began failing the morning after the vendor reissued following a key exposure', correctZone: 'revoked' },
                ],
            }
        },
    }),

    q({
        id: 'dd-mailauth',
        domain: D.threats, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['spf-dkim-dmarc', 'lookalike-domain', 'business-email-compromise', 'non-evidence'],
        scenarioType: 'header-evidence-reading',
        stem: 'Three near-identical requests to change a supplier\u2019s bank details arrived this week. Accounts payable has forwarded the authentication results and header details for each, along with what the staff noticed about them. Drag each observation to what it actually establishes.',
        explanation: 'Authentication results answer one narrow question — did this message come from infrastructure the domain owner authorised — and the three cases differ in whether that question was even asked of the right domain. A DMARC reject with SPF failing and no DKIM signature, on a header From carrying the supplier\u2019s domain, is the supplier\u2019s own published policy telling you the message is not theirs; the Received chain showing an entry point the supplier has never used is the same finding from the other direction. The second case is the one that defeats a checklist. Everything passes, and it passes honestly, because the attacker registered their own domain nine days ago and published perfectly valid records for it — authentication proves the message came from the domain it claims, and says nothing whatever about whether that domain is the one you do business with. The third is worse again: real domain, real platform, valid DKIM signature under the supplier\u2019s selector. Nothing was spoofed, which is precisely the problem — the mailbox itself is under someone else\u2019s control, and the reply-to pointing at free webmail is the redirect that gives it away. The last two observations feel like evidence and are not. Clean writing and correct branding are trivially copied and were never a discriminator; the display name is a free-text field the sender chooses, unauthenticated by anything, and treating either as a signal is how the second and third messages get paid.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'forged', label: 'The sending domain was forged, and its owner\u2019s own policy says so' },
                    { id: 'lookalike', label: 'The domain is not the supplier\u2019s, and its records are genuinely valid' },
                    { id: 'compromised', label: 'The supplier\u2019s real mailbox is under someone else\u2019s control' },
                    { id: 'nothing', label: 'Establishes nothing about whether the message is legitimate' },
                ],
                items: [
                    { id: 'dmarcfail', label: 'SPF fail, no DKIM signature, DMARC reject, header From on the supplier\u2019s domain', correctZone: 'forged' },
                    { id: 'received', label: 'The Received chain shows the message entering from an address the supplier has never sent from, with their domain in the From header', correctZone: 'forged' },
                    { id: 'newdomain', label: 'SPF pass, DKIM pass, DMARC pass; the sending domain was registered nine days ago and differs from the supplier\u2019s by one character', correctZone: 'lookalike' },
                    { id: 'realbox', label: 'SPF pass, DKIM pass under the supplier\u2019s own selector, sent from the supplier\u2019s mail platform, reply-to set to a free webmail address', correctZone: 'compromised' },
                    { id: 'branding', label: 'The body has no spelling errors and the branding matches the supplier\u2019s previous invoices', correctZone: 'nothing' },
                    { id: 'displayname', label: 'The display name reads "Accounts Payable \u2014 Supplier Ltd"', correctZone: 'nothing' },
                ],
            }
        },
    }),

    q({
        id: 'dd-evidenceweight',
        domain: D.ops, difficulty: 'hard', bloomLevel: 'Evaluate',
        conceptKeys: ['execution-vs-presence', 'endpoint-telemetry', 'threat-intel-attribution', 'proof-strength'],
        scenarioType: 'evidence-weighing',
        stem: 'A vendor report names a malware sample, and an analyst has assembled everything the environment holds that mentions it. Before anyone declares this host compromised, sort what each artefact is capable of proving about this host.',
        explanation: 'The whole question is the distance between "the file was here" and "the file ran", and containment decisions that ignore it either miss a live compromise or take a working machine off the network for nothing. A process-creation record from the endpoint agent, naming the image, its hash and its parent process on this host, is direct evidence of execution — it is the agent reporting that the operating system started that program. Windows event 4688 is the same claim from the operating system\u2019s own log. A proxy record of this host downloading the file establishes only that the bytes arrived; downloads sit unopened in a downloads folder every day of the week, and treating arrival as execution is how an analyst reports a compromise that never happened. Gateway delivery is weaker still and is a statement about the mail platform rather than about the endpoint: the message reached a mailbox, which is not evidence that it reached a disk, let alone a processor. The last two mention this host nowhere. A hash appearing in a vendor report is a statement about a campaign somewhere in the world and is the reason the search was run, not a result of it — circular, if you let it be. An inventory entry saying the vulnerable version is installed describes exposure, and exposure is a reason to look rather than a finding. Ranked properly, exactly two artefacts support isolating the host, and the other four support continuing to look.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'executed', label: 'Establishes the program ran on this host' },
                    { id: 'present', label: 'Establishes the file reached this host, not that it ran' },
                    { id: 'offered', label: 'Establishes only that it was sent to the user' },
                    { id: 'nothing', label: 'Says nothing about this host specifically' },
                ],
                items: [
                    { id: 'edr', label: 'An endpoint agent process-creation record naming the image, its hash and its parent process on this host', correctZone: 'executed' },
                    { id: 'e4688', label: 'Windows Security event 4688 for that image path on this host', correctZone: 'executed' },
                    { id: 'proxy', label: 'The web proxy logged this host retrieving the file', correctZone: 'present' },
                    { id: 'mail', label: 'The mail gateway recorded delivery of the attachment to the user\u2019s mailbox', correctZone: 'offered' },
                    { id: 'intel', label: 'The file\u2019s hash appears in the vendor report as associated with the campaign', correctZone: 'nothing' },
                    { id: 'inventory', label: 'The asset inventory lists this host as running the affected application version', correctZone: 'nothing' },
                ],
            }
        },
    }),

    q({
        id: 'dd-vulntriage',
        domain: D.threats, difficulty: 'hard', bloomLevel: 'Evaluate',
        conceptKeys: ['cvss-vs-exposure', 'exploit-availability', 'risk-acceptance', 'patch-scheduling'],
        scenarioType: 'triage-queue',
        stem: 'Six scan findings are queued for triage this morning, sorted by the scanner into descending CVSS base score. The queue is longer than the week. Decide what each finding gets.',
        explanation: 'A base score describes the flaw and is identical for every organisation on earth, so on its own it cannot rank anything; what ranks a finding is whether this environment gives it a reachable path and whether somebody has already written the exploit. On that reading the queue reorders itself and the scanner\u2019s sort turns out to be wrong twice over. The remote code execution on the public checkout path has both properties and a module shipped last week, so somebody else\u2019s scan finds it tonight. The concentrator denial of service scores lower and belongs in the same bucket for a sharper reason: exploiting it removes the remote access the responders would need, and proof-of-concept code is already public. The 9.1 is the highest-scoring finding in the queue and the clearest accept — the service is stopped, the port is closed on the host firewall, and removing the component ends vendor support, so there is no path to it and patching it to turn a dashboard green is theatre. The reporting tool is an accept for a different reason: a signed-off decommission date sooner than any realistic patch cycle makes the decommission the remediation. That leaves two for the ordinary cycle. The wiki disclosure is genuinely reachable by every employee but hands over information rather than control and has no public exploit; the laptop escalation scores higher yet needs local access and an already signed-in user, which is a second compromise it does not itself provide.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'emergency', label: 'Emergency change \u2014 patch out of cycle' },
                    { id: 'cycle', label: 'Next scheduled patch cycle' },
                    { id: 'accept', label: 'Risk-accept with a documented justification and a review date' },
                ],
                items: [
                    { id: 'rce', label: 'CVSS 9.8 \u00b7 remote code execution in a library on the public checkout API \u00b7 an exploitation module for it shipped last week', correctZone: 'emergency' },
                    { id: 'vpn', label: 'CVSS 7.5 \u00b7 denial of service in the VPN concentrator every remote worker uses \u00b7 proof-of-concept code posted yesterday', correctZone: 'emergency' },
                    { id: 'dormant', label: 'CVSS 9.1 \u00b7 in a component of the vendor appliance image \u00b7 the service is stopped, its port is closed on the host firewall, and removing the component ends vendor support', correctZone: 'accept' },
                    { id: 'eol', label: 'CVSS 5.3 \u00b7 in a reporting tool whose decommission is signed off for the 14th of next month \u00b7 reachable only from the admin VLAN', correctZone: 'accept' },
                    { id: 'wiki', label: 'CVSS 6.5 \u00b7 information disclosure in the staff wiki \u00b7 reachable by every employee \u00b7 no public exploit', correctZone: 'cycle' },
                    { id: 'laptop', label: 'CVSS 8.8 \u00b7 privilege escalation on the standard laptop image \u00b7 needs local access and a signed-in user \u00b7 no public exploit', correctZone: 'cycle' },
                ],
            }
        },
    }),

    // ═════════════ ORDER-STEPS (6) ═════════════

    q({
        id: 'os-domainadmin',
        domain: D.ops, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['privileged-account-compromise', 'volatile-evidence-order', 'krbtgt-reset', 'persistence-hunting'],
        scenarioType: 'incident-sequence',
        stem: 'A domain administrator account authenticated from a host it has never used, at an hour its owner was asleep. The account is still live, and everything you do is visible to whoever is using it.',
        explanation: 'Two clocks run at once: the intruder entrenching, and you announcing yourself. Confirming the alert is genuine has to come at the top, because a domain admin reset at three in the morning against a false positive is its own outage, and the owner working late from a replacement machine produces exactly this alert. Capture is the next thing that can only be done once, since the controller security log rolls and a memory image ceases to exist the moment anyone starts remediating. Scoping follows because you cannot evict what you have not found, and persistence hunting follows scoping because you have to know which hosts to hunt on. An account with domain admin has almost certainly been given a second way in — an added account, a group membership, a scheduled task, a service principal — and cutting only the original access leaves the intruder still signed in. That is why eviction is one coordinated action rather than a sequence of small ones: closing doors individually announces the investigation and lets them walk through whatever is left. The krbtgt reset earns its place near the end and is the classic error when placed at the start. Twice, with replication between, invalidates every Kerberos ticket in the domain including any golden ticket already forged, which is worth doing — but doing it early tips the intruder while their other footholds are still unmapped, and buys one lost foothold in exchange for the rest of the investigation. Recovery restores service under heightened monitoring, and the review has to reach the privileged access model itself, because an account able to do this much damage from a single compromise is the finding underneath the finding.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Confirm the alert against the owner\u2019s location and schedule',
                    'Capture the domain controller security log and a memory image of the host the logon came from',
                    'Enumerate every host the account authenticated to during the exposure window',
                    'Identify persistence: added accounts, group memberships, scheduled tasks and service principals',
                    'Cut all identified access in one coordinated action rather than item by item',
                    'Reset the krbtgt password twice, allowing replication to complete between the resets',
                    'Return systems to service with heightened monitoring on the affected accounts and hosts',
                    'Document the root cause and revise the privileged access model that permitted it',
                ]
            }
        },
    }),

    q({
        id: 'os-keyexposure',
        domain: D.concepts, difficulty: 'hard', bloomLevel: 'Evaluate',
        conceptKeys: ['private-key-exposure', 'certificate-reissue', 'revocation-timing', 'exposure-window'],
        scenarioType: 'remediation-sequence',
        stem: 'A web server\u2019s private key was committed to a public repository. The certificate has to be replaced and the exposed one revoked, and the site takes customer traffic continuously.',
        explanation: 'The instinct is to revoke immediately, and it is the single ordering that guarantees an outage. Revocation takes effect the moment the CA publishes it: every client consulting a CRL or an OCSP responder starts refusing the site, and the replacement is still an issuance and a deployment away. So the replacement is built while the compromised certificate is still doing its job. Establishing how long the key was readable comes at the top for a reason that is not sentiment — it is the number that decides how much else has to be rotated, and it stops being recoverable as repository history gets rewritten and logs age out. The new key pair is generated on the server itself, which is what makes the replacement meaningful; a key that has travelled is a key nobody can vouch for, and this entire incident is about a key that travelled. The signing request carries that new public key to the CA, validation completes, and the issued certificate and chain go in alongside the one in service rather than over it, so a mistake is a rollback instead of an outage. Cutover is verified from a client, because the certificate a server is configured to send and the certificate it actually sends part company more often than anyone expects. Only now does revocation cost nothing, and the revocation is confirmed as published, since a revocation requested and never checked has protected nobody. Rotating everything else that key protected closes the incident, and it is scoped by the exposure window established at the start.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Establish how long the key was publicly readable and from where it could have been copied',
                    'Generate a new key pair on the server itself',
                    'Submit a certificate signing request for the new key and complete the CA\u2019s validation',
                    'Install the issued certificate and its chain alongside the certificate in service',
                    'Cut the service over and confirm from a client which certificate the server now sends',
                    'Request revocation of the exposed certificate',
                    'Confirm the revocation is published in the CRL and answered by OCSP',
                    'Rotate every other credential that key protected and close the incident record',
                ]
            }
        },
    }),

    q({
        id: 'os-litigationhold',
        domain: D.gov, difficulty: 'hard', bloomLevel: 'Apply',
        conceptKeys: ['litigation-hold', 'chain-of-custody', 'retention-suspension', 'departing-employee'],
        scenarioType: 'legal-preservation-sequence',
        stem: 'An engineer is being terminated this afternoon. In the week they gave notice they downloaded an unusual volume of design files, and legal expects litigation. Ordinary IT process would destroy most of what matters here.',
        explanation: 'The duty to preserve attaches when litigation is reasonably anticipated, not when a claim is filed, which is why the hold has to be in place at the very top: it is the instrument that suspends the automated retention rules, and those rules are the actual threat. A mailbox purged thirty days after an account is disabled was not destroyed by anybody\u2019s decision — it was destroyed by a policy nobody remembered was running. Cutting access comes second and turns on a distinction that decides the whole case: disabling the account and revoking live sessions and tokens stops the engineer while leaving every artefact intact, whereas deleting the account is the single most destructive thing available, because on many platforms it takes the mailbox and the drive with it. Preservation then runs as one collection rather than several, and that is deliberate. Mailbox, home directory, cloud storage, device images and the access, VPN and file-transfer logs from the notice period have different owners and different retention clocks, and sequencing them invites the one with the shortest clock to expire while somebody works through the list; the laptop in particular is one re-image away from being the next hire\u2019s machine. Handover carries a signed chain-of-custody record, without which evidence collected competently may still be worth nothing in the proceeding it was collected for. Release is the step people take on their own judgement and should not: assets go back to the pool at legal\u2019s direction, because releasing early is what turns a preservation programme into a liability.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Have legal issue the litigation hold',
                    'Disable the accounts and revoke live sessions and tokens, deleting nothing',
                    'Preserve the mailbox, home directory, cloud storage, device images and the logs covering the notice period',
                    'Hand the preserved set to the investigator with a signed chain-of-custody record',
                    'Release the hold and return the assets to the pool at legal\u2019s direction',
                ]
            }
        },
    }),

    q({
        id: 'os-firewallchange',
        domain: D.arch, difficulty: 'medium', bloomLevel: 'Apply',
        conceptKeys: ['change-safety', 'out-of-band-management', 'automatic-rollback', 'positive-and-negative-verification'],
        scenarioType: 'change-sequence',
        stem: 'You have to add a rule to an internet-facing firewall you administer remotely, across the very path the rule could break. A site visit is four hours away.',
        explanation: 'Everything ahead of the change exists to survive the change. A management session that does not depend on the rule being edited is what keeps you connected when the rule is wrong, and if your only path in is the path you are modifying, a bad commit locks you out of the one device that can undo it. Capturing the running configuration and arming the automatic rollback belong together because they are one idea: something to restore, and something that restores it without you. The rollback is what separates a professional change from a hopeful one, since the device reverts on its own absent a confirmation, so even a change that severs your own connection heals itself in minutes rather than after a drive. Placement is not cosmetic — above the deny-all so the rule is ever reached, below the management permit so it cannot shadow your own access. Verification is one step on purpose, and the fact that it is one step is the point: confirming the intended traffic passes proves the rule works, confirming the traffic it denies is still blocked proves you did not write a permit wider than you meant, and neither of those is a check you would sensibly do without the other. The last two are ordered by what a mistake costs. Confirming cancels the rollback, and saving makes the configuration survive a reboot; saving a configuration that has not been verified is a mistake made permanent, and saving before confirming turns the safety net into a formality.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Open a management session that does not depend on the rule being changed',
                    'Capture the running configuration and arm an automatic rollback that reverts the change unless it is confirmed',
                    'Apply the rule above the deny-all and below the management permit',
                    'Verify from the affected segment that the intended traffic passes and that the traffic the rule denies is blocked',
                    'Confirm the change to cancel the automatic rollback',
                    'Save the running configuration to the startup configuration',
                ]
            }
        },
    }),

    q({
        id: 'os-phishing',
        domain: D.ops, difficulty: 'medium', bloomLevel: 'Apply',
        conceptKeys: ['phishing-response', 'indicator-extraction', 'blast-radius', 'credential-containment'],
        scenarioType: 'incident-sequence',
        stem: 'A user forwards a message that led to a convincing single sign-on page. Others on the same distribution list received it, and some may have typed their password into it.',
        explanation: 'The reported message is evidence before it is a nuisance, and the reflex — purge it everywhere, immediately — destroys the sample and the recipient list in the same action. Preserving it with full headers protects the one copy that carries the sending infrastructure and the authentication results every indicator is derived from. Extraction turns that copy into something searchable: sender, subject, URL, attachment hashes. The gateway search establishes the blast radius, which is the number driving every decision after it, and without it the response is a guess at how many people are involved. Then comes the distinction that changes what the response is for. Who clicked is a monitoring question; who submitted credentials is an active compromise, and those two populations get different treatment. Resetting the submitters and revoking their sessions is placed ahead of cleanup because a stolen credential is being used right now, while a copy of an email sitting in an unopened mailbox is not doing anything at all — and revoking sessions matters as much as the reset, since a password change alone leaves an already-issued token working. Purging and blocking the indicators at the gateway and the proxy closes the remaining exposure, and it lands here rather than at the start precisely because doing it early would have taken the sample and the recipient list with it. The briefing is not a formality: the users who reported it need to see that reporting worked, or the next message arrives with nobody willing to raise it.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Preserve the reported message with its full headers',
                    'Extract the sender, subject, URL and attachment hashes as indicators',
                    'Search the mail gateway for every recipient of the same message',
                    'Separate the recipients who clicked the link from those who submitted credentials',
                    'Reset the credentials of those who submitted them and revoke their sessions',
                    'Purge the message from remaining mailboxes and block the indicators at the gateway and the proxy',
                    'Brief the affected users and add the sample to awareness training',
                ]
            }
        },
    }),

    q({
        id: 'os-changefreeze',
        domain: D.concepts, difficulty: 'hard', bloomLevel: 'Evaluate',
        conceptKeys: ['change-freeze-exception', 'wormable-flaw', 'interim-mitigation', 'inventory-blind-spots'],
        scenarioType: 'change-sequence',
        stem: 'A vendor advisory describes a wormable remote code execution flaw in software your organisation runs. It is the last week of the quarter and a change freeze is in effect.',
        explanation: 'A freeze is a risk control rather than a law of physics, and the sequence has to earn the exception before invoking it. Verifying that the advisory applies to the versions actually deployed comes at the top because advisories cover version ranges and organisations run what they run; a fleet already past the affected build turns an emergency into a note, and an exception requested on an assumption is the reason freezes stop being respected. Establishing which of those hosts are reachable from an untrusted network is what separates wormable in theory from wormable here, and it is the evidence the exception is built on. Only then is the emergency process invoked, with that evidence attached — going through the process rather than around it is what keeps the freeze meaningful for everybody else. The interim mitigation reaching internet-facing hosts ahead of any testing is the placement that looks wrong and is not: a configuration change or a blocked port costs minutes, a tested patch costs days, and against something self-propagating the gap between those two is the entire exposure. Testing still happens, because a patch that breaks the application during a freeze is precisely what freezes exist to prevent, and skipping it trades one incident for another. Deployment runs exposed hosts first because that is where a worm enters. The closing rescan is not ceremony: the first step trusted an inventory, and on any real network the surviving unpatched instance is the host the inventory never knew about.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Verify the advisory applies to the versions actually deployed',
                    'Identify which of those hosts are reachable from an untrusted network',
                    'Invoke the emergency change process with that evidence attached',
                    'Apply the vendor\u2019s interim mitigation to the internet-facing hosts',
                    'Test the patch on a representative non-production host',
                    'Patch the exposed hosts, working inward to the internal ones',
                    'Rescan to confirm the finding is closed, including on hosts the inventory missed',
                ]
            }
        },
    }),

    // ═════════════ FILL-TABLE (6) ═════════════

    q({
        id: 'ft-acl',
        domain: D.arch, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['first-match-acl', 'subnet-arithmetic', 'over-fixing-penalty', 'shadowed-rule'],
        scenarioType: 'acl-remediation',
        // The demosim analogue, with the two things the first draft handed
        // over put back: it does not say which laptop is broken, so the /26 in
        // line 4 has to be reasoned against two addresses rather than one, and
        // the second column makes every line a real evaluation instead of
        // seven free "keep"s. Ruleset verified against a first-match evaluator
        // below before this file ships.
        stem: 'Two finance laptops sit at the same bank of desks on the user VLAN. One of them cannot load any external website; the other browses normally. Both send and receive internal mail, load the intranet, and print to the floor printer. The ticket carries ipconfig output from each: 172.16.20.196 and 172.16.20.20, both with mask 255.255.255.0 and gateway 172.16.20.1. The router ACL is listed in evaluation order, first match wins, and anything matching no line is dropped by an implicit deny. Decide whether each line stays or goes, and what removing it would do. Change only what is required.',
        explanation: 'Read the symptom pattern before the rules, because what still works narrows the fault faster than what fails. Internal mail and the intranet work from both desks, so user VLAN traffic to 172.16.30.0/24 is passing at line 2 and never reaches anything below it. Printing stays on the local segment and never touches the router, so it is not evidence about the ACL in either direction. Only off-net traffic fails, and only for one laptop, and the ticket never says which — that is the arithmetic. 172.16.20.196 falls inside 172.16.20.192/26 and 172.16.20.20 does not, so line 4 denies the first to every destination while the second reaches line 7 and browses. Removing line 4 is the entire fix. Every other removal costs something specific, which is what the second column is for. Line 3 is genuinely defective and removing it changes nothing at all: line 2 already permits everything from the user VLAN to the server VLAN, so the RDP deny beneath it can never match and RDP into the server VLAN is permitted today. That is a real finding, and it belongs in its own ticket rather than in a change made to restore one user\u2019s browsing. Lines 1, 5 and 6 sit above the broad permit at line 7, so deleting any of them hands the whole floor something nobody asked for: ping into the server VLAN, or outbound SSH and RDP, or outbound SNMP. Removing line 2 or line 7 breaks what currently works — line 2 takes the intranet away from the .192/26 hosts and exposes the shadowed RDP deny, and line 7 takes browsing away from the entire floor. Line 8 is the one that looks free: the implicit deny drops the same traffic either way, so removing it changes no packet\u2019s fate and only removes the explicit line that makes those drops visible in the log.',
        pbqConfig: {
            pbqType: 'fill-table', fillTable: {
                columns: ['Decision', 'If this line were removed'],
                rows: [
                    {
                        label: '1 \u00b7 deny \u00b7 any \u2192 172.16.30.0/24 \u00b7 ICMP', fields: [
                            { correctValue: 'Keep', options: ['Keep', 'Remove'] },
                            { correctValue: 'Permits traffic nobody asked for', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                    {
                        label: '2 \u00b7 permit \u00b7 172.16.20.0/24 \u2192 172.16.30.0/24 \u00b7 any', fields: [
                            { correctValue: 'Keep', options: ['Keep', 'Remove'] },
                            { correctValue: 'Breaks something that currently works', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                    {
                        label: '3 \u00b7 deny \u00b7 172.16.20.0/24 \u2192 172.16.30.0/24 \u00b7 TCP 3389', fields: [
                            { correctValue: 'Keep', options: ['Keep', 'Remove'] },
                            { correctValue: 'No change to any traffic', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                    {
                        label: '4 \u00b7 deny \u00b7 172.16.20.192/26 \u2192 any \u00b7 any', fields: [
                            { correctValue: 'Remove', options: ['Keep', 'Remove'] },
                            { correctValue: 'Restores the failing laptop\u2019s internet access', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                    {
                        label: '5 \u00b7 deny \u00b7 172.16.20.0/24 \u2192 any \u00b7 TCP 22,3389', fields: [
                            { correctValue: 'Keep', options: ['Keep', 'Remove'] },
                            { correctValue: 'Permits traffic nobody asked for', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                    {
                        label: '6 \u00b7 deny \u00b7 172.16.20.0/24 \u2192 any \u00b7 UDP 161', fields: [
                            { correctValue: 'Keep', options: ['Keep', 'Remove'] },
                            { correctValue: 'Permits traffic nobody asked for', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                    {
                        label: '7 \u00b7 permit \u00b7 172.16.20.0/24 \u2192 any \u00b7 any', fields: [
                            { correctValue: 'Keep', options: ['Keep', 'Remove'] },
                            { correctValue: 'Breaks something that currently works', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                    {
                        label: '8 \u00b7 deny \u00b7 any \u2192 any \u00b7 any', fields: [
                            { correctValue: 'Keep', options: ['Keep', 'Remove'] },
                            { correctValue: 'No change, but drops stop appearing in the log', options: ['Restores the failing laptop\u2019s internet access', 'Breaks something that currently works', 'Permits traffic nobody asked for', 'No change to any traffic', 'No change, but drops stop appearing in the log'] }]
                    },
                ],
            }
        },
    }),

    q({
        id: 'ft-triage',
        domain: D.ops, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['alert-triage', 'scanning-vs-successful-access', 'dga-beaconing', 'impossible-travel', 'insider-exfiltration'],
        scenarioType: 'triage-queue',
        stem: 'Six alerts are sitting in the queue, each carrying the evidence that generated it. Say what the evidence indicates and how the alert should be dispositioned. Not every alert warrants touching a host, and two of them do not indicate anything different from each other.',
        explanation: 'What the evidence indicates and what should be done about it are two questions, and the first two rows exist to prove it. Both are untargeted internet scanning — the same actor behaviour, the same shape, no targeting — but one hits a path that does not exist on a service that does not run and collects nothing but 404s, while the other hits a path that does exist and was answered twice with 200. The indication is identical and the disposition is not: the first is noise and deserves a tuned rule so the next thousand page nobody, and the second is an access that succeeded, which is an incident regardless of how unglamorous its origin. A candidate who lets the first column decide the second gets one of those two wrong by construction. The rest turn on reading the evidence rather than the alert name. Hundreds of unique high-entropy domains resolving almost entirely to NXDOMAIN is a generated-domain algorithm searching for a live controller, which is malware running on that host, so the host comes off the network. Two authentications from cities hours apart inside half an hour is impossible travel, and the response is different in kind — you do not isolate a host, you force reauthentication and speak to the human, because a shared credential and an executive on a VPN both produce this signature. Bulk reads followed by a large upload to personal storage from a departing employee is an HR and legal matter as much as a technical one, and wiping the machine to be safe destroys the case. The signed vendor updater writing into its own directory during a patch window is software doing its job; chasing it teaches the team to ignore the next endpoint alert.',
        pbqConfig: {
            pbqType: 'fill-table', fillTable: {
                columns: ['What the evidence indicates', 'Disposition'],
                rows: [
                    {
                        label: '1,200 requests to /wp-login.php from 90 addresses in 4 minutes; the site runs no WordPress; every response 404', fields: [
                            { correctValue: 'Untargeted internet scanning', options: ['Untargeted internet scanning', 'Malware searching for a generated domain', 'Impossible travel', 'Bulk data movement by an insider', 'Expected behaviour of a signed updater'] },
                            { correctValue: 'Tune the rule \u2014 no host action', options: ['Tune the rule \u2014 no host action', 'Escalate \u2014 treat as a successful access', 'Escalate \u2014 isolate the host', 'Escalate \u2014 force reauthentication and verify with the user', 'Escalate \u2014 preserve evidence and involve HR and legal', 'Close as benign and allow-list it'] }]
                    },
                    {
                        label: '900 requests to /actuator/env from 60 addresses in 6 minutes; that path exists on this service and answered 200 twice', fields: [
                            { correctValue: 'Untargeted internet scanning', options: ['Untargeted internet scanning', 'Malware searching for a generated domain', 'Impossible travel', 'Bulk data movement by an insider', 'Expected behaviour of a signed updater'] },
                            { correctValue: 'Escalate \u2014 treat as a successful access', options: ['Tune the rule \u2014 no host action', 'Escalate \u2014 treat as a successful access', 'Escalate \u2014 isolate the host', 'Escalate \u2014 force reauthentication and verify with the user', 'Escalate \u2014 preserve evidence and involve HR and legal', 'Close as benign and allow-list it'] }]
                    },
                    {
                        label: 'One workstation resolved 340 unique high-entropy domains in an hour, nearly all returning NXDOMAIN', fields: [
                            { correctValue: 'Malware searching for a generated domain', options: ['Untargeted internet scanning', 'Malware searching for a generated domain', 'Impossible travel', 'Bulk data movement by an insider', 'Expected behaviour of a signed updater'] },
                            { correctValue: 'Escalate \u2014 isolate the host', options: ['Tune the rule \u2014 no host action', 'Escalate \u2014 treat as a successful access', 'Escalate \u2014 isolate the host', 'Escalate \u2014 force reauthentication and verify with the user', 'Escalate \u2014 preserve evidence and involve HR and legal', 'Close as benign and allow-list it'] }]
                    },
                    {
                        label: 'One user authenticated from Denver at 09:04 and from Lagos at 09:31 the same morning', fields: [
                            { correctValue: 'Impossible travel', options: ['Untargeted internet scanning', 'Malware searching for a generated domain', 'Impossible travel', 'Bulk data movement by an insider', 'Expected behaviour of a signed updater'] },
                            { correctValue: 'Escalate \u2014 force reauthentication and verify with the user', options: ['Tune the rule \u2014 no host action', 'Escalate \u2014 treat as a successful access', 'Escalate \u2014 isolate the host', 'Escalate \u2014 force reauthentication and verify with the user', 'Escalate \u2014 preserve evidence and involve HR and legal', 'Close as benign and allow-list it'] }]
                    },
                    {
                        label: 'A departing employee\u2019s account read 8,400 files in 20 minutes, then uploaded 6 GB to personal storage', fields: [
                            { correctValue: 'Bulk data movement by an insider', options: ['Untargeted internet scanning', 'Malware searching for a generated domain', 'Impossible travel', 'Bulk data movement by an insider', 'Expected behaviour of a signed updater'] },
                            { correctValue: 'Escalate \u2014 preserve evidence and involve HR and legal', options: ['Tune the rule \u2014 no host action', 'Escalate \u2014 treat as a successful access', 'Escalate \u2014 isolate the host', 'Escalate \u2014 force reauthentication and verify with the user', 'Escalate \u2014 preserve evidence and involve HR and legal', 'Close as benign and allow-list it'] }]
                    },
                    {
                        label: 'The endpoint agent flagged a vendor updater, signed by that vendor, writing into its own program directory during the patch window', fields: [
                            { correctValue: 'Expected behaviour of a signed updater', options: ['Untargeted internet scanning', 'Malware searching for a generated domain', 'Impossible travel', 'Bulk data movement by an insider', 'Expected behaviour of a signed updater'] },
                            { correctValue: 'Close as benign and allow-list it', options: ['Tune the rule \u2014 no host action', 'Escalate \u2014 treat as a successful access', 'Escalate \u2014 isolate the host', 'Escalate \u2014 force reauthentication and verify with the user', 'Escalate \u2014 preserve evidence and involve HR and legal', 'Close as benign and allow-list it'] }]
                    },
                ],
            }
        },
    }),

    q({
        id: 'ft-sshd',
        domain: D.arch, difficulty: 'hard', bloomLevel: 'Apply',
        conceptKeys: ['sshd-hardening', 'bastion-purpose', 'hardening-reflex-trap', 'audit-logging-detail'],
        scenarioType: 'configuration-table',
        // Four of the seven rows punish "pick the most restrictive value",
        // which is the reflex that made the first draft of this question free.
        // Every option is a value sshd actually accepts; the previous version
        // offered "unlimited" for MaxAuthTries, which does not exist.
        stem: 'You are writing sshd_config for a bastion host. The standard requires every account to authenticate with a key. A nightly backup job connects to this host as root using a key pair and cannot be changed until next quarter. Administrators reach the management VLAN by forwarding connections through this bastion, and their laptops offer two keys from an ssh-agent on every connection. Choose the value for each directive.',
        explanation: 'Four of these rows punish the reflex of picking the most restrictive value on offer, which is why reading the constraints is the work. PermitRootLogin no satisfies the standard and stops the backup tonight, because that job authenticates as root with a key; forced-commands-only is stricter still and also stops it, since it requires a command restriction in the authorized_keys entry that nobody has written. prohibit-password keeps root usable by that key and refuses every password-based root logon, which is what the standard actually asks for. MaxAuthTries 1 is the tightest number available and disconnects the administrators, because a client offering two keys from an agent needs more than one attempt before it reaches the key that works; 3 accommodates them while still cutting an attacker\u2019s attempts per connection well below the default. LoginGraceTime is the trap with teeth: 0 looks like the hardest setting and means the opposite, since sshd reads it as no time limit at all, leaving unauthenticated connections open indefinitely, which is exactly the resource exhaustion the directive exists to prevent. AllowTcpForwarding no is correct on almost any other host and wrong on this one, because forwarding through the bastion is the reason the bastion exists. LogLevel is neither the quietest nor the loudest: VERBOSE records the fingerprint of the key that authenticated, which turns "someone logged in as root" into "this key logged in as root", while DEBUG3 fills the disk and can write sensitive material into the log. PasswordAuthentication and X11Forwarding are the two rows where the reflex happens to be right.',
        pbqConfig: {
            pbqType: 'fill-table', fillTable: {
                columns: ['Value'],
                rows: [
                    { label: 'PermitRootLogin', fields: [{ correctValue: 'prohibit-password', options: ['yes', 'no', 'prohibit-password', 'forced-commands-only'] }] },
                    { label: 'PasswordAuthentication', fields: [{ correctValue: 'no', options: ['yes', 'no'] }] },
                    { label: 'MaxAuthTries', fields: [{ correctValue: '3', options: ['1', '3', '6', '10'] }] },
                    { label: 'LoginGraceTime', fields: [{ correctValue: '30', options: ['0', '30', '120', '600'] }] },
                    { label: 'AllowTcpForwarding', fields: [{ correctValue: 'yes', options: ['yes', 'no', 'local', 'remote'] }] },
                    { label: 'X11Forwarding', fields: [{ correctValue: 'no', options: ['yes', 'no'] }] },
                    { label: 'LogLevel', fields: [{ correctValue: 'VERBOSE', options: ['QUIET', 'INFO', 'VERBOSE', 'DEBUG3'] }] },
                ],
            }
        },
    }),

    q({
        id: 'ft-bcdr',
        domain: D.arch, difficulty: 'hard', bloomLevel: 'Evaluate',
        conceptKeys: ['rpo-drives-backup', 'rto-drives-site', 'replication-is-not-backup', 'right-sizing-resilience'],
        scenarioType: 'requirements-table',
        // The previous version keyed "Synchronous replication" as the backup
        // for an RPO-0 revenue database and "No backup" for a sandbox row
        // labelled "reproducible from source control" — one wrong against the
        // objectives, one a literal string match. Both fixed.
        stem: 'Six systems carry a recovery point objective and a recovery time objective agreed with the business. Choose the data protection and the recovery site each one needs, and do not buy a tier nothing requires.',
        explanation: 'The two objectives drive two different decisions, and the rows that share a protection scheme while needing different sites are there to make that unavoidable: the scheduling system and the HR case system have the same recovery point objective and therefore the same backup, and their recovery times differ by three days, which is a site decision and nothing to do with backups. The recovery point objective is a statement about data age, so it picks the protection. Zero means no committed transaction may be lost, and that is where replication has to be read carefully: synchronous replication delivers the objective and is not by itself a backup, because it copies a deletion, a corruption or a ransomware encryption to the replica in real time with perfect fidelity. Point-in-time backups alongside it are what make the data recoverable from a bad write rather than merely survivable through a lost disk, which is why SY0-701 lists replication and backups as separate concepts. An hour needs incrementals through the day; twenty-four hours is satisfied by a nightly job. An archive written once and never modified has nothing to replicate and a regulatory requirement that it cannot be altered, which write-once media answers directly. The recovery time objective is a statement about time to service, so it picks the site. Fifteen minutes does not allow for provisioning anything, so the standby is already running. Four hours is also a hot site, three days and two days are what a warm site exists for, thirty days makes a cold site sufficient. The sandbox is the judgement row: it holds nothing the build pipeline does not generate, so protecting it is paying to keep a copy of something already held, and giving it a site is paying twice. Assigning every system the strongest option is not caution — it spends the resilience budget where it buys nothing.',
        pbqConfig: {
            pbqType: 'fill-table', fillTable: {
                columns: ['Data protection', 'Recovery site'],
                rows: [
                    {
                        label: 'Order-entry database \u00b7 RPO 0 \u00b7 RTO 15 minutes', fields: [
                            { correctValue: 'Synchronous replication with point-in-time backups', options: ['Synchronous replication with point-in-time backups', 'Nightly full with hourly incrementals', 'Nightly full only', 'Write-once immutable media', 'No protection required'] },
                            { correctValue: 'Hot site', options: ['Hot site', 'Warm site', 'Cold site', 'No recovery site'] }]
                    },
                    {
                        label: 'Clinical scheduling system \u00b7 RPO 1 hour \u00b7 RTO 4 hours', fields: [
                            { correctValue: 'Nightly full with hourly incrementals', options: ['Synchronous replication with point-in-time backups', 'Nightly full with hourly incrementals', 'Nightly full only', 'Write-once immutable media', 'No protection required'] },
                            { correctValue: 'Hot site', options: ['Hot site', 'Warm site', 'Cold site', 'No recovery site'] }]
                    },
                    {
                        label: 'HR case management \u00b7 RPO 1 hour \u00b7 RTO 3 days', fields: [
                            { correctValue: 'Nightly full with hourly incrementals', options: ['Synchronous replication with point-in-time backups', 'Nightly full with hourly incrementals', 'Nightly full only', 'Write-once immutable media', 'No protection required'] },
                            { correctValue: 'Warm site', options: ['Hot site', 'Warm site', 'Cold site', 'No recovery site'] }]
                    },
                    {
                        label: 'Corporate file shares \u00b7 RPO 24 hours \u00b7 RTO 2 days', fields: [
                            { correctValue: 'Nightly full only', options: ['Synchronous replication with point-in-time backups', 'Nightly full with hourly incrementals', 'Nightly full only', 'Write-once immutable media', 'No protection required'] },
                            { correctValue: 'Warm site', options: ['Hot site', 'Warm site', 'Cold site', 'No recovery site'] }]
                    },
                    {
                        label: 'Seven-year regulatory archive \u00b7 written once, never modified \u00b7 RTO 30 days', fields: [
                            { correctValue: 'Write-once immutable media', options: ['Synchronous replication with point-in-time backups', 'Nightly full with hourly incrementals', 'Nightly full only', 'Write-once immutable media', 'No protection required'] },
                            { correctValue: 'Cold site', options: ['Hot site', 'Warm site', 'Cold site', 'No recovery site'] }]
                    },
                    {
                        label: 'Developer sandbox \u00b7 holds no data the build pipeline does not generate \u00b7 no stated RTO', fields: [
                            { correctValue: 'No protection required', options: ['Synchronous replication with point-in-time backups', 'Nightly full with hourly incrementals', 'Nightly full only', 'Write-once immutable media', 'No protection required'] },
                            { correctValue: 'No recovery site', options: ['Hot site', 'Warm site', 'Cold site', 'No recovery site'] }]
                    },
                ],
            }
        },
    }),

    q({
        id: 'ft-policylayers',
        domain: D.concepts, difficulty: 'hard', bloomLevel: 'Analyze',
        conceptKeys: ['deny-overrides-allow', 'silence-is-not-allow', 'guardrail-policy', 'resource-policy'],
        scenarioType: 'evaluation-table',
        // The rule the candidate is being tested on — explicit deny wins, and
        // silence is not an allow — is withheld. Only the structural fact that
        // both layers must allow is given, because without it the model is
        // ambiguous rather than hard.
        stem: 'An object store evaluates three policy layers on every request: a role policy attached to the caller, a resource policy attached to the bucket, and an organisation-wide guardrail above both. Each layer may allow the action, deny it explicitly, or say nothing about it, and a request needs an allow from both the role policy and the resource policy. Give the result of each request and the layer that decided it.',
        explanation: 'Two rules settle every row, and neither is stated for you. The first is that an explicit deny anywhere ends the evaluation no matter how many allows sit beneath it, which is the entire reason organisation-wide guardrails are written as denies rather than as narrowed allows — the out-of-region read has two valid allows and the guardrail still wins. The second is that a layer saying nothing is not a layer saying yes. The write with a silent resource policy is the row candidates most often get backwards: nothing denied that write, and it fails anyway, because it never collected the second allow it needed. The read with a silent role policy fails the same way from the other side, and it is the more tempting of the two, since the resource policy names this principal explicitly and being named by name feels decisive. It is not — naming a principal in a resource policy supplies the resource half and only the resource half. The legal-hold delete looks like a contradiction and is not one: the same resource policy allows delete and denies delete on objects under hold, and because explicit deny is evaluated ahead of any allow, the allow is never reached. The last row is the control that proves the guardrail was read rather than pattern-matched. Its guardrail carries a deny, so a candidate skimming for the word denies marks it refused; but the deny covers writes and the request is a read, so it never matches and both required allows are present.',
        pbqConfig: {
            pbqType: 'fill-table', fillTable: {
                columns: ['Result', 'Deciding layer'],
                rows: [
                    {
                        label: 'Read \u00b7 role allows \u00b7 bucket allows \u00b7 guardrail silent', fields: [
                            { correctValue: 'Allowed', options: ['Allowed', 'Denied'] },
                            { correctValue: 'Both layers allow and nothing denies', options: ['Both layers allow and nothing denies', 'Explicit deny in the guardrail', 'Explicit deny in the resource policy', 'No allow at the role layer', 'No allow at the resource layer'] }]
                    },
                    {
                        label: 'Read from an unapproved region \u00b7 role allows \u00b7 bucket allows \u00b7 guardrail denies out-of-region', fields: [
                            { correctValue: 'Denied', options: ['Allowed', 'Denied'] },
                            { correctValue: 'Explicit deny in the guardrail', options: ['Both layers allow and nothing denies', 'Explicit deny in the guardrail', 'Explicit deny in the resource policy', 'No allow at the role layer', 'No allow at the resource layer'] }]
                    },
                    {
                        label: 'Write \u00b7 role allows \u00b7 bucket silent \u00b7 guardrail silent', fields: [
                            { correctValue: 'Denied', options: ['Allowed', 'Denied'] },
                            { correctValue: 'No allow at the resource layer', options: ['Both layers allow and nothing denies', 'Explicit deny in the guardrail', 'Explicit deny in the resource policy', 'No allow at the role layer', 'No allow at the resource layer'] }]
                    },
                    {
                        label: 'Read \u00b7 role silent \u00b7 bucket allows this principal by name \u00b7 guardrail silent', fields: [
                            { correctValue: 'Denied', options: ['Allowed', 'Denied'] },
                            { correctValue: 'No allow at the role layer', options: ['Both layers allow and nothing denies', 'Explicit deny in the guardrail', 'Explicit deny in the resource policy', 'No allow at the role layer', 'No allow at the resource layer'] }]
                    },
                    {
                        label: 'Delete an object under legal hold \u00b7 role allows \u00b7 bucket allows delete but denies delete under hold', fields: [
                            { correctValue: 'Denied', options: ['Allowed', 'Denied'] },
                            { correctValue: 'Explicit deny in the resource policy', options: ['Both layers allow and nothing denies', 'Explicit deny in the guardrail', 'Explicit deny in the resource policy', 'No allow at the role layer', 'No allow at the resource layer'] }]
                    },
                    {
                        label: 'Read \u00b7 role allows \u00b7 bucket allows \u00b7 guardrail denies writes only', fields: [
                            { correctValue: 'Allowed', options: ['Allowed', 'Denied'] },
                            { correctValue: 'Both layers allow and nothing denies', options: ['Both layers allow and nothing denies', 'Explicit deny in the guardrail', 'Explicit deny in the resource policy', 'No allow at the role layer', 'No allow at the resource layer'] }]
                    },
                ],
            }
        },
    }),

    q({
        id: 'ft-accessreview',
        domain: D.gov, difficulty: 'hard', bloomLevel: 'Evaluate',
        conceptKeys: ['access-review', 'condition-versus-remedy', 'compensating-controls', 'over-revocation'],
        scenarioType: 'review-findings-table',
        // The drag-drop version of this question was cut: it was the same
        // material a second time, and it was term-to-definition matching in a
        // drag-drop costume. What survives is the part that needs judgement —
        // two rows share a condition and take opposite actions.
        stem: 'Six entries came out of a quarterly access review, each with the evidence the reviewer recorded. Give the condition each one represents and the action it warrants. Two entries meet the same condition and do not warrant the same action.',
        explanation: 'The condition follows from the evidence and the action does not follow from the condition, which is what the two credential rows demonstrate. Both fail the same age rule: a secret last set in 2019 on a standard that requires annual rotation. The service account is a live exposure — it carries interactive logon rights and no second factor, so a credential nobody has touched in years can be used to sign in at a console, which is the ordinary way service accounts become footholds; rotating the secret without removing interactive logon fixes half of it. The break-glass account meets the same condition and is behaving exactly as designed: sealed, unused, and alerting on every logon, which are compensating controls that already address what rotation is meant to address, and rotating it on schedule mostly creates opportunities to lose the sealed copy. Recording why it stands is the correct output. The rest are decided by the evidence in front of them. Entitlements from a prior role are removed surgically, not by removing the account, which is still in use. Four technicians behind one login is an attribution failure before it is an access failure — the log can prove noc_shift acted and can never prove which of the four acted, and no amount of password rotation changes that; named accounts do. One person able to create a vendor record and approve payments to that vendor holds each half legitimately and the combination not at all, so the transaction is split rather than the person demoted. The last row is the one that tests restraint: the groups match the role definition and the previous review was clean, so a reviewer revoking something to look thorough breaks a working role and teaches the business to stop cooperating.',
        pbqConfig: {
            pbqType: 'fill-table', fillTable: {
                columns: ['Condition', 'Action'],
                rows: [
                    {
                        label: 'Moved helpdesk \u2192 payroll in 2024; holds Helpdesk Admins and Payroll Approvers', fields: [
                            { correctValue: 'Entitlements retained from a prior role', options: ['Entitlements retained from a prior role', 'Credential older than the standard permits', 'One login used by several people', 'One person can complete a transaction alone', 'Entitlement matches the role definition'] },
                            { correctValue: 'Remove the entitlements from the prior role', options: ['Remove the entitlements from the prior role', 'Rotate the secret and remove interactive logon', 'Replace with named individual accounts', 'Split the transaction across two approvers', 'Retain unchanged and record the justification'] }]
                    },
                    {
                        label: 'svc_etl \u00b7 interactive logon rights \u00b7 password last set 2019 \u00b7 no second factor', fields: [
                            { correctValue: 'Credential older than the standard permits', options: ['Entitlements retained from a prior role', 'Credential older than the standard permits', 'One login used by several people', 'One person can complete a transaction alone', 'Entitlement matches the role definition'] },
                            { correctValue: 'Rotate the secret and remove interactive logon', options: ['Remove the entitlements from the prior role', 'Rotate the secret and remove interactive logon', 'Replace with named individual accounts', 'Split the transaction across two approvers', 'Retain unchanged and record the justification'] }]
                    },
                    {
                        label: 'Break-glass administrator \u00b7 password last set 2019 \u00b7 credential sealed in the safe \u00b7 never used \u00b7 every logon alerts', fields: [
                            { correctValue: 'Credential older than the standard permits', options: ['Entitlements retained from a prior role', 'Credential older than the standard permits', 'One login used by several people', 'One person can complete a transaction alone', 'Entitlement matches the role definition'] },
                            { correctValue: 'Retain unchanged and record the justification', options: ['Remove the entitlements from the prior role', 'Rotate the secret and remove interactive logon', 'Replace with named individual accounts', 'Split the transaction across two approvers', 'Retain unchanged and record the justification'] }]
                    },
                    {
                        label: 'noc_shift \u00b7 four technicians sign in with it \u00b7 one identity for every night action', fields: [
                            { correctValue: 'One login used by several people', options: ['Entitlements retained from a prior role', 'Credential older than the standard permits', 'One login used by several people', 'One person can complete a transaction alone', 'Entitlement matches the role definition'] },
                            { correctValue: 'Replace with named individual accounts', options: ['Remove the entitlements from the prior role', 'Rotate the secret and remove interactive logon', 'Replace with named individual accounts', 'Split the transaction across two approvers', 'Retain unchanged and record the justification'] }]
                    },
                    {
                        label: 'An analyst can create a vendor record and approve payments to that vendor', fields: [
                            { correctValue: 'One person can complete a transaction alone', options: ['Entitlements retained from a prior role', 'Credential older than the standard permits', 'One login used by several people', 'One person can complete a transaction alone', 'Entitlement matches the role definition'] },
                            { correctValue: 'Split the transaction across two approvers', options: ['Remove the entitlements from the prior role', 'Rotate the secret and remove interactive logon', 'Replace with named individual accounts', 'Split the transaction across two approvers', 'Retain unchanged and record the justification'] }]
                    },
                    {
                        label: 'Finance analyst \u00b7 groups match the role definition \u00b7 previous review clean', fields: [
                            { correctValue: 'Entitlement matches the role definition', options: ['Entitlements retained from a prior role', 'Credential older than the standard permits', 'One login used by several people', 'One person can complete a transaction alone', 'Entitlement matches the role definition'] },
                            { correctValue: 'Retain unchanged and record the justification', options: ['Remove the entitlements from the prior role', 'Rotate the secret and remove interactive logon', 'Replace with named individual accounts', 'Split the transaction across two approvers', 'Retain unchanged and record the justification'] }]
                    },
                ],
            }
        },
    }),

    // ═════════════ COMMAND (6) ═════════════
    //
    // Every scenario states the GOAL and never the method — the previous set
    // put the diagnosis in the scenario field, which renders directly above
    // the terminal, so the candidate read the answer and then typed it. Every
    // question accepts at least two genuinely different binaries, so choosing
    // the instrument is part of what is graded, and the variants practitioners
    // actually type are accepted rather than one blessed spelling.

    q({
        id: 'cmd-evidence-pair',
        domain: D.ops, difficulty: 'medium', bloomLevel: 'Apply',
        conceptKeys: ['own-address-and-mask', 'reachability-test', 'two-step-evidence'],
        scenarioType: 'evidence-production',
        // The closest our engine gets to demosim's scored ipconfig-and-ping:
        // two pieces of evidence, either order accepted, tool of your choosing.
        stem: 'A monitoring agent on a Linux application server stopped reporting to its collector at 203.0.113.40 after last night\u2019s network change. Other servers in the same rack still report. You have a shell on the affected server, and the network team will not look at it until you can tell them where this host sits and whether it can reach the collector at all.',
        explanation: 'Neither piece of evidence is worth much without the other, which is the entire lesson of CompTIA\u2019s own example simulation: one workstation\u2019s address is a number, and the same number held against a working workstation\u2019s address is a diagnosis. The address and mask tell you which subnet this host believes it is on, and that is where last night\u2019s change is most likely to have landed — a host that came back with an address in the wrong scope, or the right address with a mask a bit longer than it was, is reachable from some places and not others, and looks nothing like a broken agent. The reachability test tells you whether packets to the collector are answered, and it is meaningful only alongside the address, because a timeout from a host in the wrong subnet and a timeout from a host in the right one point at completely different teams. Either order scores, since neither result changes what the other command should be. Two things practitioners reach for do not settle this. Restarting the agent tests a hypothesis the evidence has not yet supported and destroys the failing state if it happens to work. Reading the collector\u2019s own logs answers whether data arrived, which you already know it did not, and says nothing about why. Note also what a silent reachability test does not prove: plenty of correctly working hosts drop ICMP by policy, so a timeout narrows the field rather than closing it, and the address is what tells you which direction to narrow in.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'analyst@host:~$',
                scenario: 'Produce two pieces of evidence for the network team: where this host sits on the network, and whether the collector at 203.0.113.40 answers it. Two commands, in whichever order you prefer.',
                acceptedCommands: (() => {
                    const addr = ['ip addr', 'ip a', 'ip addr show', 'ip -4 addr', 'ip -4 addr show', 'ifconfig', 'ifconfig -a'];
                    const reach = ['ping -c 4 203.0.113.40', 'ping -c4 203.0.113.40', 'ping -c 3 203.0.113.40', 'ping 203.0.113.40'];
                    return [...seqProduct(addr, reach), ...seqProduct(reach, addr)];
                })(),
                hints: ['Two commands, one per line. The network team wants both facts, not a conclusion.'],
            }
        },
    }),

    q({
        id: 'cmd-resolver',
        domain: D.ops, difficulty: 'medium', bloomLevel: 'Apply',
        conceptKeys: ['resolver-comparison', 'dns-as-a-variable', 'split-horizon'],
        scenarioType: 'evidence-production',
        // host(1) is an accepted tool and "host" is also the ordinary word for
        // the machine you are sitting on. The scenario uses only the second
        // sense ("the resolver this host is configured to use") and names no
        // instrument.
        leakAllow: ['host'],
        stem: 'Users on the third floor cannot load the partner portal; users on the second floor load it without trouble. Both floors reach the rest of the internet and resolve internal names normally, and the third floor\u2019s browsers report a connection error rather than a certificate warning. You are on a third-floor host and nobody has touched a firewall yet.',
        explanation: 'The command exists to remove one variable, and the variable is the resolver itself. Asking the name of a resolver this host does not normally use produces an answer you can hold against what the failing floor gets from its own, and the comparison is the finding: matching answers rule name resolution out and justify moving to the path, while differing answers have already found it — an internal resolver handing out a stale or poisoned record, or a split-horizon zone answering one subnet differently from another. dig, nslookup and host all do it, and which is installed varies by image, so the judgement graded here is naming a resolver explicitly rather than which binary you reach for. Running the lookup with no resolver named is the reflex and wastes the test, because the host then asks the same server that may itself be the fault and confirms nothing whichever way it comes back. Pinging the portal is weaker still: a failed ping folds name resolution, routing and ICMP policy into a single result, and plenty of correctly working sites answer no ICMP at all, so the outcome is ambiguous in both directions. Opening the site in a browser is the weakest of the three, since a browser may be using a proxy, a cached record or its own encrypted resolver, none of which is what the rest of the floor is doing.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'analyst@host:~$',
                scenario: 'Obtain an answer for www.partner-example.com that does not depend on the resolver this host is configured to use, so it can be compared with what the floor is getting. One command.',
                acceptedCommands: (() => {
                    const servers = ['8.8.8.8', '1.1.1.1', '9.9.9.9'];
                    const out = [];
                    for (const s of servers) {
                        out.push(seq(`dig @${s} www.partner-example.com`));
                        out.push(seq(`dig @${s} www.partner-example.com a`));
                        out.push(seq(`dig @${s} a www.partner-example.com`));
                        out.push(seq(`dig +short @${s} www.partner-example.com`));
                        out.push(seq(`dig @${s} +short www.partner-example.com`));
                        out.push(seq(`nslookup www.partner-example.com ${s}`));
                        out.push(seq(`nslookup -type=a www.partner-example.com ${s}`));
                        out.push(seq(`host www.partner-example.com ${s}`));
                        out.push(seq(`host -t a www.partner-example.com ${s}`));
                    }
                    return out;
                })(),
                hints: ['Name a resolver of your own choosing that this host would not otherwise ask — any of the well-known public ones will do.'],
            }
        },
    }),

    q({
        id: 'cmd-servedcert',
        domain: D.concepts, difficulty: 'hard', bloomLevel: 'Apply',
        conceptKeys: ['sni-virtual-hosting', 'served-versus-installed', 'browser-chain-repair'],
        scenarioType: 'evidence-production',
        stem: 'A monitoring check reports a certificate name mismatch on portal.example.com, and the certificate the operations team uploaded has the right name on it. The host answers on an address shared with several other sites, and the site loads without complaint in the operations team\u2019s browser.',
        explanation: 'What a server is configured to send and what it actually sends to a given client are different facts, and on a shared address they part company for a specific reason. A TLS client has to say which site it wants in the Server Name Indication field of the handshake; a client that omits it gets whatever the default virtual host serves, which on a shared address is somebody else\u2019s certificate. That is the commonest cause of exactly this report — a probe that does not send SNI, or a virtual host that was never bound — and any tool that reaches the server as a normal client would will show it. openssl s_client is the usual instrument and needs the hostname supplied explicitly with -servername, since -connect alone opens the socket without setting the field, which reproduces the monitoring check\u2019s confusion rather than resolving it; -showcerts extends the output to every certificate sent, which is how a missing intermediate is told apart from a wrong leaf. curl in verbose mode sends SNI on its own and prints the server certificate it was given, which answers the question with less to get wrong. What does not answer it is the operations team\u2019s browser, and its clean padlock is the reason this ticket is open: browsers cache intermediates from earlier visits and repair incomplete chains through the certificate\u2019s AIA extension, so a browser can show a perfect result against a server that is misconfigured for every other client on the internet.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'analyst@host:~$',
                scenario: 'Retrieve what the server actually returns to a client asking for portal.example.com on port 443, so it can be compared with the certificate that was uploaded. One command.',
                acceptedCommands: (() => {
                    const host = 'portal.example.com';
                    const base = [
                        `openssl s_client -connect ${host}:443 -servername ${host}`,
                        `openssl s_client -servername ${host} -connect ${host}:443`,
                        `openssl s_client -connect ${host}:443 -servername ${host} -showcerts`,
                        `openssl s_client -servername ${host} -connect ${host}:443 -showcerts`,
                        `openssl s_client -showcerts -connect ${host}:443 -servername ${host}`,
                        `openssl s_client -showcerts -servername ${host} -connect ${host}:443`,
                        `openssl s_client -connect ${host}:443 -showcerts -servername ${host}`,
                    ];
                    const out = base.map((c) => seq(c));
                    // Practitioners close stdin so the handshake does not hang
                    // waiting for input. Both spellings are what people type,
                    // and scorePBQ is exact-match, so both are accepted.
                    for (const c of base) {
                        out.push(seq(`${c} < /dev/null`));
                        out.push(seq(`echo | ${c}`));
                        out.push(seq(`echo -n | ${c}`));
                    }
                    for (const c of [
                        `curl -v https://${host}`,
                        `curl -vI https://${host}`,
                        `curl -v --head https://${host}`,
                        `curl -vso /dev/null https://${host}`,
                        `gnutls-cli ${host}`,
                        `gnutls-cli --print-cert ${host}`,
                    ]) out.push(seq(c));
                    return out;
                })(),
                hints: ['Several sites answer on that address, so whatever you use has to tell the server which one you are asking for.'],
            }
        },
    }),

    q({
        id: 'cmd-localadmins',
        domain: D.ops, difficulty: 'medium', bloomLevel: 'Apply',
        conceptKeys: ['local-versus-directory-group', 'nested-group-membership', 'review-versus-reality'],
        scenarioType: 'evidence-production',
        // Get-LocalGroupMember takes a -Group flag, and "group" is also the
        // name of the object being asked about. Naming the object is the
        // question; naming the instrument would be the leak.
        leakAllow: ['group'],
        stem: 'An access review says three named people hold administrative rights on a Windows member server. The server was rebuilt by a contractor last year, and you do not trust a document to describe what is configured on the box.',
        explanation: 'A review records intent and the group records fact, and on a rebuilt server the two diverge in predictable ways. net localgroup administrators prints the membership from the command shell and Get-LocalGroupMember Administrators does the same from PowerShell with structured output; either is fine, and knowing that the answer lives in a local group rather than a directory one is the judgement being graded. Three things routinely appear there that no review shows. A domain group nested inside the local group grants administrative rights to every one of its members while none of them appears as a named administrator anywhere, and nesting is the usual reason the count in a review and the effective count disagree. A local account the contractor created for the build and never removed sits outside directory governance entirely, so it survives every joiner-mover-leaver process the organisation runs. Domain Admins added directly is expected on some builds and a finding on others, and only the local group can tell you which this is. Checking the membership of Domain Admins answers a different question at a different scope — a member server has its own local group, and membership there is what decides who can act on this machine, whatever the directory says about the wider estate.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'C:\\Users\\analyst>',
                scenario: 'Produce the current membership of this server\u2019s own local Administrators group. One command.',
                acceptedCommands: [
                    seq('net localgroup administrators'),
                    seq('net localgroup "administrators"'),
                    seq('net localgroup administrators /domain'.replace(' /domain', '')),
                    seq('get-localgroupmember administrators'),
                    seq('get-localgroupmember -group administrators'),
                    seq('get-localgroupmember -name administrators'),
                    seq('get-localgroupmember "administrators"'),
                    seq('get-localgroupmember -group "administrators"'),
                    seq('get-localgroupmember -name "administrators"'),
                ].filter((s, i, all) => all.findIndex((x) => x.steps.join('\u0000').toLowerCase() === s.steps.join('\u0000').toLowerCase()) === i),
                hints: ['The group that decides this is local to the machine, not one held in the directory.'],
            }
        },
    }),

    q({
        id: 'cmd-credentialage',
        domain: D.gov, difficulty: 'medium', bloomLevel: 'Apply',
        conceptKeys: ['credential-rotation-evidence', 'shadow-file-ageing', 'audit-evidence-versus-assertion'],
        scenarioType: 'evidence-production',
        stem: 'The standard requires every credential to be rotated at least annually. An auditor has asked for proof that the local service account svc_deploy complies, and because the account is not managed by the directory, the directory\u2019s report does not cover it. You have a shell on the host.',
        explanation: 'The distinction being graded is between evidence and assertion. "We rotate annually" is a claim; the date the password was last set is the fact that confirms or refutes it, and it lives on the host in the shadow file rather than in any report. chage -l svc_deploy prints that date along with the minimum and maximum age, the warning period and the account and password expiry dates, which is everything the auditor asked for and a little more. passwd -S svc_deploy is a narrower answer from a different binary that still carries the last-change date and the ageing fields, so it answers the question with less detail. Either is defensible, which is the point: the judgement is knowing which fact settles the control, not memorising one tool. Reading /etc/passwd is the common wrong turn and returns nothing useful, because it has held no password information on any modern system for decades — only an x placeholder, since the hashes and the ageing data were moved to /etc/shadow precisely so they would not be world-readable. Checking the last login answers a different question again: an account can be used every day of the week on a password set five years ago, and it is the password age rather than the login age that this control is about.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'analyst@host:~$',
                scenario: 'Produce, from this host, the evidence the auditor needs in order to decide whether svc_deploy meets that requirement. One command.',
                acceptedCommands: [
                    seq('chage -l svc_deploy'),
                    seq('chage --list svc_deploy'),
                    seq('sudo chage -l svc_deploy'),
                    seq('sudo chage --list svc_deploy'),
                    seq('passwd -S svc_deploy'),
                    seq('passwd --status svc_deploy'),
                    seq('sudo passwd -S svc_deploy'),
                    seq('sudo passwd --status svc_deploy'),
                ],
                hints: ['The fact that settles it is kept per account on this host, not in the directory report.'],
            }
        },
    }),

    q({
        id: 'cmd-arp',
        domain: D.threats, difficulty: 'hard', bloomLevel: 'Apply',
        conceptKeys: ['on-path-attack', 'arp-cache-evidence', 'layer-two-evidence'],
        scenarioType: 'evidence-production',
        stem: 'Two workstations on one segment report that an internal HTTPS service intermittently presents a certificate signed by an authority nothing in the estate uses. The service itself has not changed and its certificate is untouched. You are on a third workstation on that same segment; the gateway is 10.10.40.1.',
        explanation: 'A certificate that changes depending on who is asking, on a service whose own certificate has not changed, means something is answering in the middle, and the segment\u2019s layer-two mapping is where that shows. arp -a and ip neigh both print what this host currently believes about which hardware address holds which local address, and either answers the question — the judgement graded here is knowing that the evidence lives at layer two rather than in the service\u2019s own logs. What you are reading the output for is a collision: two different addresses, typically the gateway and one other host, resolving to the same hardware address. That is one machine answering for both, which is the position required to terminate TLS in the middle and present a certificate of its own choosing, and it explains the intermittency, since a poisoned entry ages out and is replaced by whichever answer arrives next. The service\u2019s own logs cannot show any of this, because from its point of view a client connected and everything was normal. Reading the certificate from the affected workstations tells you it is untrusted, which they have already reported, and identifies the issuer without identifying the machine presenting it. The cache is also perishable in a way that matters: entries expire in minutes, so a mapping captured while the fault is live is evidence that no longer exists an hour later.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'analyst@host:~$',
                scenario: 'From this workstation, produce the current mapping of local addresses to hardware addresses as this host has learned them. One command.',
                acceptedCommands: [
                    seq('arp -a'),
                    seq('arp -n'),
                    seq('arp -an'),
                    seq('arp -e'),
                    seq('ip neigh'),
                    seq('ip neigh show'),
                    seq('ip neighbor'),
                    seq('ip neighbor show'),
                    seq('ip neighbour show'),
                    seq('ip -4 neigh show'),
                ],
                hints: ['The mapping you want is one this host has already learned and cached; it expires in minutes.'],
            }
        },
    }),
];

/* ═══════════════════════════════════════════════════════════════════
   De-correlation
   ═══════════════════════════════════════════════════════════════════
   PBQQuestion.tsx now shuffles at render, but the seed file itself must not
   be readable as an answer key: anyone with the JSON — or the Firestore
   document — could otherwise recover 32% of the marks from the ordering
   alone, as the previous set could. Deterministic so the build is
   reproducible, and re-seeded until the ordering carries no signal. */

function hash32(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
}
function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function shuffledWith(arr, seedStr) {
    const rnd = mulberry32(hash32(seedStr));
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** True when the item order is readable as the zone order — the exact leak
 *  that made DD0, DD1 and DD2 free in the previous set. Monotone covers both
 *  "listed in zone order" and its reverse; the adjacency cap covers
 *  block-listing, where items arrive grouped by zone without being sorted. */
function itemOrderLeaks(items, zones) {
    const idx = items.map((it) => zones.findIndex((z) => z.id === it.correctZone));
    const nonDecreasing = idx.every((v, i) => i === 0 || idx[i - 1] <= v);
    const nonIncreasing = idx.every((v, i) => i === 0 || idx[i - 1] >= v);
    if (nonDecreasing || nonIncreasing) return true;
    let adjacentSame = 0;
    for (let i = 1; i < idx.length; i++) if (idx[i] === idx[i - 1]) adjacentSame++;
    if (adjacentSame > 1) return true;
    // The first item pointing at the first zone is the tell a reader checks.
    return idx[0] === 0;
}

/** True when the correct answers can be read off the option positions:
 *  a perfect diagonal (correct option index === row index), a column where
 *  the correct option always sits in the same slot, or a later column whose
 *  index tracks the first column's row by row. All three were live in the
 *  previous set — FT14 and FT16 were exact diagonals, 18 free marks. */
function optionOrderLeaks(rows, colCount) {
    const idxOf = (r, c) => rows[r].fields[c].options.indexOf(rows[r].fields[c].correctValue);
    for (let c = 0; c < colCount; c++) {
        const col = rows.map((_, r) => idxOf(r, c));
        if (col.every((v, r) => v === r)) return true;
        if (col.every((v) => v === col[0])) return true;
        if (c > 0) {
            const first = rows.map((_, r) => idxOf(r, 0));
            if (col.every((v, r) => v === first[r])) return true;
        }
    }
    return false;
}

function decorrelate(qs) {
    for (const item of qs) {
        const cfg = item.pbqConfig;
        if (cfg.pbqType === 'drag-drop') {
            const dd = cfg.dragDrop;
            let done = false;
            for (let n = 0; n < 500 && !done; n++) {
                const zones = shuffledWith(dd.zones, `${item.id}|zones|${n}`);
                const items = shuffledWith(dd.items, `${item.id}|items|${n}`);
                if (!itemOrderLeaks(items, zones)) { dd.zones = zones; dd.items = items; done = true; }
            }
            if (!done) throw new Error(`${item.id}: could not de-correlate drag-drop order in 500 attempts`);
        }
        if (cfg.pbqType === 'fill-table') {
            const ft = cfg.fillTable;
            const original = ft.rows.map((r) => r.fields.map((f) => f.options.slice()));
            let done = false;
            for (let n = 0; n < 500 && !done; n++) {
                ft.rows.forEach((row, ri) => {
                    row.fields.forEach((f, ci) => {
                        f.options = shuffledWith(original[ri][ci], `${item.id}|r${ri}|c${ci}|${n}`);
                    });
                });
                if (!optionOrderLeaks(ft.rows, ft.columns.length)) done = true;
            }
            if (!done) throw new Error(`${item.id}: could not de-correlate fill-table options in 500 attempts`);
        }
    }
}

/* ═══════════════════════════════════════════════════════════════════
   Build-time gates
   ═══════════════════════════════════════════════════════════════════ */

const fail = (msg) => { console.error('  BUILD FAILED: ' + msg); process.exitCode = 1; };

/** The previous set shipped an access-review drag-drop and an access-review
 *  fill-table that keyed the same three conditions off the same four
 *  technicians on the same shared login. The 5-gram check reported 1.0%
 *  overlap because it measures wording, and it only ran against the OLD file
 *  — never pairwise within the new one. Both gaps are closed: declared
 *  concept keys here, content-derived overlap in the loader. */
function checkConceptOverlap(qs) {
    for (let i = 0; i < qs.length; i++) {
        for (let j = i + 1; j < qs.length; j++) {
            const a = new Set(qs[i].conceptKeys);
            const shared = qs[j].conceptKeys.filter((k) => a.has(k));
            if (shared.length >= 2) {
                fail(`${qs[i].id} and ${qs[j].id} share concept keys: ${shared.join(', ')}`);
            }
            if (shared.length === 1 && qs[i].scenarioType === qs[j].scenarioType) {
                fail(`${qs[i].id} and ${qs[j].id} share scenarioType "${qs[i].scenarioType}" and concept "${shared[0]}"`);
            }
        }
    }
}

/** The scenario renders directly above the terminal at PBQQuestion.tsx:586.
 *  If it names the tool or a flag, the question has already been answered
 *  before the candidate reaches the prompt. */
/** The binary a command actually runs: the last pipe segment (so
 *  `echo | openssl s_client` is openssl, not echo), minus sudo and any
 *  leading flag, with trailing version digits stripped so gpg/gpg2 does not
 *  masquerade as a choice of tool. */
function primaryBinary(cmd) {
    const seg = cmd.toLowerCase().split('|').pop().trim();
    const tok = seg.split(/\s+/).filter((t) => t && t !== 'sudo' && !t.startsWith('-'));
    return (tok[0] || '').replace(/\d+$/, '');
}

function checkScenarioLeaks(qs) {
    for (const item of qs) {
        if (item.pbqConfig.pbqType !== 'command') continue;
        const c = item.pbqConfig.command;
        const seqs = c.acceptedCommands.map((s) => (Array.isArray(s) ? s : s.steps));
        const words = new Set();
        for (const s of seqs) {
            for (const cmd of s) {
                for (const tok of cmd.toLowerCase().split(/\s+/)) {
                    if (tok.startsWith('-') && tok.length > 1) words.add(tok.replace(/^-+/, ''));
                }
                words.add(primaryBinary(cmd));
            }
        }
        const haystack = (c.scenario + ' ' + (c.hints || []).join(' ')).toLowerCase();
        const allowed = new Set((item.leakAllow || []).map((w) => w.toLowerCase()));
        for (const w of words) {
            if (w.length < 3) continue;
            // A handful of tool and flag names are also ordinary English. The
            // exemption is per question and has to be justified where it is
            // declared, so silencing the gate is a visible act in the diff.
            if (allowed.has(w)) continue;
            if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack)) {
                fail(`${item.id}: scenario or hint contains "${w}", which appears in its own accepted commands`);
            }
        }
        const bins = new Set(seqs.flat().map(primaryBinary));
        if (bins.size < 2) {
            fail(`${item.id}: only one plausible tool (${[...bins].join(', ')}) — the tool choice has to be part of the judgement`);
        }
    }
}

/* ═══════════════════════════════════════════════════════════════════
   The FT-ACL ruleset is checked against a first-match evaluator, so every
   claim in its explanation is verified rather than asserted.
   ═══════════════════════════════════════════════════════════════════ */
function verifyAclClaims() {
    const ip2n = (s) => s.split('.').reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
    const inCidr = (ip, cidr) => {
        if (cidr === 'any') return true;
        const [net, bits] = cidr.split('/');
        const mask = bits === '0' ? 0 : (0xFFFFFFFF << (32 - Number(bits))) >>> 0;
        return ((ip2n(ip) & mask) >>> 0) === ((ip2n(net) & mask) >>> 0);
    };
    const RULES = [
        { n: 1, act: 'deny', src: 'any', dst: '172.16.30.0/24', proto: 'icmp', ports: null },
        { n: 2, act: 'permit', src: '172.16.20.0/24', dst: '172.16.30.0/24', proto: 'any', ports: null },
        { n: 3, act: 'deny', src: '172.16.20.0/24', dst: '172.16.30.0/24', proto: 'tcp', ports: [3389] },
        { n: 4, act: 'deny', src: '172.16.20.192/26', dst: 'any', proto: 'any', ports: null },
        { n: 5, act: 'deny', src: '172.16.20.0/24', dst: 'any', proto: 'tcp', ports: [22, 3389] },
        { n: 6, act: 'deny', src: '172.16.20.0/24', dst: 'any', proto: 'udp', ports: [161] },
        { n: 7, act: 'permit', src: '172.16.20.0/24', dst: 'any', proto: 'any', ports: null },
        { n: 8, act: 'deny', src: 'any', dst: 'any', proto: 'any', ports: null },
    ];
    const evaluate = (rules, src, dst, proto, port) => {
        for (const r of rules) {
            if (!inCidr(src, r.src) || !inCidr(dst, r.dst)) continue;
            if (r.proto !== 'any' && r.proto !== proto) continue;
            if (r.ports && !r.ports.includes(port)) continue;
            return { act: r.act, by: r.n };
        }
        return { act: 'deny', by: 'implicit' };
    };
    const without = (n) => RULES.filter((r) => r.n !== n);
    const probes = {
        brokenWeb: ['172.16.20.196', '203.0.113.9', 'tcp', 443],
        workingWeb: ['172.16.20.20', '203.0.113.9', 'tcp', 443],
        brokenIntranet: ['172.16.20.196', '172.16.30.20', 'tcp', 80],
        workingIntranet: ['172.16.20.20', '172.16.30.20', 'tcp', 80],
        workingRdpServer: ['172.16.20.20', '172.16.30.20', 'tcp', 3389],
        workingSsh: ['172.16.20.20', '203.0.113.9', 'tcp', 22],
        workingSnmp: ['172.16.20.20', '203.0.113.9', 'udp', 161],
        workingPingServer: ['172.16.20.20', '172.16.30.20', 'icmp', 0],
    };
    const run = (rules, p) => evaluate(rules, ...probes[p]).act;
    const assert = (cond, msg) => { if (!cond) fail(`ACL model: ${msg}`); };

    // The stem's symptom pattern has to be what the ruleset actually produces.
    assert(run(RULES, 'brokenWeb') === 'deny', '.196 should fail to browse');
    assert(run(RULES, 'workingWeb') === 'permit', '.20 should browse');
    assert(run(RULES, 'brokenIntranet') === 'permit', '.196 should reach the intranet');
    assert(run(RULES, 'workingIntranet') === 'permit', '.20 should reach the intranet');
    // Line 4 removed restores the failing laptop and nothing else.
    assert(run(without(4), 'brokenWeb') === 'permit', 'removing 4 should restore .196');
    assert(evaluate(without(4), '172.16.20.196', '203.0.113.9', 'tcp', 22).act === 'deny', 'removing 4 must not hand .196 outbound SSH');
    // Line 3 is shadowed by line 2: removing it changes nothing.
    assert(run(RULES, 'workingRdpServer') === 'permit', 'line 3 is shadowed today');
    assert(run(without(3), 'workingRdpServer') === 'permit', 'removing 3 changes nothing');
    // Lines 1, 5, 6 sit above the broad permit, so removing any opens traffic.
    assert(run(RULES, 'workingPingServer') === 'deny' && run(without(1), 'workingPingServer') === 'permit', 'removing 1 opens ICMP');
    assert(run(RULES, 'workingSsh') === 'deny' && run(without(5), 'workingSsh') === 'permit', 'removing 5 opens SSH');
    assert(run(RULES, 'workingSnmp') === 'deny' && run(without(6), 'workingSnmp') === 'permit', 'removing 6 opens SNMP');
    // Lines 2 and 7 carry traffic that works today.
    assert(run(without(2), 'brokenIntranet') === 'deny', 'removing 2 breaks the intranet for .196');
    assert(run(without(7), 'workingWeb') === 'deny', 'removing 7 breaks browsing for the floor');
    // Line 8 is the explicit form of the implicit deny: no packet changes.
    for (const p of Object.keys(probes)) {
        assert(run(RULES, p) === run(without(8), p), `removing 8 changed ${p}, but the implicit deny should cover it`);
    }
}

/* ═══════════════════════════════════════════════════════════════════ */

decorrelate(questions);
checkConceptOverlap(questions);
checkScenarioLeaks(questions);
verifyAclClaims();

// conceptKeys and scenarioType are authoring metadata: they exist to make the
// overlap gate above possible and have no business in a Firestore document.
const emitted = questions.map(({ id, conceptKeys, scenarioType, leakAllow, ...rest }) => rest);

if (process.exitCode) {
    console.error('\n  Nothing written.\n');
    process.exit(1);
}

/* Items authored grouped by zone, and correct values left at the top of a
 * dropdown, make the seed an answer key even though the renderer shuffles.
 * Search for an arrangement a zero-knowledge candidate does worst against. */
questions.forEach((q, i) => {
    if (q.pbqConfig) q.pbqConfig = arrangeConfig(q.pbqConfig, `${SOURCE}:${i}`);
});
balanceOptionPositions(questions);

const out = {
    examId: EXAM_ID,
    examName: 'CompTIA Security+ (SY0-701)',
    source: SOURCE,
    authoredAt: '2026-08-29',
    note: 'Performance-based questions, second set. Not reviewed by a certified subject matter expert.',
    questions: emitted,
};

mkdirSync(join(HERE, 'seed'), { recursive: true });
writeFileSync(join(HERE, 'seed', 'security-plus-pbqs-v2.json'), JSON.stringify(out, null, 2), 'utf8');

const byType = {}, byDomain = {}, byDiff = {};
for (const x of emitted) {
    byType[x.pbqConfig.pbqType] = (byType[x.pbqConfig.pbqType] || 0) + 1;
    byDomain[x.domain] = (byDomain[x.domain] || 0) + 1;
    byDiff[x.difficulty] = (byDiff[x.difficulty] || 0) + 1;
}
const decisions = emitted.reduce((n, x) => {
    const c = x.pbqConfig;
    if (c.pbqType === 'drag-drop') return n + c.dragDrop.items.length;
    if (c.pbqType === 'order-steps') return n + c.orderSteps.steps.length;
    if (c.pbqType === 'fill-table') return n + c.fillTable.rows.reduce((m, r) => m + r.fields.length, 0);
    return n + 1;
}, 0);

console.log(`wrote ${emitted.length} PBQs -> seed/security-plus-pbqs-v2.json`);
console.log('by type:      ', byType);
console.log('by domain:    ', byDomain);
console.log('by difficulty:', byDiff);
console.log('independently scored decisions:', decisions);
console.log('shortest explanation:', Math.min(...emitted.map((x) => x.explanation.length)), 'chars');
