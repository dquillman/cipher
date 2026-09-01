/**
 * Authors the CompTIA A+ Core 2 (220-1202) PBQ set and writes
 * seed/a-plus-core2-pbqs.json. Content lives here rather than in raw JSON so
 * the reasoning stays readable and reviewable in a diff.
 *
 *   node build-aplus-core2-pbqs.mjs
 *
 * ── The bar these are written against ────────────────────────────
 * CompTIA's own example simulation (demosim.comptia.org) ships its answer key
 * in /api/SimulationInit. Read for real rather than paraphrased, it says:
 *
 *   workstation1: ipconfig -> 192.168.0.68/27, checkpoint "S1Workstation1"
 *   workstation2: ipconfig -> 192.168.0.82/27, checkpoint "S2Workstation2"
 *   router ACL:   ten lines, all ten initialised _keep: true, checkpoint "S3Firewall"
 *
 * Neither workstation address appears in the question. The question text is a
 * SYMPTOM PATTERN — "they can send internal Email, use the intranet, and print
 * on the local area network printer", only https://comptia.org fails — and the
 * instruction is "Check the IP addresses and test the connectivity to
 * comptia.org on each workstation. Use that information to ensure that the ACL
 * is properly configured... Only make changes to correct the connectivity
 * issue."
 *
 * So the candidate must GO AND GET the two addresses, notice that .82 falls
 * inside line 5's 192.168.0.80/28 deny while .68 does not, and remove exactly
 * that one line. Nine of the ten ACL lines are scored for being left alone.
 * Internal mail and the intranet keep working for the broken host because ACL
 * line 1 permits its subnet to the DMZ before line 5 is ever reached, and local
 * printing never crosses the router at all — which is why what WORKS is the
 * part that narrows the fault.
 *
 * Three rules follow from that, and every question here is held to them:
 *
 *   1. Withhold something. The candidate must interpret evidence rather than
 *      read a verdict printed in a row label. Where the renderer allows it —
 *      the command terminal — the act of gathering the evidence is itself the
 *      first scored step of the keyed answer.
 *   2. Score restraint. Every fill-table and drag-drop carries decisions whose
 *      correct answer is "leave it alone", because over-fixing is the failure
 *      mode the demosim spends nine of its fourteen checkpoints on.
 *   3. No free marks by elimination or by word association. An option list must
 *      never be a permutation of the rows: options are reused across rows, and
 *      several are never correct at all. The correct option must not echo the
 *      row's own noun.
 *
 * What the previous revision of this file got wrong, recorded so it cannot
 * recur (the lint pass at the bottom now fails the build on each of them):
 *
 *   • Every command PBQ was a single memorised string, and the `scenario` line
 *     — which PBQQuestion.tsx renders ABOVE the terminal, before the candidate
 *     types anything — stated the answer in English. `hints` restated it again.
 *     Six questions were free marks and their stems' evidence was decorative.
 *   • Four fill-tables were Latin squares: exactly as many distinct options as
 *     rows, each used once, so the last row was free. Several correct options
 *     echoed the row label's noun, so column two was not an independent
 *     decision.
 *   • Two drag-drops were bijections whose item text named its own zone in
 *     plain English — vocabulary sorts, not diagnosis.
 *   • The offboarding order-steps and the change-management order-steps each
 *     duplicated a question in another seed file AND contradicted its order.
 *     order-steps scores position-exactly, so a candidate who learned one
 *     scored near zero on the other. Both were replaced rather than reconciled.
 *
 * ── Encoding constraints (these are load-bearing) ────────────────
 *   • Firestore rejects an array stored directly inside another array at any
 *     depth, so every command sequence is wrapped as { steps: [...] }. This
 *     exact bug is why no PBQ existed in this product until recently.
 *   • fill-table: row.fields.length MUST equal columns.length. initPBQState
 *     sizes tableValues by columns.length, so a mismatch mis-scores silently.
 *     Every correctValue MUST appear in its own options array — which is why
 *     option pools below are named objects and correctValue references the
 *     object's own property rather than a retyped string literal.
 *   • drag-drop: every zone needs at least one item whose correctZone names it.
 *   • command: scorePBQ compares sequence LENGTH before contents, so every
 *     accepted sequence for one question must be the same length. cross()
 *     guarantees that by construction.
 *   • order-steps: steps are listed in CORRECT order; the app shuffles them.
 *   • The stem renders inside an <h2> with normal white-space handling, so
 *     newlines collapse. Command output quoted in a stem is written inline.
 *
 * These questions are NOT reviewed by a certified subject matter expert.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { arrangeConfig, balanceOptionPositions } from './pbq-leak.mjs';

const EXAM_ID = '12396VsKMFLnPMXivHKQ';
const SOURCE = 'authored-2026-08-aplus-pbq';

// Domain strings must match the existing bank byte for byte. Verified against
// functions/content-staging/a-plus-v15/*.json.
const D = {
    os: 'Operating Systems',
    sec: 'Security',
    swt: 'Software Troubleshooting',
    ops: 'Operational Procedures',
};

/**
 * Cross-product of command groups into accepted sequences.
 *
 * cross(['a','b'], ['c']) -> [{steps:['a','c']}, {steps:['b','c']}]
 *
 * Every sequence it emits is the same length, which is the one thing scorePBQ
 * checks before it compares contents. Group 1 is the investigative command,
 * group 2 (and 3) the acts. Accepting several spellings per group is deliberate:
 * CompTIA states outright that "There can be multiple ways to solve a question
 * or challenge posed in a PBQ. Scoring addresses different possible approaches."
 */
const cross = (...groups) =>
    groups.reduce((acc, g) => acc.flatMap((p) => g.map((x) => [...p, x])), [[]])
        .map((steps) => ({ steps }));

const q = (o) => ({
    examId: EXAM_ID, source: SOURCE, type: 'pbq',
    difficulty: 'medium', bloomLevel: 'Apply', ...o,
});

const opts = (o) => Object.values(o);

const questions = [

    // ═══════════════════════════════════════════════════════════════
    //  FILL-TABLE (6)
    //  Option pools are named objects so correctValue can never drift
    //  from its own options array. Every pool contains at least one
    //  option that is never correct, and at least one that is correct
    //  more than once, so no cell is free by elimination.
    // ═══════════════════════════════════════════════════════════════

    (() => {
        const ACCESS = {
            none: 'No access',
            read: 'Read only',
            rw: 'Read and write',
            full: 'Full control',
        };
        const FIX = {
            none: 'No change',
            share: 'Raise this group\u2019s share permission to Change',
            ntfs: 'Raise this group\u2019s NTFS permission to Modify',
            everyone: 'Grant Everyone Full Control on the share',
            deny: 'Remove the Deny entry',
            drop: 'Remove this group from the share',
        };
        const row = (label, console_, network, fix) => ({
            label, fields: [
                { correctValue: console_, options: opts(ACCESS) },
                { correctValue: network, options: opts(ACCESS) },
                { correctValue: fix, options: opts(FIX) },
            ]
        });
        return q({
            domain: D.sec, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Users of the Projects share on FS01 report that they can open a document over the network but cannot save it back. The same users sign in at the FS01 console, open the same document from D:\\Projects, and saving works normally. Nothing else on FS01 has changed. The server holds these entries. Share permissions on \\\\FS01\\Projects: Sales = Read; Engineering = Full Control; Auditors = Change; Temps = Change; svc_backup = Read. NTFS permissions on D:\\Projects: Sales = Modify; Engineering = Read; Auditors = Full Control; Temps = Modify; Interns = Deny Read; svc_backup = Full Control. Group membership: every member of Temps is also a member of Interns. Work out what each group can actually do in each place, then decide what \u2014 if anything \u2014 you would change to clear the reported tickets. Only change what the reported symptom requires.',
            explanation: 'The symptom pattern does two jobs here, and most candidates only use the first. Job one: the same user, the same file, works at the console and fails over the network. Only one mechanism behaves that way, because share permissions are evaluated ONLY when the folder is reached across the network and simply do not exist at the console, while NTFS permissions apply both ways. So the console column is the NTFS entry alone and the network column is the more restrictive of share and NTFS. Job two, and this is the part that decides the third column: the symptom identifies WHICH group is complaining. Sales has NTFS Modify behind a Read share, so they can save locally and only read remotely \u2014 that is the group generating the tickets, and the least change that clears it is raising the Sales share to Change. Engineering also cannot save, but Engineering fails in both places because NTFS caps them at Read, so Engineering does not match the reported symptom at all and is almost certainly configured that way on purpose; widening anything for Engineering is an unrequested change to a machine you were called to fix for someone else. Auditors already work in both places, capped at read and write remotely by the Change share, which is normal. Temps get nothing anywhere: an explicit Deny inherited through the Interns membership beats every allow from every other group, and it applies at the console too, which is why this is the one row where console and network agree on No access. svc_backup has Full Control on NTFS behind a Read share, which is exactly how a service account should be scoped and is not a fault. The tempting wrong move is the one that would clear the tickets fastest: grant Everyone Full Control on the share. It works, and in the same keystroke it hands every group whatever NTFS allows, including the ones nobody asked you to touch. Removing the Deny would also \u201cfix\u201d something, and would silently restore access to a group the organisation deliberately locked out.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['At the FS01 console', 'Over the network', 'Change you would make'],
                    rows: [
                        row('Sales', ACCESS.rw, ACCESS.read, FIX.share),
                        row('Engineering', ACCESS.read, ACCESS.read, FIX.none),
                        row('Auditors', ACCESS.full, ACCESS.rw, FIX.none),
                        row('Temps', ACCESS.none, ACCESS.none, FIX.none),
                        row('svc_backup', ACCESS.full, ACCESS.read, FIX.none),
                    ],
                }
            },
        });
    })(),

    (() => {
        const RISK = {
            ok: 'Nothing \u2014 this already meets policy',
            hw: 'Anyone who takes the hardware can read the stored data',
            unattended: 'A signed-in session left unattended in the field',
            elevate: 'Anything the user launches elevates without ever prompting',
            standing: 'A standing credential nobody can rotate or attribute',
            keyWithDisk: 'The key that unlocks the disk travels with the disk',
            unpatched: 'Known vulnerabilities stay open for months',
            lost: 'The device cannot be located or wiped if it is lost',
        };
        const ACT = {
            leave: 'Leave it as found',
            bench: 'Change it here, on the bench',
            escalate: 'Escalate \u2014 this one is not yours to change alone',
            defer: 'Record it and let the auditor decide in the field',
            refuse: 'Refuse to release the machine at all',
        };
        const row = (label, risk, act) => ({
            label, fields: [
                { correctValue: risk, options: opts(RISK) },
                { correctValue: act, options: opts(ACT) },
            ]
        });
        return q({
            domain: D.sec, difficulty: 'hard', bloomLevel: 'Evaluate',
            stem: 'A laptop goes out tomorrow to a field auditor who will carry patient records off site. Policy requires full-disk encryption with the recovery key escrowed to the directory, a screen lock no longer than 5 minutes, User Account Control at its shipped default, no day-to-day work from an account with administrative rights, and no shared credentials. You have the machine on the bench for 20 minutes. These are the seven findings from your check. For each, say what it actually puts at risk and what you do about it before the machine leaves. Changing a setting that already meets policy is not a neutral act \u2014 it is an unrequested change to a machine that is about to leave the building.',
            explanation: 'Two of these seven are already compliant, and the scored decision on those rows is to leave them alone. Deferring feature updates 30 days while quality updates install automatically is a normal, deliberate patching posture, and Defender Firewall on for all three profiles is the shipped state; a technician who "hardens" either one has spent the window making changes nobody asked for. Device encryption being off is not softened by the drive being self-encrypting \u2014 a self-encrypting drive whose vendor tool is disabled is doing no encryption at all, and capability is not the same as protection, so anyone holding the hardware reads the data. A 30-minute lock fails a 5-minute policy outright, and what it actually exposes is a signed-in session in a corridor, not the stored data. UAC at Never notify is the row most often waved through because a real business need produced it, but Never notify elevates every process the user launches without a prompt, which is precisely the condition malware needs; the fix is to restore the default and run the ERP installer elevated once, not to leave the machine permanently disarmed. Encryption being on while the 48-digit recovery key is printed and kept in the laptop bag is the row that looks compliant and is not: the escrow requirement exists so that the key and the disk are never in the same place, and a printout in the bag defeats it exactly as thoroughly as no encryption at all. The vendor support service is the one row you do not fix yourself. It is genuinely out of policy \u2014 one local administrator password shared across four sites cannot be rotated without breaking every site, and no log can attribute an action taken with it to a person \u2014 but ripping it out twenty minutes before a clinical machine ships would break a contracted support path you have no authority to end. That is an escalation, not a bench change, and knowing the difference is the point of the row. The account membership row is the reverse trap: the fix is a standard user account for the auditor plus a separate administrative account for IT, not simply stripping admin and leaving nobody able to service the machine in the field.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['What this actually puts at risk', 'What you do before it leaves'],
                    rows: [
                        row('Device encryption is off; the drive is self-encrypting and its vendor tool is disabled', RISK.hw, ACT.bench),
                        row('The screen locks after 30 minutes of inactivity', RISK.unattended, ACT.bench),
                        row('User Account Control is set to Never notify; the user says the ERP installer prompted constantly', RISK.elevate, ACT.bench),
                        row('Feature updates are deferred 30 days; quality updates install automatically', RISK.ok, ACT.leave),
                        row('A vendor support service runs under a local administrator password shared across four clinic sites', RISK.standing, ACT.escalate),
                        row('Windows Defender Firewall is on for the Domain, Private and Public profiles', RISK.ok, ACT.leave),
                        row('Device encryption is on; the 48-digit recovery key is printed and kept in the laptop bag', RISK.keyWithDisk, ACT.bench),
                    ],
                }
            },
        });
    })(),

    (() => {
        const CAUSE = {
            mbr: 'The partition table cannot address the rest of the disk',
            maxfile: 'The file system has a maximum size for any single file',
            unknownfs: 'Windows cannot identify a file system on the volume',
            foreign: 'The disk carries another machine\u2019s volume database',
            failing: 'The medium is failing and remapping sectors as it goes',
            full: 'The volume is out of free space',
            letter: 'The drive letter is already taken by another volume',
            bridge: 'The enclosure\u2019s USB bridge limits the volume size',
        };
        const STEP = {
            convert: 'Copy the contents off, then convert the partition style',
            exfat: 'Reformat with exFAT and copy the data back',
            image: 'Image the whole drive first and work only on the image',
            adopt: 'Adopt the existing volumes without initialising the disk',
            format: 'Accept the format offer Windows is showing',
            init: 'Initialise the disk and create a new volume',
            surface: 'Run a full surface scan and repair before copying anything',
        };
        const row = (label, cause, step) => ({
            label, fields: [
                { correctValue: cause, options: opts(CAUSE) },
                { correctValue: step, options: opts(STEP) },
            ]
        });
        return q({
            domain: D.os, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Five drives land on the bench in one morning. What each machine actually said is quoted. (A) A new 6 TB external: Disk Management shows 2048.00 GB and the disk properties read "Master Boot Record". (B) A 128 GB stick: small files copy fine, a 5.6 GB video stops with "The file is too large for the destination file system", and the stick shows 119 GB free. (C) A drive pulled from a machine that lost power: the volume shows RAW and Windows offers "You need to format the disk in drive E: before you can use it"; the owner has no backup. (D) A drive moved out of a retired workstation: Disk Management lists it as Dynamic (Foreign) and its volumes have no drive letters. (E) A drive that mounts and reads normally: Disk Management says Healthy, and the vendor tool reports 214 reallocated sectors, up from 61 a month ago. For each, name the cause and the step you take next.',
            explanation: 'Each row turns on one specific piece of the quoted output, not on the general shape of the complaint. (A) The reported 2048.00 GB is the tell: an MBR partition table with 512-byte sectors addresses about 2 TiB and no more, so the rest of a 6 TB disk is simply unreachable. Converting to GPT exposes it, and because conversion rewrites the partition table the contents come off first. The enclosure is fine and the driver is fine. (B) Free space of 119 GB rules out a full volume, and small files succeeding rules out a faulty stick; a single 5.6 GB file failing is the 4 GB per-file ceiling that FAT32 has always had. exFAT lifts it and keeps the cross-platform behaviour people buy a USB stick for. (C) RAW means Windows found a partition it cannot interpret, and the single most destructive control on screen is the format button Windows is helpfully offering. With no backup, the drive is imaged first so that a failed recovery attempt costs nothing and can be repeated. (D) Foreign is not corruption. It is Windows reporting that the dynamic-disk database on the drive was written by a different machine, and adopting the volumes is non-destructive. Initialise, sitting one item away in the same menu, discards every volume on the disk. (E) This is the row that separates a Healthy status from a healthy drive: Disk Management reports whether the volume mounts, while a reallocated-sector count that has more than tripled in a month reports that the medium is consuming its spare sectors. The data is still readable today, which is exactly why it is imaged today rather than after the count climbs again. Note that C and E take the same next step for opposite reasons \u2014 one because the file system is gone, the other because the hardware is going \u2014 so naming the cause is a separate decision from choosing the step. Running a full surface scan and repair on either of them first is the classic mistake: it stresses a dying drive for hours before a copy exists.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Cause', 'Step you take next'],
                    rows: [
                        row('A \u2014 the 6 TB external', CAUSE.mbr, STEP.convert),
                        row('B \u2014 the 128 GB stick', CAUSE.maxfile, STEP.exfat),
                        row('C \u2014 the drive from the power loss', CAUSE.unknownfs, STEP.image),
                        row('D \u2014 the drive from the retired workstation', CAUSE.foreign, STEP.adopt),
                        row('E \u2014 the drive with the vendor-tool warning', CAUSE.failing, STEP.image),
                    ],
                }
            },
        });
    })(),

    (() => {
        const COPIES = {
            everything: 'Every selected byte, again',
            sinceLast: 'Only what changed since Tuesday night\u2019s job',
            sinceFull: 'Everything changed since Sunday\u2019s full',
            merged: 'Only changed blocks, merged into a new full on the target',
            nothing: 'Nothing \u2014 no job runs on weeknights',
            archivebit: 'Only files whose archive bit is already clear',
            snapshot: 'A block-level snapshot of the running volumes',
        };
        const SETS = { one: '1', two: '2', four: '4', five: '5', seven: '7' };
        const ADOPT = {
            yes: 'Yes \u2014 it fits both constraints',
            window: 'No \u2014 this is the scheme that is overrunning the window',
            fragile: 'No \u2014 this is the scheme whose restore needed six media sets',
            agent: 'No \u2014 the agent on this server cannot build one',
            dataloss: 'No \u2014 Thursday morning and most of the week would be gone',
            filelevel: 'No \u2014 it cannot restore an individual file',
        };
        const row = (label, copies, sets, adopt) => ({
            label, fields: [
                { correctValue: copies, options: opts(COPIES) },
                { correctValue: sets, options: opts(SETS) },
                { correctValue: adopt, options: opts(ADOPT) },
            ]
        });
        return q({
            domain: D.ops, difficulty: 'hard', bloomLevel: 'Evaluate',
            stem: 'A file server takes a full backup every Sunday night and one nightly job Monday through Saturday. It fails at 09:00 on Thursday. Three facts about this shop constrain the answer: the nightly job they run now has been overrunning into the working day; the scheme they ran before it needed six separate media sets for a Saturday restore, and one of the six turned out to be unreadable; and the backup target is a NAS with no spare capacity whose agent cannot synthesise a full on the target. For each candidate nightly scheme, work out what Wednesday night\u2019s job would have copied, how many media sets the Thursday 09:00 restore would need, and whether this is the scheme to adopt here.',
            explanation: 'Work the Thursday restore backwards and every column falls out of the same reasoning. A nightly full copies every selected byte every night, so the restore needs Wednesday night alone \u2014 one media set, the fastest possible restore and the longest possible nightly window, which is precisely what is overrunning now. An incremental copies only what changed since the previous job of any type, so Monday holds Sunday-to-Monday, Tuesday holds Monday-to-Tuesday and Wednesday holds Tuesday-to-Wednesday; the restore needs Sunday plus all three, in order, which is four sets and matches the six-set Saturday restore this shop already lived through \u2014 and one unreadable member of that chain makes everything after it worthless. A differential copies everything changed since the last FULL, so Wednesday\u2019s differential already contains Monday\u2019s and Tuesday\u2019s changes and the restore is exactly two sets. A synthetic full sends only changed blocks and has the backup server merge them into a new full, giving an incremental-sized client window and a single-set restore \u2014 genuinely the best of both, and unavailable here, because the stem says the agent on this server cannot build one. That is the point of the third column: the technically superior answer is ruled out by a fact about this shop rather than by anything about the scheme. Dropping the nightly job entirely restores from Sunday alone, one set, and loses everything done since \u2014 the shortest window of all, and unacceptable. So the differential is the only scheme that shortens the window and keeps the restore to two sets. The most common error is assuming a differential restore needs every differential taken since the full; it needs only the most recent one, because each differential supersedes the one before it. The second most common is reading a one-set restore as automatically best, which is how a shop ends up with the nightly full it already cannot finish.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['What Wednesday night\u2019s job copies', 'Media sets the 09:00 Thursday restore needs', 'Adopt it here?'],
                    rows: [
                        row('Nightly full', COPIES.everything, SETS.one, ADOPT.window),
                        row('Incremental', COPIES.sinceLast, SETS.four, ADOPT.fragile),
                        row('Differential', COPIES.sinceFull, SETS.two, ADOPT.yes),
                        row('Synthetic full', COPIES.merged, SETS.one, ADOPT.agent),
                        row('No nightly job \u2014 Sunday full only', COPIES.nothing, SETS.one, ADOPT.dataloss),
                    ],
                }
            },
        });
    })(),

    (() => {
        const CAUSE = {
            swell: 'A swollen cell inside the battery',
            appbuild: 'The installed app builds predate the new OS release',
            line: 'Something specific to this line or handset, not the carrier',
            digitiser: 'A digitiser fault \u2014 likely, but not yet established',
            ontop: 'Something laid on top of the glass, not the sensor under it',
            badupdate: 'A corrupted OS update',
            outage: 'A carrier outage in this area',
            storage: 'The device has run out of storage',
        };
        const ACT = {
            isolate: 'Stop using it, stop charging it, isolate it, and never press the cover flat',
            updateapps: 'Update the affected apps; escalate to their vendors if no compatible build exists',
            checkline: 'Check the data toggle, the plan\u2019s data allowance and the APN on this line',
            strip: 'Strip the case and protector, restart, and re-test before ordering any part',
            order: 'Order the screen and digitiser assembly',
            reset: 'Factory reset the device',
            battery: 'Replace the battery again under warranty',
        };
        const row = (label, cause, act) => ({
            label, fields: [
                { correctValue: cause, options: opts(CAUSE) },
                { correctValue: act, options: opts(ACT) },
            ]
        });
        return q({
            domain: D.swt, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Five mobile devices come in on the same day, each with what the user reports and what has already been established. (A) A phone whose battery was replaced under warranty last week runs hot, lasts about three hours, and the back cover no longer sits flush against the frame. (B) After a major OS update three apps close the instant they open; the same three launch and run normally on a loaner still on the previous OS release. (C) A phone loads pages over Wi-Fi and nothing over cellular; two other phones on the same corporate plan work everywhere in the same building. (D) Touches land about an inch below the finger, but only in the lower third of the screen; the OS is current and the device is otherwise responsive. (E) A tablet ignores touch entirely in a strip along one edge; it started the day a new screen protector was fitted. For each, give the cause the evidence actually supports and the action you take first.',
            explanation: 'A bulging case outranks everything else on the bench. A lithium-ion cell that is swelling has failed internally and is a fire and injury risk, so the first action is to stop using it, stop charging it and isolate it \u2014 not to run a battery health report, not to leave it charging overnight to see whether it settles, and never to press the cover back down. Replacing the battery again under warranty may well be where it ends up, but it is not what you do in the next sixty seconds. (B) The loaner is the whole diagnosis: the same three apps behave on the previous OS release, so the OS image is not the variable and the app builds are. That makes this an app compatibility problem and not a corrupted update, and the honest action includes the case where no compatible build exists yet \u2014 you escalate to the vendor rather than pretending an update button will produce one. (C) Two other handsets on the same plan working everywhere rules out the carrier and rules out an outage, which leaves something specific to this line or this handset: the data toggle, an exhausted allowance, or a wrong APN. (D) and (E) share an action and do not share a cause, which is the discrimination the pair exists for. A consistent offset confined to one region of an otherwise healthy device does point at the digitiser \u2014 but A+ troubleshooting theory is establish a theory and then TEST it, and a case pressing on the panel edge or a badly seated protector produces exactly this symptom for a few pounds instead of a few hundred. So the first action for both is to strip the case and protector, restart and re-test; the difference is that for (E) the timing already tells you what the answer will be, and for (D) you genuinely do not know yet. Ordering the assembly for (D) before that test is the parts cannon, and it is wrong even when it turns out to be the right part. A factory reset appears nowhere in this table: it is slow, destructive and would not change an app build, an APN or a piece of plastic on the glass.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Cause the evidence supports', 'Action you take first'],
                    rows: [
                        row('A \u2014 the phone that runs hot and lasts three hours', CAUSE.swell, ACT.isolate),
                        row('B \u2014 the three apps that close on launch', CAUSE.appbuild, ACT.updateapps),
                        row('C \u2014 the phone with no cellular data', CAUSE.line, ACT.checkline),
                        row('D \u2014 the offset touches', CAUSE.digitiser, ACT.strip),
                        row('E \u2014 the tablet that ignores one edge', CAUSE.ontop, ACT.strip),
                    ],
                }
            },
        });
    })(),

    (() => {
        const CLASS = {
            phish: 'Credential phishing from an outside domain',
            bec: 'Business email compromise \u2014 no link, no malware, a payment ask',
            bulk: 'Unwanted bulk mail, not malicious',
            compromised: 'Malware sent from a mailbox that really is the sender\u2019s',
            legit: 'Legitimate mail the user simply did not expect',
            spoofed: 'A spoofed internal address',
            awareness: 'An authorised internal awareness test',
        };
        const HANDLE = {
            block: 'Report it and block the registered domain the link really goes to; open nothing',
            outofband: 'Quarantine it and confirm with the named person on a number you already had',
            unsub: 'Unsubscribe or filter it; raise no incident',
            release: 'Release it to the user and explain why it is genuine',
            reply: 'Reply to the message asking the sender to confirm',
            deletetell: 'Delete it and tell the user to ignore it',
        };
        const row = (label, cls, handle) => ({
            label, fields: [
                { correctValue: cls, options: opts(CLASS) },
                { correctValue: handle, options: opts(HANDLE) },
            ]
        });
        return q({
            domain: D.sec, difficulty: 'hard', bloomLevel: 'Evaluate',
            stem: 'Five messages sit in the reported-mail queue. What decides each one is in the headers and the filenames, not the tone. (A) "Unusual sign-in" from no-reply@yourbank.example; the button\u2019s target resolves to yourbank.example.security-check.ru. (B) From the CEO\u2019s display name and address; SPF fails; Reply-To is ceo.company@gmail.com; it asks for four gift cards before a 17:00 board meeting. (C) A newsletter from a conference the user attended; SPF and DKIM both pass; the unsubscribe link works. (D) A reply inside a thread the user started with a known vendor contact; SPF, DKIM and DMARC all pass for the vendor\u2019s domain; the attachment is invoice.pdf.exe. (E) A password-expiry notice from the company\u2019s own identity provider; SPF, DKIM and DMARC all pass; the link resolves to login.microsoftonline.com; the user\u2019s password does expire on Friday. Classify each and choose how it is handled.',
            explanation: 'Read the rightmost label in the hostname and the last extension in the filename, and four of these five decide themselves. (A) yourbank.example is not the domain here \u2014 it is a label inside a longer hostname whose registered domain is security-check.ru, which is the oldest trick in the set and still the most effective. Report it, block the domain the link actually goes to, and open nothing. (B) and (D) are deliberately given the same handling and different classifications, because the handling follows from a shared fact and the classification does not. (B) has no link and no attachment; it has a failing SPF, a display name borrowed from the CEO, a Reply-To the CEO does not control, and a deadline designed to discourage checking. That is business email compromise, and replying is the one action guaranteed to reach the attacker, because the Reply-To exists for exactly that. (D) authenticates perfectly for the vendor\u2019s domain because it genuinely came from the vendor\u2019s mailbox \u2014 which means that mailbox is compromised, not spoofed \u2014 and invoice.pdf.exe is an executable wearing a document\u2019s name. Both are handled by quarantining and then confirming with the named human on a number you already had; in (D) that also warns a company that does not yet know it has been breached, and using the contact details in the signature of the message under investigation defeats the whole point. (C) is mail the user opted into, authenticating correctly, with a working unsubscribe. Raising an incident here teaches people to stop reporting things, and blocking the sender for everyone punishes colleagues who want it. (E) is the row that scores restraint. Everything about it authenticates, the link resolves to the identity provider\u2019s real domain, and the underlying fact is true \u2014 the password does expire on Friday. It is a genuine message the user did not expect, and the correct handling is to release it and explain why, because a queue that swallows real mail produces a workforce that ignores real warnings.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Classification', 'Handling'],
                    rows: [
                        row('A \u2014 the bank alert', CLASS.phish, HANDLE.block),
                        row('B \u2014 the gift card request', CLASS.bec, HANDLE.outofband),
                        row('C \u2014 the conference newsletter', CLASS.bulk, HANDLE.unsub),
                        row('D \u2014 the vendor thread reply', CLASS.compromised, HANDLE.outofband),
                        row('E \u2014 the password expiry notice', CLASS.legit, HANDLE.release),
                    ],
                }
            },
        });
    })(),

    // ═══════════════════════════════════════════════════════════════
    //  DRAG-DROP (6)
    //  None of these is a bijection: every one has at least one zone
    //  that takes two items, so the last item is never free.
    // ═══════════════════════════════════════════════════════════════

    q({
        domain: D.sec, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'Six machines were reported to the help desk this week. Read what each user observed \u2014 including what still works normally \u2014 and drag each report to what is actually causing it. Two of these six are not malware at all, and calling them malware would send a healthy machine for reimaging.',
        explanation: 'Diagnose from the whole pattern, including the parts that are behaving. Credentials appearing in a breach dump while the machine shows no slowdown, no missing files and no ransom note is a keylogger: it is designed to be quiet, and an absence of performance symptoms is evidence for it, not against it. Renamed files with a payment note in every folder is ransomware and needs no further diagnosis. Sustained high CPU while idle, heat, and a measurable jump in power draw with no data touched is a cryptominer \u2014 it wants the machine working, not broken. A clean scan from the running OS combined with an offline boot scan finding a driver the live OS never reported is the definition of a rootkit: the running system is lying about itself, which is why the offline scan is the one that finds it. The two non-malware cases are the ones that cost real money when misdiagnosed. Sixteen gigabytes installed but only four usable, appearing right after a memory upgrade, is an unseated or incompatible module \u2014 a hardware seating fault, not an infection. Desktop files "disappearing" after an update while the identical files sit under the OneDrive folder is folder redirection doing exactly what it was configured to do; technicians reimage machines over this every week, destroying the user\u2019s local data to fix a problem that was never there.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'keylog', label: 'Keylogger' },
                    { id: 'ransom', label: 'Ransomware' },
                    { id: 'miner', label: 'Cryptominer' },
                    { id: 'rootkit', label: 'Rootkit' },
                    { id: 'notmal', label: 'Not malware \u2014 another cause' },
                ],
                items: [
                    { id: 'creds', label: 'Bank credentials typed on this machine turned up in a phishing dump; no slowdown, no missing files, no ransom note', correctZone: 'keylog' },
                    { id: 'lokd', label: 'Every file on the mapped drives now ends in .lokd and each folder holds a note with a payment address', correctZone: 'ransom' },
                    { id: 'hot', label: 'Idle CPU sits above 90%, the case is hot, the lab\u2019s power draw doubled, and no data is missing or altered', correctZone: 'miner' },
                    { id: 'offline', label: 'The installed AV scan is clean, but a boot-time scan from external media finds a driver the running OS never listed', correctZone: 'rootkit' },
                    { id: 'ram', label: 'Slow and swapping since a memory upgrade; Task Manager reports 16.0 GB installed, 4.0 GB usable', correctZone: 'notmal' },
                    { id: 'onedrive', label: 'All Desktop files vanished after an update; the same files are present under the user\u2019s OneDrive folder', correctZone: 'notmal' },
                ],
            }
        },
    }),

    q({
        domain: D.swt, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'One workstation cannot load https://portal.example.com. It times out; it does not show a certificate warning and it does not fail a sign-in. Everything else the user does on that workstation works. Before you change anything you collect six observations. Drag each observation into the box for what it actually eliminates. One of them eliminates nothing at all, however much it looks like a finding.',
        explanation: 'This is the demosim\u2019s own mechanic: what works narrows the fault faster than what fails. Two observations eliminate the workstation\u2019s network position. Matching address, mask and gateway with a machine on the next desk that loads the site means the addressing is not the variable, and every other site loading plus connected mapped drives means the gateway, the route off the subnet and general name resolution are all functioning. nslookup returning the same address the working machine resolves eliminates name resolution for this specific site \u2014 note that this is stronger evidence than a successful ping would be, because nslookup queries the server directly while ping answers from the local client cache first. The site loading on a phone over cellular from the same room eliminates the site being down and eliminates the building\u2019s internet path in one move. The same user reaching the site from a different desk eliminates the account and its permissions, and also eliminates any per-user policy following the profile around. The clock is the trap. Eleven minutes fast feels like a finding because clock skew genuinely breaks Kerberos and genuinely breaks certificate validation \u2014 but a certificate validity window is months wide, so eleven minutes cannot put you outside it, and skew produces a certificate error rather than a timeout, which is not what this machine reports. It eliminates nothing and it explains nothing. What survives all six is something on this workstation that applies only to this destination: a hosts entry pointing the name at a dead address, a proxy exception, or a local firewall or security-product rule naming that host. That is where the next command goes.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'z_net', label: 'Eliminates the workstation\u2019s addressing and its path off the subnet' },
                    { id: 'z_dns', label: 'Eliminates name resolution for this site' },
                    { id: 'z_site', label: 'Eliminates the site itself being down' },
                    { id: 'z_acct', label: 'Eliminates the user\u2019s account and its permissions' },
                    { id: 'z_none', label: 'Eliminates nothing \u2014 consistent with the fault either way' },
                ],
                items: [
                    { id: 'i_ipcfg', label: 'ipconfig returns the same address range, mask and gateway as the machine on the next desk, which loads the site', correctZone: 'z_net' },
                    { id: 'i_other', label: 'Every other site the user tries loads on this workstation, and its mapped drives are connected', correctZone: 'z_net' },
                    { id: 'i_nslk', label: 'nslookup portal.example.com returns the same address the working machine resolves it to', correctZone: 'z_dns' },
                    { id: 'i_phone', label: 'The site loads on a phone using cellular data, from the same room', correctZone: 'z_site' },
                    { id: 'i_user', label: 'The same user signs in at a different desk and the site loads', correctZone: 'z_acct' },
                    { id: 'i_clock', label: 'The workstation\u2019s clock is 11 minutes fast', correctZone: 'z_none' },
                ],
            }
        },
    }),

    q({
        domain: D.os, difficulty: 'medium', bloomLevel: 'Apply',
        stem: 'Seven items are open on your queue. Each says what the user sees and what has already been ruled out. Drag each to the built-in tool you would open to resolve it \u2014 not the tool that merely displays something related. Two of these are not faults, and opening any tool for them is the wrong move.',
        explanation: 'Pick the tool that can change the thing causing the symptom. A four-minute sign-in that ends in a fast desktop, with three vendor updaters launching at logon, is a startup-load problem, and the Startup tab is where those entries are disabled; the Performance tab would show the spike and offer no way to stop it. A machine rebooting while nobody is present, where you need the record of what happened at a specific time, is Event Viewer\u2019s only real job \u2014 reproducing the fault is not available when the trigger is unknown. A device showing as Unknown with a yellow triangle after Windows Update has already been tried is a driver binding problem, handled in Device Manager. A second internal drive the firmware lists and File Explorer does not, which has never held data, has no partition and no file system yet; Disk Management initialises and formats it, and no amount of driver work will make an uninitialised disk appear. A file rewritten at 03:00 every morning after the Startup folder entry was already deleted is being launched by something that runs with nobody signed in, which is Task Scheduler \u2014 re-checking the Startup tab is the loop technicians get stuck in here. The last two are not faults. A shared reception PC signing users out after 15 minutes idle is an idle session limit doing its job, and three tickets calling it a crash is a communication problem, not a technical one; disabling it to close the tickets removes a control on a machine in a public area. A freshly reimaged workstation running its disk hard for ten minutes after each start is the indexer and the first full anti-malware scan finishing their work, and it stops on its own within a few days \u2014 chasing it with Task Manager produces an afternoon of watching a progress bar that is already correct.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'startup', label: 'Task Manager \u2014 Startup tab' },
                    { id: 'evt', label: 'Event Viewer' },
                    { id: 'devmgr', label: 'Device Manager' },
                    { id: 'diskmgr', label: 'Disk Management' },
                    { id: 'sched', label: 'Task Scheduler' },
                    { id: 'asdesigned', label: 'No tool \u2014 this is configured behaviour, not a fault' },
                ],
                items: [
                    { id: 'slowlogon', label: 'Sign-in takes four minutes, then the desktop is fast; three vendor updaters launch at logon', correctZone: 'startup' },
                    { id: 'reboot', label: 'A workstation reboots unpredictably while nobody is at it; you need the record of what happened at 12:40 yesterday', correctZone: 'evt' },
                    { id: 'unknowndev', label: 'A newly attached USB scanner shows a yellow triangle and no driver bound to it; Windows Update finds none', correctZone: 'devmgr' },
                    { id: 'newssd', label: 'A second internal drive is listed in the firmware setup but never appears in File Explorer; it has never held data', correctZone: 'diskmgr' },
                    { id: 'threeam', label: 'A report file is overwritten at 03:00 daily, and the Startup folder entry for the script was already deleted', correctZone: 'sched' },
                    { id: 'idlelogoff', label: 'A shared reception PC signs every user out after 15 minutes idle; three tickets this week call it a crash', correctZone: 'asdesigned' },
                    { id: 'firstboot', label: 'A workstation reimaged yesterday runs its disk at 100% for ten minutes after every start, then behaves normally', correctZone: 'asdesigned' },
                ],
            }
        },
    }),

    q({
        domain: D.ops, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'Six things a technician is about to do this afternoon. Drag each to the record that has to exist, and be followed, before they touch anything. One of them needs no new record at all \u2014 it is already covered by a standing procedure, and raising paperwork for it wastes the change board\u2019s time and teaches people to route around the process.',
        explanation: 'The question is not what the work is called, it is what has to be true before the work starts. Firmware on twelve switches in the main distribution frame and repointing the domain controllers at a different upstream resolver are both changes to shared infrastructure with a blast radius beyond the person doing them, so both need a change record, an approval and a documented way back \u2014 and the DNS one is the more dangerous of the pair precisely because it looks like a two-minute edit. Taking a laptop out of a locked drawer for an investigation opened this morning is the one action where the record has to survive a lawyer: an incident record with a chain-of-custody form, updated at every handoff, because a single unlogged transfer can make everything collected afterwards unusable. Signing four returned laptops back into stock and reissuing two of them is asset inventory work, and it matters for the reason auditors care about: without it nobody can say which machine holds what or who has it. Opening a user\u2019s personal folder because a manager asked is the row that separates a technician who follows policy from one who follows the loudest person in the room. Whether the company may inspect that content at all, and whether a line manager alone can authorise it, is settled by the acceptable use and monitoring policy \u2014 not by the manager\u2019s seniority and not by the technician\u2019s access rights. Doing it because you can is how IT departments end up in employment tribunals. Reimaging a failed laptop from the standard image and restoring from backup is ordinary work already covered by a standing procedure; filing a change request for it does not make it safer, it makes the change process something people learn to bypass.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'z_change', label: 'A change record and approval before it starts' },
                    { id: 'z_ir', label: 'An incident record with a chain-of-custody form' },
                    { id: 'z_asset', label: 'The asset inventory' },
                    { id: 'z_aup', label: 'The acceptable use and monitoring policy' },
                    { id: 'z_none', label: 'None \u2014 already covered by a standing procedure' },
                ],
                items: [
                    { id: 'i_fw', label: 'Push firmware to the twelve switches in the main distribution frame at Thursday lunchtime', correctZone: 'z_change' },
                    { id: 'i_dns', label: 'Point the domain controllers at a different upstream resolver', correctZone: 'z_change' },
                    { id: 'i_image', label: 'Take a laptop out of the locked drawer and image it for the investigation HR opened this morning', correctZone: 'z_ir' },
                    { id: 'i_stock', label: 'Sign four returned laptops back into stock and reissue two of them to new starters', correctZone: 'z_asset' },
                    { id: 'i_folder', label: 'Open a user\u2019s personal folder on the file server because their manager wants to know what is in it', correctZone: 'z_aup' },
                    { id: 'i_reimage', label: 'Reimage a failed laptop from the standard image and restore the user\u2019s data from backup', correctZone: 'z_none' },
                ],
            }
        },
    }),

    q({
        domain: D.swt, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'Six machines fail to reach a usable desktop. Each description says how far the machine got and what still works. Drag each one to the stage where the failure actually is. Two of these are not faults at all \u2014 they are the system behaving exactly as designed, and "fixing" either one would disable a protection or interrupt a repair already under way.',
        explanation: 'How far the machine got tells you which stage failed. A beep pattern with no video on either the onboard port or a known-good card means the firmware never handed off, so nothing about the OS is in question yet. "Bootmgr is missing" appearing right after a second drive was added and the boot order changed means the firmware found a disk and the disk had no boot loader \u2014 the OS is intact, the pointer to it is not, and reinstalling Windows here would destroy a working installation to fix a boot-order mistake. A STOP error naming a storage driver a few seconds after the Windows logo, where Safe Mode reaches the desktop, is a kernel-stage driver fault; Safe Mode succeeding is the proof, because it loads a minimal driver set. A user reaching a black screen with only a cursor while a brand-new local account signs in normally is a corrupt user profile, and it is the account that varies, not the machine. The last two are traps of the same family. Enabling BitLocker and then changing the boot order alters the measured boot configuration, so the TPM refuses to release the key and asks for the recovery key: that is the control working. Disabling BitLocker or clearing the TPM to make the prompt go away removes the encryption the machine was given to protect it; the correct response is to enter the recovery key and, if the firmware change was intended, let the TPM reseal against the new configuration. Likewise a machine that boots into the recovery environment and offers Startup Repair after three interrupted starts has not developed a new fault \u2014 Windows counts failed boots and hands itself to the recovery environment on purpose. Forcing it past that back into a normal boot skips the repair it just decided it needed.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'post', label: 'Firmware / POST \u2014 before any OS code runs' },
                    { id: 'loader', label: 'Boot loader / BCD' },
                    { id: 'kernel', label: 'Windows kernel and drivers' },
                    { id: 'profile', label: 'User profile / shell' },
                    { id: 'expected', label: 'Not a fault \u2014 expected behaviour' },
                ],
                items: [
                    { id: 'beeps', label: 'A beep pattern and no video, on the onboard port and on a known-good graphics card', correctZone: 'post' },
                    { id: 'bootmgr', label: '"Bootmgr is missing" after a second drive was installed and the boot order changed', correctZone: 'loader' },
                    { id: 'stop', label: 'A STOP error naming a storage driver seconds after the boot logo appears; Safe Mode reaches the desktop', correctZone: 'kernel' },
                    { id: 'blackdesk', label: 'Sign-in succeeds to a black screen with only a cursor, but a brand-new local account works normally', correctZone: 'profile' },
                    { id: 'bitlocker', label: 'After enabling BitLocker and then changing the UEFI boot order, the machine demands a 48-digit recovery key', correctZone: 'expected' },
                    { id: 'winre', label: 'After three starts interrupted by a failing power strip, the machine boots into the recovery environment and offers Startup Repair', correctZone: 'expected' },
                ],
            }
        },
    }),

    q({
        domain: D.sec, difficulty: 'medium', bloomLevel: 'Apply',
        stem: 'Six pieces of storage are leaving service on the same afternoon. Each description says what the media is, what was on it, and what has to happen to it next. Drag each to the disposal method that is both sufficient and appropriate. Destroying media that is being redeployed inside the company wastes hardware; sanitising media that must be provably destroyed fails the audit.',
        explanation: 'Sufficient and appropriate are two separate tests, and each item fails a different one if you choose wrongly. Healthy SATA SSDs going back to the same department at the same security tier only need the data gone, so an ATA Secure Erase and redeployment is correct \u2014 shredding twenty working drives to move them one floor is pure waste, and the same reasoning covers the contractor\u2019s returned laptop, which never held anything above internal classification and is going to a new starter next week. A self-encrypting drive being reissued this afternoon is the case cryptographic erase exists for: destroy the key and every block becomes unreadable in seconds, where an overwrite pass would take hours nobody has. LTO tapes are magnetic, so degaussing genuinely destroys the recorded data \u2014 and the tape drive being scrapped anyway is the hint that the mechanism\u2019s survival is irrelevant. A magnetic hard drive from a legal-hold system that an auditor must see destroyed needs physical destruction with a certificate, because the auditor is buying evidence rather than your assurance. The failed SSD is the row that catches people: with a dead controller no erase command completes and no secure-erase tool can reach the flash, so the only method that is actually sufficient is physical destruction, regardless of how healthy the flash itself may be. Reaching for the degausser on either SSD is the classic error \u2014 flash storage holds no magnetic domains, so a degausser does nothing to it whatsoever.',
        pbqConfig: {
            pbqType: 'drag-drop', dragDrop: {
                zones: [
                    { id: 'erase', label: 'ATA Secure Erase, then redeploy' },
                    { id: 'crypto', label: 'Cryptographic erase (destroy the key)' },
                    { id: 'degauss', label: 'Degauss' },
                    { id: 'shred', label: 'Shred or incinerate, with a certificate of destruction' },
                ],
                items: [
                    { id: 'ssd20', label: '20 healthy SATA SSDs from finance laptops, redeploying to the same department', correctZone: 'erase' },
                    { id: 'contractor', label: 'A returned contractor laptop that never held anything above internal classification, going to a new starter next week', correctZone: 'erase' },
                    { id: 'sed', label: 'A healthy self-encrypting SSD that must be reissued to another team this afternoon', correctZone: 'crypto' },
                    { id: 'lto', label: 'LTO tapes holding seven years of payroll; the tape drive itself is being scrapped anyway', correctZone: 'degauss' },
                    { id: 'legal', label: 'A magnetic hard drive from a legal-hold system, out of warranty, that an auditor must see destroyed', correctZone: 'shred' },
                    { id: 'deadssd', label: 'A failed SSD that held patient records; its controller is dead, so no erase command completes', correctZone: 'shred' },
                ],
            }
        },
    }),

    // ═══════════════════════════════════════════════════════════════
    //  ORDER-STEPS (6)
    //  scorePBQ marks position-exactly, so an order that contradicts
    //  another seed file in this bank punishes a candidate for having
    //  learned the other one. The offboarding and change-management
    //  items that used to sit here did exactly that against
    //  security-plus-pbqs-v2.json #9 and security-plus-pbqs.json #8.
    //  Both were replaced rather than reconciled.
    // ═══════════════════════════════════════════════════════════════

    q({
        domain: D.swt, difficulty: 'medium', bloomLevel: 'Apply',
        stem: 'A workstation is redirecting search results, and the user reports pop-ups that appear even when the browser is closed. Put the malware removal procedure into the order CompTIA specifies for A+ technicians.',
        explanation: 'Every step in this order exists because doing it later costs something. Verifying the symptoms first prevents the wasted afternoon of remediating a machine whose real problem was a browser extension or a failing drive. Quarantine comes before any cleaning, because a machine that is still on the network is still a source, and pulling it off the network is cheap and reversible. Disabling System Restore before remediation is the step candidates most often move or omit, and it is the one that decides whether the job works: restore points can hold the infected files, so a machine cleaned with System Restore still enabled can silently reinfect itself from its own snapshots. Remediation is where the actual removal happens \u2014 update the anti-malware definitions first, then scan and remove, using Safe Mode or a pre-installation environment when the malware resists a scan from the running OS. Scheduling recurring scans and automatic updates comes next, because a machine you cleaned once and never scan again is simply waiting. System Restore is then re-enabled and a fresh, clean restore point created, which is why it is re-enabled after the machine is clean and not before. Educating the end user is last and is not a courtesy: the machine was reached through something a person did, and every earlier step is undone the next time it happens.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Investigate and verify the malware symptoms',
                    'Quarantine the infected system',
                    'Disable System Restore in Windows',
                    'Remediate: update the anti-malware definitions, then scan and remove',
                    'Schedule recurring scans and enable automatic updates',
                    'Re-enable System Restore and create a clean restore point',
                    'Educate the end user',
                ]
            }
        },
    }),

    q({
        domain: D.ops, difficulty: 'medium', bloomLevel: 'Apply',
        stem: 'A user calls at 09:20 and says "the internet is down". Everyone else in the building is working normally, and the user cannot say when it last worked. Put your actions in the order that spends no fix before the evidence and leaves a ticket the next person can actually pick up.',
        explanation: 'The order is built around one rule: nothing you learn is worth anything if it is only in your head, and no fix is worth trying before you know what it is meant to fix. Asking what the user actually sees, in their own words, comes first because "the internet is down" is a conclusion, not an observation, and the real report is usually much narrower \u2014 one site, one application, one shortcut. Reproducing it yourself is second, because a fault you have not seen is a fault you cannot confirm you have fixed, and the exact message and the time are the two things that make a log searchable later. Establishing what still works comes third and does more to narrow the fault than anything else in the list: other sites, other applications, and the same wall jack with a different machine each remove a whole layer. Writing down what you have eliminated BEFORE you change anything is the step technicians skip and the one that decides whether this ticket is transferable \u2014 once you start changing settings you can no longer prove what the machine looked like when you arrived, and the next person repeats every test you already ran. Only then do you apply the least disruptive fix that is within your scope, and record what it did, including when it did nothing. Escalation carries the evidence with it: a handover that says "internet not working, please advise" throws away everything the first four steps bought. Confirming with the user is last because a fault that looks fixed from the technician\u2019s chair and is not fixed from the user\u2019s is simply a ticket that will reopen, and the documentation is written while the detail is still in your head rather than reconstructed at the end of the week.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Ask what the user actually sees, in their words, and when it last worked',
                    'Reproduce the fault yourself and record the exact message and the time',
                    'Establish what still works \u2014 other sites, other applications, the same jack with another machine',
                    'Write what you have already eliminated into the ticket, before changing anything',
                    'Apply the least disruptive fix within your scope and record what it did',
                    'Escalate with the evidence attached if the fault is outside your scope',
                    'Confirm with the user that it is fixed, then document the resolution and close',
                ]
            }
        },
    }),

    q({
        domain: D.os, difficulty: 'medium', bloomLevel: 'Apply',
        stem: 'A domain-joined workstation has had its failed drive replaced with a blank SSD. The user\u2019s data was backed up before the drive failed. Put the clean installation steps in the order that gets the user working with the fewest reworks.',
        explanation: 'Each step is placed where it is because doing it earlier or later creates avoidable rework. Verifying the edition\u2019s hardware requirements and that the licence covers this machine comes first, because discovering a licensing or TPM problem after the install means doing the install twice. Backing up and exporting settings is listed second even though the drive already failed, because it is the step that stops a technician overwriting the only surviving copy on an external disk or a second internal volume. The partition scheme is chosen at install time and is expensive to change afterwards: a UEFI system needs GPT, and installing to MBR produces a machine that boots only in legacy mode. Completing the out-of-box experience with a local account, rather than the user\u2019s credentials, keeps the profile clean before the domain join creates the real one. Chipset, storage and GPU drivers go on before Windows Update, because Update can pull generic drivers that then have to be replaced, and because a missing chipset driver can make the update process itself unreliable. Updating until nothing further is offered comes before the domain join, so the machine meets policy the moment it arrives on the domain. The domain join and Group Policy application follow, and the user\u2019s data is restored last, so the restore lands in the domain profile that will actually be used rather than in a local profile that is about to be abandoned.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Verify the hardware meets the edition\u2019s requirements and the licence covers this machine',
                    'Confirm the user\u2019s backup is readable and export their application settings',
                    'Boot the installation media and choose the partition scheme (GPT for UEFI)',
                    'Install the OS and complete setup with a temporary local account',
                    'Install chipset, storage and GPU drivers from the manufacturer',
                    'Run Windows Update until no further updates are offered',
                    'Join the workstation to the domain and apply Group Policy',
                    'Restore the user\u2019s data and verify their applications open',
                ]
            }
        },
    }),

    q({
        domain: D.sec, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'A leased laptop goes back to the lessor on Friday. It was issued to a nurse and its asset record says it held regulated patient data. The lease requires the machine returned in working order with its original drive, so it cannot simply be destroyed. Put the decommissioning steps in the order that gets the data off, proves it is gone, and leaves a record an auditor can follow.',
        explanation: 'The order is set by one rule: never destroy anything until you have proved the replacement exists, and never claim anything is gone until something other than the tool that removed it says so. Confirming what the device actually holds comes first, from the asset record AND the machine, because those two disagree more often than anyone expects and the classification decides every later step \u2014 a machine holding regulated data cannot be sanitised by the method you would use on a loan laptop. Copying the user\u2019s data and then opening every file in its new location is one step for a reason: a copy that completed is not the same as a copy that is readable, and the moment to discover a truncated file is before the source is wiped, not six weeks later. Signing the device out of what it is enrolled in comes next because it has to happen while the machine still works and still has an operator: an activation lock or an MDM enrolment left in place turns a returned laptop into a brick the lessor will reject, and a per-device licence left attached is one the organisation keeps paying for. Sanitising follows, by a method the drive supports and the classification allows \u2014 the lease rules out destruction, so this is where the choice between a firmware secure erase and a cryptographic erase is actually made. Verifying independently is the step that makes the whole exercise defensible: a tool reporting its own success is not evidence, and reading the drive back with something else costs minutes. Recording the method, the serial, the date and the person is what an auditor will ask for, and it must name a person rather than a department. Retiring the asset record is last because until then the machine is still yours on paper, and an inventory that shows a device you no longer hold is the same failure as one that omits a device you do.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Confirm from the asset record and from the machine what data it actually holds',
                    'Copy the user\u2019s data to its new location and open every file there to prove the copy is good',
                    'Sign the device out of what it is enrolled in \u2014 MDM, activation lock and per-device licences',
                    'Sanitise the storage by a method the drive supports and the classification allows',
                    'Verify the sanitisation with something other than the tool that performed it',
                    'Record the method, the serial number, the date and the person who performed it',
                    'Retire the asset record and hand the machine over with the certificate attached',
                ]
            }
        },
    }),

    q({
        domain: D.ops, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'A manager reports that an employee appears to have copied a customer database to a personal drive. The employee\u2019s workstation is still powered on at their desk. Put the first-response steps in the order that preserves the evidence and the chain of custody.',
        explanation: 'The most damaging action available in this scenario is an ordinary, well-meant one: sitting down at the machine to check whether anything was really copied. Every file opened updates access timestamps, every reboot discards volatile data, and both give a defence lawyer a straightforward argument that the evidence was altered by IT. So the first step is to leave the workstation exactly as found and stop anyone from using it. Reporting to management through the documented escalation path comes second, because a technician does not get to decide unilaterally that an employee is under investigation, and management \u2014 not IT \u2014 decides whether law enforcement or counsel is involved, which is why that decision is a separate later step rather than the technician\u2019s call. Documenting the scene precedes taking custody, so there is a record of the state the device was in before anyone moved it. The forensic image and the hashes of both original and copy come next, and the hashes are what let you demonstrate later that the copy is identical to the original. All analysis is then performed on the copy while the original is stored in a locked, logged location, because the original must be able to be produced unchanged. The incident report is written last, and the chain-of-custody form is updated at every single handoff \u2014 one unrecorded transfer is enough to make the whole collection inadmissible, no matter how carefully the imaging was done.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Leave the workstation exactly as found and stop anyone from using it',
                    'Report the incident to management through the documented escalation path',
                    'Involve law enforcement or legal counsel if management directs it',
                    'Document the scene, then take custody of the device and record who has it, when and why',
                    'Create a forensic image of the drive and hash both the original and the copy',
                    'Analyse only the copy; store the original in a locked, logged location',
                    'Write the incident report and update the chain-of-custody form at every handoff',
                ]
            }
        },
    }),

    q({
        domain: D.os, difficulty: 'medium', bloomLevel: 'Apply',
        stem: 'A Windows workstation stopped reaching the desktop immediately after a graphics driver update. The user\u2019s documents are on the local drive and the last backup ran nine days ago. Put the recovery actions in order from least destructive to most, so you stop at the first one that works.',
        explanation: 'The ladder is ordered by what each action costs if it is the one that finally works, and the discipline it teaches is stopping at the first rung that succeeds. Safe Mode is first because it changes nothing at all \u2014 it only tells you whether the desktop loads with a minimal driver set, and if it does, the fault is a driver or a startup item rather than the installation. Rolling back or uninstalling the driver installed immediately before the failure is next, and given the timing here it is very likely to be the fix; it is narrow, targeted and reversible. Startup Repair follows because it rebuilds boot configuration automatically without touching user data, but it can only fix the class of problem it knows about. A system restore point comes after that, since it rewinds system files, drivers and registry while leaving documents alone \u2014 larger than a driver rollback, still not destructive to data. Reset this PC keeping personal files is next and is a real step down: it removes installed applications, which means reinstalling and reconfiguring everything the user works with. Reimaging is last precisely because it always works, and that is the trap \u2014 reaching for it early looks efficient and silently discards nine days of documents that no backup holds. The order exists so that the cheapest sufficient fix is the one that gets used.',
        pbqConfig: {
            pbqType: 'order-steps', orderSteps: {
                steps: [
                    'Boot into Safe Mode and confirm whether the desktop loads there',
                    'Roll back or uninstall the driver installed immediately before the failure',
                    'Run Startup Repair from the Windows Recovery Environment',
                    'Restore the most recent system restore point',
                    'Run Reset this PC with the option to keep personal files',
                    'Reimage from the standard image and restore the user\u2019s data from backup',
                ]
            }
        },
    }),

    // ═══════════════════════════════════════════════════════════════
    //  COMMAND (6) — every one is investigate-then-act
    //
    //  The old set keyed a single memorised string per question and
    //  printed the answer in the `scenario` line, which the renderer
    //  shows above the terminal before anything is typed. That is a
    //  free mark, and it teaches the opposite of what the demosim
    //  scores: four of its fourteen checkpoints are acts of
    //  investigation (ipconfig and ping on each workstation).
    //
    //  Exact-sequence matching is not the obstacle to fixing that,
    //  it is the mechanism. ["ls -l backup.sh", "chmod u+x backup.sh"]
    //  works today, from the seed file, with no change to the TSX.
    //
    //  `scenario` now states the user-visible goal and nothing else.
    //  The stem says how many commands and what each one is for, the
    //  way the demosim's INSTRUCTIONS panel does. `hints` is gone.
    // ═══════════════════════════════════════════════════════════════

    q({
        domain: D.os, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'A user named dana reports "Permission denied" when she runs ./backup.sh from her home directory on a Linux workstation. She can open the file in a text editor and read it. whoami returns dana. Copying the same file to /tmp and running it as "bash backup.sh" executes it correctly and completes. She must be able to run it herself, and nobody else\u2019s access to the file is to change. From her own prompt, in her home directory: two commands \u2014 one that shows you the file\u2019s current ownership and mode, and one that fixes what you find.',
        explanation: 'The evidence does more work than the error message. "Permission denied" on a script has three usual causes and the stem eliminates two of them before you type anything. She can read the file in an editor, so the read bits are present. Running it as "bash backup.sh" completes, which means the contents are fine, the interpreter line is fine, and she is entitled to execute bash \u2014 the only thing that changes between the working invocation and the failing one is whether the KERNEL is being asked to execute the file itself. That is the execute bit, and looking at the mode with ls -l is what confirms it rather than assuming it; it also confirms she is the owner, which is what makes chmod hers to run and rules out chown and sudo chown entirely. Adding execute for the owner is the whole fix. What separates the accepted answers from the rejected ones is the second half of the requirement, and it cuts both ways. chmod 755, chmod +x and chmod a+x all grant execute to group and to other \u2014 chmod +x with no "who" defaults to all three \u2014 which hands the ability to run her backup script to every account on the machine to solve a problem that affects one person and one bit. chmod 700 fails the same requirement from the opposite direction: it strips the read access group and other already had, which nobody asked you to remove, and removing access quietly is as much an unrequested change as granting it. chmod u+x, chmod u+rx and chmod 744 all land on exactly the same resulting mode and are all correct. Running it as sudo ./backup.sh is the tempting shortcut and is wrong twice over: it does not supply a missing execute bit, and it would run a personal backup script with privileges it was never written to hold.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'dana@ws-14:~$',
                scenario: 'Two commands. Leave dana able to run ./backup.sh herself, with nobody else\u2019s access to the file changed.',
                acceptedCommands: cross(
                    ['ls -l backup.sh', 'ls -l ./backup.sh', 'ls -la backup.sh', 'ls -al backup.sh', 'ls -l'],
                    ['chmod u+x backup.sh', 'chmod u+x ./backup.sh', 'chmod u+rx backup.sh', 'chmod 744 backup.sh', 'chmod 744 ./backup.sh'],
                ),
            }
        },
    }),

    q({
        domain: D.os, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'A User Configuration policy that blocks writing to removable storage was linked to the Marketing OU at 08:00. Every other user in that OU now gets refused on USB writes. One designer still does not. She has been signed in since yesterday running an eight-hour render that must not be interrupted, so she cannot sign out and cannot reboot. Nothing about the policy has been reported wrong anywhere else in the OU. Sitting at her desk, in her own session, at her own unelevated prompt: two commands \u2014 one that tells you which policy objects this session has actually applied and when, and one that acts on what that tells you. Do not change the policy itself.',
        explanation: 'The symptom pattern rules out almost everything before you touch the machine. Every other user in the same OU is getting the setting, which means the policy object is correct, it is linked to the right OU, no security filter or WMI filter is excluding it, and replication has completed. The only variable left is this one session\u2019s own refresh, because Group Policy applies at startup, at sign-in, and then on a background interval that has not come round since 08:00 for a session that has been open since yesterday. That is a hypothesis, not a fact, and gpresult is what turns it into one: it lists the policy objects actually applied and the time of the last refresh. The distinction matters, because two different worlds sit behind the same symptom \u2014 the policy is not there yet, which gpupdate fixes, or the policy is listed as applied and is not taking effect, which points at a conflicting local policy or a group this user is not in, and which gpupdate would not fix at all. Run the fix without the check and you never learn which world you are in. gpupdate then triggers the refresh immediately, and /force reapplies every setting rather than only those the client believes changed, which is the safer choice when you get one attempt at a machine you cannot reboot. Two details of scope are load-bearing here and both are why this question is deliberately a User Configuration setting run from her own unelevated prompt: gpresult can report the computer half of the policy only from an elevated prompt, and gpupdate refreshes computer policy only with administrative rights, so a question keyed on computer-side policy would be keyed on commands that quietly do nothing where it places you. Note also what the constraint rules out: gpupdate /boot and gpupdate /logoff are real switches and both would end the render, which is the single outcome the scenario forbids. Editing the GPO, re-linking it or forcing replication would all be changes to a system demonstrably working for everybody else. Finally, a removable-storage restriction is a registry-based Administrative Template setting, which does take effect on a background refresh \u2014 unlike Group Policy Preferences drive maps and printers, which frequently do need a sign-out, and which is exactly why the policy in this question is not one of those. One approach is deliberately absent from the accepted answers rather than overlooked: Invoke-GPUpdate does the same job, but it is a cmdlet from the GroupPolicy module that arrives with the remote administration tools, and it is not present on a designer\u2019s workstation or at the command prompt this question places you at. A key should never accept a command that would fail in the shell the question depicts.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'C:\\Users\\ddiaz>',
                scenario: 'Two commands. Get this machine enforcing the removable-storage policy the rest of its OU is already enforcing, without signing out, rebooting, or altering the policy.',
                // /scope user, not /scope computer: the prompt in this question
                // is deliberately unelevated, and gpresult cannot read computer
                // RSoP without administrative rights. A key must not accept a
                // command that would fail in the shell the question depicts.
                acceptedCommands: cross(
                    ['gpresult /r', 'gpresult /r /scope user', 'gpresult /scope user /r', 'gpresult /v'],
                    ['gpupdate /force', 'gpupdate'],
                ),
            }
        },
    }),

    q({
        domain: D.os, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'The intranet moved to a new server this morning. Every machine reaches intranet.corp.example on the new server except one workstation, which keeps loading the old server\u2019s page. On that workstation, "ping intranet.corp.example" replies from 10.40.2.15, the old server, while "nslookup intranet.corp.example" returns 10.40.2.60, the new one. Browsing directly to 10.40.2.60 works. There is one other place on a Windows machine where a name-to-address answer can be stored, it is consulted before any cache or server, and clearing the cache would not touch it. From an elevated PowerShell prompt on that workstation: two commands \u2014 one that lets you read that other place, and one that makes the workstation resolve the name the way the DNS server does.',
        explanation: 'The two lookups disagreeing is the diagnosis, and which one disagrees tells you where the wrong answer lives. nslookup queries the configured DNS server directly and bypasses the local resolver entirely, and it returns the new address \u2014 so the server, the zone and the record are all correct, and nothing on the DNS infrastructure needs changing. ping resolves through the Windows DNS Client service, which consults the HOSTS file first and then the resolver cache, and it returns the old address. Browsing successfully by IP confirms there is no routing, firewall or web server problem to chase. That leaves two candidates and only two, and they are not equivalent: a cached entry expires with its TTL and is cleared by a flush, while a HOSTS entry is permanent, survives the flush, survives a reboot, and would leave you certain you had fixed a machine that is still wrong. Reading the HOSTS file first is what separates them, and it costs one command. If it holds a line for intranet.corp.example, the flush is the wrong fix and editing that file is the right one; if it does not, the cache is the only remaining explanation and flushing it is correct. Note the prompt: at PowerShell both ipconfig /flushdns and Clear-DnsClientCache are available, and CompTIA scores different valid approaches rather than one memorised string. The wrong moves all follow from misreading which side is stale \u2014 changing this workstation\u2019s DNS server addresses, releasing and renewing the DHCP lease, or editing the record on the DNS server would each change something already correct, and editing the record would break every machine that is currently working. Rebooting also clears the cache, which is why this fault seems to fix itself and then reappears on the next machine nobody has restarted.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'PS C:\\Windows\\system32>',
                scenario: 'Two commands. Make this workstation resolve intranet.corp.example to the address the DNS server returns.',
                acceptedCommands: cross(
                    [
                        'type c:\\windows\\system32\\drivers\\etc\\hosts',
                        'get-content c:\\windows\\system32\\drivers\\etc\\hosts',
                        'cat c:\\windows\\system32\\drivers\\etc\\hosts',
                        'more c:\\windows\\system32\\drivers\\etc\\hosts',
                        'notepad c:\\windows\\system32\\drivers\\etc\\hosts',
                    ],
                    ['ipconfig /flushdns', 'clear-dnsclientcache'],
                ),
            }
        },
    }),

    q({
        domain: D.swt, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'A workstation lost power partway through a feature update. Three Control Panel applets now fail with "the file or directory is corrupted and unreadable", and Windows Update fails with 0x80073712. This morning another technician ran a repair that finished with "Windows Resource Protection found corrupt files but was unable to fix some of them", and repeating that first is not an answer. From an elevated prompt: three commands, in an order that will actually work \u2014 one that establishes whether the local component store can be repaired, one that repairs it, and one that repairs the protected system files that draw from it.',
        explanation: 'The failed repair on the log is the evidence that settles the order. System File Checker does not carry its own copy of Windows; it replaces damaged protected files with known-good copies pulled from the local component store. "Found corrupt files but was unable to fix some of them" is what SFC reports when the store it repairs FROM is itself damaged, and 0x80073712 is Windows Update saying the same thing in different words \u2014 a component store manifest is missing or corrupt. Running SFC again produces the same result for the same reason, because nothing has repaired the source. DISM is the tool that repairs the store, and it is deliberately split into a check and a repair for a reason worth knowing: /ScanHealth inspects the store and records whether it is repairable, /CheckHealth only reads a flag a previous scan already wrote, and /RestoreHealth is the one that goes out to Windows Update, downloads replacement files and can run for a long time on a slow link. Establishing that the store is repairable before committing to that is the difference between a considered repair and a hopeful one, and if the scan reports the store is NOT repairable then the answer changes entirely to an in-place upgrade repair, which is exactly the branch the check exists to find. Once the store is healthy, SFC finally has good sources and is run last. Reversing DISM and SFC is the single most common error with this pair, and it reproduces precisely the result already sitting on this morning\u2019s log. Going straight to a repair install or a reset is the other temptation: it would probably work, and it costs hours plus every installed application, which is not proportionate before a component store repair has even been attempted.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'C:\\Windows\\system32>',
                scenario: 'Three commands. Get the Control Panel applets and Windows Update working again on this installation, repairing it in place.',
                acceptedCommands: cross(
                    [
                        'dism /online /cleanup-image /scanhealth',
                        'dism.exe /online /cleanup-image /scanhealth',
                        'dism /online /cleanup-image /checkhealth',
                    ],
                    [
                        'dism /online /cleanup-image /restorehealth',
                        'dism.exe /online /cleanup-image /restorehealth',
                    ],
                    ['sfc /scannow', 'sfc.exe /scannow'],
                ),
            }
        },
    }),

    q({
        domain: D.swt, difficulty: 'hard', bloomLevel: 'Analyze',
        stem: 'A laptop has been hard-powered-off several times by its user during freezes. It now logs NTFS Event ID 55 entries, one folder on the C: volume cannot be opened in File Explorer, and the drive\u2019s SMART data reports Healthy with zero reallocated sectors. The user\u2019s data is backed up. From an elevated PowerShell prompt: two commands \u2014 one that reports the volume\u2019s actual condition without changing anything on it, and one that repairs what the first one found and no more than that.',
        explanation: 'Two pieces of evidence point in opposite directions, and that is what makes the scope of the fix decidable. NTFS Event ID 55 alongside a folder that will not open is file system METADATA damage, which is exactly what repeated hard power-offs produce: writes to the master file table interrupted in flight. SMART reporting Healthy with zero reallocated sectors says the physical medium is not failing, so this is not a dying drive and does not need replacing. Reading the volume before repairing it is not ceremony. A read-only pass \u2014 chkdsk with no switches, chkdsk /scan, or Repair-Volume -Scan \u2014 changes nothing, can be run while the volume is in use, and tells you whether there is anything to repair and how extensive it is; that is the difference between repairing a known fault and running a repair tool at a machine and hoping. Stopping there would leave the folder unopenable, which is why the second command has to follow. chkdsk /f fixes the structures, and Repair-Volume -SpotFix is the same repair expressed the way PowerShell expresses it, which is why both are accepted \u2014 CompTIA scores different valid approaches, not one memorised string. What is NOT accepted is /r. It adds a full surface scan for bad sectors on top of the metadata repair, which takes hours on a large volume and is searching for a physical fault SMART has already reported does not exist \u2014 the definition of over-fixing. Reformatting or reimaging would certainly clear the corruption and is wildly out of proportion to a metadata repair on a machine whose hardware is fine. Expect Windows to say the volume is in use and offer to schedule the repair for the next restart, since C: cannot be dismounted while it is running: accepting that is normal behaviour, not a failure of the command.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'PS C:\\Windows\\system32>',
                scenario: 'Two commands. Get the unopenable folder on C: readable again, changing nothing else about the volume.',
                acceptedCommands: cross(
                    ['chkdsk c:', 'chkdsk c: /scan', 'repair-volume -driveletter c -scan', 'repair-volume c -scan'],
                    ['chkdsk c: /f', 'chkdsk /f c:', 'repair-volume -driveletter c -spotfix', 'repair-volume c -spotfix'],
                ),
            }
        },
    }),

    q({
        domain: D.sec, difficulty: 'hard', bloomLevel: 'Evaluate',
        stem: 'At 16:55 HR calls: the domain user jsmith has just been escorted out, and Legal has told HR that jsmith\u2019s mailbox and home directory must be preserved for a dispute they expect to be filed. The directory contains two people whose names shorten to J. Smith. You are at a domain-joined administrative workstation with an elevated PowerShell prompt and the AD tools installed. Two commands \u2014 one that reads back the directory object you are about to act on, and one that stops that account authenticating without destroying anything Legal will need.',
        explanation: 'Two instructions arrived together under time pressure, and the failure mode of a 16:55 phone call is acting on the wrong object. Reading the account back first \u2014 net user jsmith /domain, or Get-ADUser \u2014 costs seconds and confirms three things at once: that this is the right person rather than the other J. Smith, that the account is currently enabled so you can tell afterwards whether your command did anything, and what it is a member of, which is what tells Legal and the manager what the person could reach. Then the disable. Setting the account inactive revokes the ability to authenticate immediately while leaving the account object, and therefore its SID, in place; that matters more than it first appears, because file permissions, mailbox ownership and audit log entries all reference the SID rather than the name, so an account that still exists keeps every one of those references resolvable. Deleting the account is the instinct to resist: it also stops access, and it destroys the SID, at which point every permission entry that pointed at jsmith becomes an unresolved identifier and the mailbox loses its owner, compromising the preservation Legal asked for in the same keystroke. Resetting the password instead does not end sessions or tokens already issued, so it does not reliably cut access at all. On the acceptable answers, CompTIA states plainly that there can be multiple ways to solve a PBQ and that scoring addresses different approaches: net user with /active:no and /domain, Disable-ADAccount, and Set-ADUser -Enabled $false all produce the same directory state, and the last two are what most domain administrators would actually reach for at an RSAT workstation. The /domain switch is not optional on net user \u2014 without it the command edits the local SAM on the workstation and reports success against an account nobody cares about. Two honest limits on what you have just done. A disabled account can keep working for a while on tokens already issued, so revoking live sessions is a necessary separate follow-up rather than something these two commands accomplish. And the preservation itself is Legal\u2019s instrument, not yours: in a planned offboarding the litigation hold is issued before any account or device is touched, and here it has already been raised and relayed through HR, which is why the instruction that reached you says preserve. Your part is to make sure the technical action you take cannot defeat it \u2014 which is precisely why the account is disabled rather than deleted.',
        pbqConfig: {
            pbqType: 'command', command: {
                prompt: 'PS C:\\Windows\\system32>',
                scenario: 'Two commands. jsmith must not be able to authenticate once the second one returns, and everything Legal asked to be preserved must still exist afterwards.',
                acceptedCommands: cross(
                    ['net user jsmith /domain', 'get-aduser jsmith', 'get-aduser -identity jsmith', 'get-aduser jsmith -properties *'],
                    [
                        'net user jsmith /active:no /domain',
                        'net user jsmith /domain /active:no',
                        'disable-adaccount jsmith',
                        'disable-adaccount -identity jsmith',
                        'set-aduser -identity jsmith -enabled $false',
                        'set-aduser jsmith -enabled $false',
                    ],
                ),
            }
        },
    }),
];

// ─── Lint: the traps that got this set rejected, made unrepeatable ──
//
// Patching the instances is not a fix if the next author can reintroduce them.
// Each check below corresponds to a specific defect found by review, and the
// build aborts rather than writing a file that contains one.

const lint = [];

// A word long enough to carry meaning, in a label or an option. Word
// association is the second way a PBQ becomes free marks: 'Failed digitiser'
// next to 'Replace the screen and digitiser assembly' can be answered with no
// A+ knowledge whatsoever.
const STOP_WORDS = new Set(['their', 'there', 'which', 'while', 'about', 'after', 'other', 'every', 'first', 'would', 'could', 'should', 'these', 'those', 'where', 'never', 'still', 'until', 'before']);
const keyWords = (t) => new Set(
    String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ')
        .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
);
/** Words that occur in exactly one member of a list of strings. */
const uniqueWords = (list) => {
    const count = {};
    list.forEach((t) => keyWords(t).forEach((w) => { count[w] = (count[w] || 0) + 1; }));
    return new Set(Object.keys(count).filter((w) => count[w] === 1));
};

questions.forEach((x, i) => {
    const at = `#${i + 1} (${x.pbqConfig.pbqType})`;
    const c = x.pbqConfig;

    if (c.pbqType === 'fill-table') {
        const rows = c.fillTable.rows;
        c.fillTable.columns.forEach((col, ci) => {
            const pool = new Set();
            rows.forEach((r) => r.fields[ci].options.forEach((o) => pool.add(o)));
            const used = rows.map((r) => r.fields[ci].correctValue);
            const distinct = new Set(used).size;
            // A column whose option pool is exactly the set of its own answers,
            // each used once, hands the last row away by elimination.
            if (pool.size === rows.length && distinct === rows.length) {
                lint.push(`${at}: column "${col}" is a Latin square — ${rows.length} rows, ${pool.size} options, each correct exactly once`);
            }
            // Every pool needs slack: an option that is never correct, or one
            // that is correct twice. Without either, elimination still bites.
            const neverUsed = pool.size - distinct;
            const repeated = used.length - distinct;
            if (neverUsed === 0 && repeated === 0) {
                lint.push(`${at}: column "${col}" has no unused and no repeated options`);
            }
            // Word association: a word that appears in exactly one row label
            // AND in exactly one option of the pool points straight from that
            // row to that option, so the cell is answerable without knowing
            // anything.
            const uniqRow = uniqueWords(rows.map((r) => r.label));
            const uniqOpt = uniqueWords([...pool]);
            rows.forEach((r) => {
                keyWords(r.label).forEach((w) => {
                    if (uniqRow.has(w) && uniqOpt.has(w) && keyWords(r.fields[ci].correctValue).has(w)) {
                        lint.push(`${at}: column "${col}" is welded to its row by the word "${w}" — "${r.label}" -> "${r.fields[ci].correctValue}"`);
                    }
                });
            });
        });
    }

    if (c.pbqType === 'drag-drop') {
        const zones = c.dragDrop.zones, items = c.dragDrop.items;
        const perZone = {};
        items.forEach((it) => { perZone[it.correctZone] = (perZone[it.correctZone] || 0) + 1; });
        // A one-item-per-zone drag-drop is a sorting exercise with a free last
        // move. At least one zone must take two.
        if (items.length === zones.length && Object.values(perZone).every((n) => n === 1)) {
            lint.push(`${at}: bijection — ${items.length} items across ${zones.length} zones, one each, so the last item is free`);
        }
        // Same word-association check as the tables: an item whose text names
        // its own zone is a vocabulary sort, not a diagnosis.
        const uniqItem = uniqueWords(items.map((it) => it.label));
        const uniqZone = uniqueWords(zones.map((z) => z.label));
        const zoneLabel = Object.fromEntries(zones.map((z) => [z.id, z.label]));
        items.forEach((it) => {
            keyWords(it.label).forEach((w) => {
                if (uniqItem.has(w) && uniqZone.has(w) && keyWords(zoneLabel[it.correctZone]).has(w)) {
                    lint.push(`${at}: item names its own zone via "${w}" — "${it.label}" -> "${zoneLabel[it.correctZone]}"`);
                }
            });
        });
    }

    if (c.pbqType === 'command') {
        const cmd = c.command;
        // hints render unconditionally above the terminal, before anything is
        // typed. Every hint this set ever carried named the answer.
        if (cmd.hints) lint.push(`${at}: command PBQ carries hints, which render above the terminal and gave the answer away`);
        const seqs = cmd.acceptedCommands.map((s) => (Array.isArray(s) ? s : s.steps));
        const lens = new Set(seqs.map((s) => s.length));
        if (lens.size > 1) lint.push(`${at}: mixed sequence lengths ${[...lens].join('/')} — scorePBQ compares length first`);
        // Single-step keys score recall of one memorised string. The demosim
        // scores the act of gathering evidence; so does this set.
        if (seqs[0].length < 2) lint.push(`${at}: single-command key — not investigate-then-act`);
        const seen = new Set();
        seqs.forEach((s) => {
            const k = s.join(' | ').toLowerCase();
            if (seen.has(k)) lint.push(`${at}: duplicate accepted sequence "${k}"`);
            seen.add(k);
        });
    }
});

if (lint.length) {
    console.error(`\nBUILD ABORTED — ${lint.length} authoring defect(s):`);
    lint.forEach((e) => console.error('  - ' + e));
    console.error('\nNothing written.\n');
    process.exit(1);
}

// ─── Emit ────────────────────────────────────────────────────────

/* Items authored grouped by zone, and correct values left at the top of a
 * dropdown, make the seed an answer key even though the renderer shuffles.
 * Search for an arrangement a zero-knowledge candidate does worst against. */
questions.forEach((q, i) => {
    if (q.pbqConfig) q.pbqConfig = arrangeConfig(q.pbqConfig, `${SOURCE}:${i}`);
});
balanceOptionPositions(questions);

const out = {
    examId: EXAM_ID,
    examName: 'CompTIA A+ Core 2 (220-1202)',
    source: SOURCE,
    authoredAt: '2026-08-29',
    note: 'Performance-based questions. Not reviewed by a certified subject matter expert.',
    questions,
};

mkdirSync('./seed', { recursive: true });
writeFileSync('./seed/a-plus-core2-pbqs.json', JSON.stringify(out, null, 2), 'utf8');

const byType = {}, byDomain = {}, byDiff = {}, byBloom = {};
for (const x of questions) {
    byType[x.pbqConfig.pbqType] = (byType[x.pbqConfig.pbqType] || 0) + 1;
    byDomain[x.domain] = (byDomain[x.domain] || 0) + 1;
    byDiff[x.difficulty] = (byDiff[x.difficulty] || 0) + 1;
    byBloom[x.bloomLevel] = (byBloom[x.bloomLevel] || 0) + 1;
}

// Metrics, stated honestly. A raw count of scored cells is NOT a claim of
// parity with the demosim: the demosim persists fourteen decision points and
// reports a score out of four, and nine of its fourteen are "leave this ACL
// line alone" while four are acts of investigation. What is worth counting
// here is the same two things — decisions whose correct answer is to change
// nothing, and keyed acts of evidence-gathering — not the gross total.
let scored = 0, restraint = 0, investigative = 0;
// Exact-anchored on purpose. A loose prefix match counted "Nothing — no job
// runs on weeknights" (a description of what a backup scheme copies) as a
// decision to change nothing, which inflates the one number in this output
// that is supposed to be conservative.
const RESTRAINT = /^(no change$|leave it as found$|nothing — this already meets policy$|none — |no tool — |not a fault — |eliminates nothing — |not malware — )/i;

for (const x of questions) {
    const c = x.pbqConfig;
    if (c.pbqType === 'fill-table') {
        c.fillTable.rows.forEach((r) => r.fields.forEach((f) => {
            scored++;
            if (RESTRAINT.test(f.correctValue)) restraint++;
        }));
    } else if (c.pbqType === 'drag-drop') {
        const zoneLabel = Object.fromEntries(c.dragDrop.zones.map((z) => [z.id, z.label]));
        c.dragDrop.items.forEach((it) => {
            scored++;
            if (RESTRAINT.test(zoneLabel[it.correctZone])) restraint++;
        });
    } else if (c.pbqType === 'order-steps') {
        scored += c.orderSteps.steps.length;
    } else {
        scored += 1;
        const first = (Array.isArray(c.command.acceptedCommands[0])
            ? c.command.acceptedCommands[0]
            : c.command.acceptedCommands[0].steps);
        investigative += first.length - 1;
    }
}

console.log(`wrote ${questions.length} PBQs -> seed/a-plus-core2-pbqs.json`);
console.log('by type:      ', byType);
console.log('by domain:    ', byDomain);
console.log('by difficulty:', byDiff);
console.log('by bloom:     ', byBloom);
console.log(`scored cells:                     ${scored}  (a gross count, not a parity claim)`);
console.log(`cells whose right answer is "change nothing": ${restraint}`);
console.log(`command PBQs keyed investigate-then-act:      ${questions.filter((x) => x.pbqConfig.pbqType === 'command').length}/6`);
console.log(`keyed investigative commands preceding a fix: ${investigative}`);
