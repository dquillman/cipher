/**
 * Authors the Network+ (N10-009) PBQ set and writes seed/network-plus-pbqs.json.
 * Content lives here rather than in raw JSON so the reasoning stays readable
 * and reviewable in a diff. Run: node build-netplus-pbqs.mjs
 *
 * THE BAR — CompTIA's own example simulation (demosim.comptia.org). Its
 * SimulationInit payload exposes exactly how it scores: fourteen slots, split
 * S1Workstation1{ipconfig, ping}, S2Workstation2{ipconfig, ping} and
 * S3Firewall{Line1..Line10}. Four of the fourteen are awarded for going and
 * looking before a single rule is touched; ten are an independent keep-or-remove
 * decision per ACL line, with line 10 marked static so it cannot be deleted;
 * and the terminal evaluates ping against the ACL as it currently stands, so a
 * candidate probes, changes, and re-probes.
 *
 * The first version of this file failed that bar in one specific way: every
 * question handed the evidence over pre-collected in the stem, so the candidate
 * graded someone else's fieldwork and never did any. This version changes the
 * shape of the work:
 *
 *   • Three tables (FT1 ACL, FT2 routing, FT7 DNS) are built as
 *     PROBE -> REPAIR -> RE-PROBE. The stem gives configuration, never results.
 *     The probe rows ask what a specific test returns against the state as it
 *     stands, and are scored on their own. The repair rows are per-line
 *     keep / remove / edit, independently scored, with over-fix penalties. The
 *     re-probe rows ask what the same tests return after the candidate's own
 *     repairs, including one that must still be permitted so that over-fixing
 *     is visibly punished.
 *   • Every command question requires at least two lines, and the probes are
 *     part of the scored sequence: the scorer stops punishing a candidate for
 *     looking first and starts requiring it. Scenario lines state an
 *     operational goal and never a command count; hints constrain behaviour
 *     and never name a tool.
 *   • Options are shuffled with a seeded PRNG at authoring time, because
 *     PBQQuestion.tsx renders field.options in authored order with no shuffle.
 *     Authoring correct values into position 0 turns the dropdown into a
 *     plaintext answer key. Drag-drop items are interleaved for the same
 *     reason: the component maps items in authored order, so a non-decreasing
 *     correctZone sequence is a free pass.
 *
 * Firestore rejects an array stored directly inside another array, at any
 * depth, which is why every command sequence is wrapped as { steps: [...] }.
 *
 * Not reviewed by a certified subject matter expert.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const EXAM_ID = 'N5mrEby0gKLFs1y88DpM';
const SOURCE = 'authored-2026-08-netplus-pbq';

const D = {
    concepts: 'Networking Concepts',
    impl: 'Network Implementation',
    ops: 'Network Operations',
    sec: 'Network Security',
    trouble: 'Network Troubleshooting',
};

// Firestore rejects an array stored directly inside another array, so each
// accepted command sequence is wrapped. PBQQuestion.commandSequences() reads
// both this shape and the plain string[][] form.
const seq = (...cmds) => ({ steps: cmds });

const q = (o) => ({
    examId: EXAM_ID, source: SOURCE, type: 'pbq',
    difficulty: 'medium', bloomLevel: 'Apply', ...o,
});

/** One fill-table cell. Options are authored in whatever order reads best and
 *  are shuffled deterministically before the file is written. */
const f = (correctValue, ...options) => ({ correctValue, options });
const row = (label, ...fields) => ({ label, fields });

/** Builds the cross product of command variants into equal-length sequences.
 *  scorePBQ compares lengths before contents, so every accepted sequence in a
 *  question must have the same length — the cross product guarantees it. */
function seqProduct(...slots) {
    let acc = [[]];
    for (const slot of slots) {
        const next = [];
        for (const prefix of acc) for (const cmd of slot) next.push([...prefix, cmd]);
        acc = next;
    }
    return acc.map((s) => seq(...s));
}
/** Same, but accepting either order of two evidence-gathering steps whose
 *  order genuinely does not matter. */
function seqEitherOrder(slotA, slotB, ...rest) {
    return [...seqProduct(slotA, slotB, ...rest), ...seqProduct(slotB, slotA, ...rest)];
}

// ─── Deterministic shuffling ─────────────────────────────────────

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function shuffled(arr, rnd) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Reorders drag-drop items so the correctZone sequence is neither monotonic
 *  nor grouped by zone. PBQQuestion.tsx maps config.dragDrop.items in authored
 *  order and never shuffles, so authoring items in answer order lets a
 *  candidate drop item n on zone n. */
function interleaveItems(items, zones, rnd) {
    const zi = new Map(zones.map((z, i) => [z.id, i]));
    const idx = (it) => zi.get(it.correctZone);
    const counts = {};
    for (const it of items) counts[it.correctZone] = (counts[it.correctZone] || 0) + 1;
    const adjacencyAvoidable = Math.max(...Object.values(counts)) <= Math.ceil(items.length / 2);

    for (let attempt = 0; attempt < 20000; attempt++) {
        const cand = shuffled(items, rnd);
        const s = cand.map(idx);
        const nonDecreasing = s.every((v, i) => i === 0 || v >= s[i - 1]);
        const nonIncreasing = s.every((v, i) => i === 0 || v <= s[i - 1]);
        if (nonDecreasing || nonIncreasing) continue;
        if (adjacencyAvoidable && s.some((v, i) => i > 0 && v === s[i - 1])) continue;
        return cand;
    }
    throw new Error('could not interleave drag-drop items');
}

// ═══════════════ DRAG-DROP (6) ═══════════════
// Every item here has to be computed or inferred. An item that can be placed
// by spotting a keyword in its own label is not a PBQ decision, and the first
// version of this file had four of them.

function dragDropQuestions() {
    return [

        q({
            domain: D.concepts, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'A branch router carves 192.168.48.0/21 into four subinterfaces: VLAN 10 is 192.168.48.0/26, VLAN 20 is 192.168.48.64/27, VLAN 30 is 192.168.48.96/28, and VLAN 40 is 192.168.49.0/24. An audit pulled seven addresses out of DHCP reservations and static host files without recording which VLAN each came from. Place each address on the VLAN it is a usable host address on, or on the last zone if it cannot be assigned to a host at all.',
            explanation: 'Every answer comes from locating the address against its own prefix; the value of the last octet tells you nothing on its own. VLAN 10 is a /26, so it spans 192.168.48.0 through 192.168.48.63. That makes .62 its last usable host and .63 its broadcast address, which is why one of those two adjacent numbers can be assigned and the other cannot. VLAN 20 begins exactly where VLAN 10 ends, so 192.168.48.64 is a network address: an ordinary-looking number that no host may hold. Its usable range stops at .94, with .95 as its broadcast. VLAN 30 is a /28 covering .96 through .111, so .96 is again a network address while .110, fourteen steps further on, is a perfectly normal host. VLAN 40 is a plain /24, so .254 is its last host. The three unassignable addresses are the ones candidates place fastest and get wrong most often, because .63, .64 and .96 only become meaningful once you have worked out where each prefix starts and stops. Two pairs in this set exist to make that point: .62 and .63 are one apart and land in different zones, and so are .94 and .96 relative to their own boundaries.',
            pbqConfig: {
                pbqType: 'drag-drop', dragDrop: {
                    zones: [
                        { id: 'v10', label: 'VLAN 10 — 192.168.48.0/26' },
                        { id: 'v20', label: 'VLAN 20 — 192.168.48.64/27' },
                        { id: 'v30', label: 'VLAN 30 — 192.168.48.96/28' },
                        { id: 'v40', label: 'VLAN 40 — 192.168.49.0/24' },
                        { id: 'bad', label: 'Not assignable to a host' },
                    ],
                    items: [
                        { id: 'a62', label: '192.168.48.62', correctZone: 'v10' },
                        { id: 'a63', label: '192.168.48.63', correctZone: 'bad' },
                        { id: 'a64', label: '192.168.48.64', correctZone: 'bad' },
                        { id: 'a94', label: '192.168.48.94', correctZone: 'v20' },
                        { id: 'a96', label: '192.168.48.96', correctZone: 'bad' },
                        { id: 'a110', label: '192.168.48.110', correctZone: 'v30' },
                        { id: 'a254', label: '192.168.49.254', correctZone: 'v40' },
                    ],
                }
            },
        }),

        q({
            domain: D.concepts, difficulty: 'medium', bloomLevel: 'Apply',
            stem: 'A cabling contractor has quoted six runs for a campus refresh. Each run states its length, the speed it must carry, and the environment it passes through. Specify the medium for each. Do not over-specify: the cheapest medium that meets the requirement is the right answer, and reaching past it costs money that buys nothing.',
            explanation: 'Length and speed decide the medium; the environment decides whether it needs shielding. The 62 m run at 1 Gbps is well inside the 100 m reach of balanced twisted pair, so Cat 6 U/UTP carries it. The 70 m run is the one that catches people: Cat 6 supports 10GBASE-T only to roughly 55 m, so 70 m already requires Cat 6A, and sharing a tray with forty other cables is exactly the alien-crosstalk case the foiled F/UTP variant exists for. The two fibre runs answer different questions even though they land on the same medium. The 115 m camera run is about the ceiling on copper: balanced twisted pair stops at 100 m regardless of speed, so 115 m has to be fibre at any rate, and multimode is the cheaper of the two that reaches. The 340 m inter-IDF run is about the ceiling on multimode: 10GBASE-SR carries roughly 400 m on OM4, so it is still inside multimode reach and specifying single-mode there buys nothing and costs more in optics. Only the 3.5 km run is genuinely beyond multimode and needs OS2. The 3 m link inside one cabinet is what direct attach copper exists for — no optics to buy, lowest latency, lowest cost. The classic mistakes are treating Cat 6 and Cat 6A as interchangeable at 10 Gbps, and assuming that longer always means single-mode.',
            pbqConfig: {
                pbqType: 'drag-drop', dragDrop: {
                    zones: [
                        { id: 'cat6', label: 'Cat 6 U/UTP' },
                        { id: 'cat6a', label: 'Cat 6A F/UTP (shielded)' },
                        { id: 'om4', label: 'OM4 multimode fibre' },
                        { id: 'os2', label: 'OS2 single-mode fibre' },
                        { id: 'dac', label: 'Direct attach copper (twinax)' },
                    ],
                    items: [
                        { id: 'desk', label: '62 m, IDF to a desk, 1 Gbps, ordinary suspended ceiling', correctZone: 'cat6' },
                        { id: 'tray', label: '70 m, 10 Gbps over copper, bundled in one tray with forty other data cables', correctZone: 'cat6a' },
                        { id: 'gate', label: '115 m, IDF to a camera at the far edge of the car park, 1 Gbps', correctZone: 'om4' },
                        { id: 'idf', label: '340 m between two IDFs in the same building, 10 Gbps', correctZone: 'om4' },
                        { id: 'pump', label: '3.5 km across the site to the pump house, 10 Gbps', correctZone: 'os2' },
                        { id: 'cab', label: '3 m between two switches in one cabinet, 25 Gbps, lowest cost and latency', correctZone: 'dac' },
                    ],
                }
            },
        }),

        q({
            domain: D.impl, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'A survey of one long floor found eight 2.4 GHz access points in a row, AP-1 through AP-8. Every AP cell overlaps its immediate neighbours and its next-nearest neighbours on both sides. AP-1 is already on channel 6 and AP-2 is already on channel 11; both are in production and cannot be changed. Assign a channel to the remaining six so that no two overlapping cells share one.',
            explanation: 'In the 2.4 GHz band as deployed in North America only channels 1, 6 and 11 do not overlap, so this is a three-colouring of the overlap graph, and the two fixed APs make the answer unique rather than merely valid. AP-3 overlaps AP-1 on 6 and AP-2 on 11, which leaves 1. AP-4 overlaps AP-2 on 11 and AP-3 on 1, which leaves 6. From there the pattern repeats every three APs: AP-5 is 11, AP-6 is 1, AP-7 is 6, AP-8 is 11. Two mistakes are common and both are quiet. The first is reusing a channel at a distance of two, which looks clean on a floor plan but is precisely the co-channel contention this exercise exists to prevent: overlapping cells on the same channel do not fail visibly, they share airtime, and throughput halves while every indicator still reads green. The second is reaching for channels 3, 4 or 9 to spread things out, which overlaps two of the three usable channels at once and makes the problem worse rather than better. Widening a 2.4 GHz radio to 40 MHz does the same thing, consuming most of the band from one AP.',
            pbqConfig: {
                pbqType: 'drag-drop', dragDrop: {
                    zones: [
                        { id: 'ch1', label: 'Channel 1' },
                        { id: 'ch6', label: 'Channel 6' },
                        { id: 'ch11', label: 'Channel 11' },
                    ],
                    items: [
                        { id: 'ap3', label: 'AP-3', correctZone: 'ch1' },
                        { id: 'ap4', label: 'AP-4', correctZone: 'ch6' },
                        { id: 'ap5', label: 'AP-5', correctZone: 'ch11' },
                        { id: 'ap6', label: 'AP-6', correctZone: 'ch1' },
                        { id: 'ap7', label: 'AP-7', correctZone: 'ch6' },
                        { id: 'ap8', label: 'AP-8', correctZone: 'ch11' },
                    ],
                }
            },
        }),

        q({
            domain: D.trouble, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'VLAN 40 at this site is 10.60.4.0/23. Its router subinterface is 10.60.4.1, the site resolver is 10.60.9.53, and the DHCP scope hands out 10.60.4.50 through 10.60.5.200 with no exclusions. Below are six host configurations pulled off the VLAN. No test results are supplied — work out from each configuration alone what it will do wrong on this segment, and place it on that defect.',
            explanation: 'Nothing here can be answered by reading a symptom, because no symptoms are given; each configuration has to be measured against the segment it sits on. The host at 10.60.5.14 with a 255.255.255.0 mask believes its own subnet is 10.60.5.0/24, and its configured gateway 10.60.4.1 falls outside that, so it will ARP for a router it thinks is local, get nothing, and reach only the upper half of the segment. The host at 10.60.4.90 has the right mask and a gateway that is inside the /23 but is not the router, so its local traffic will be fine and everything off-segment will die waiting for an ARP reply that nobody sends. The 169.254 address with no gateway and no resolver is a host that never got a lease at all. The host at 10.60.4.120 is correct in every field except its resolver, which points at a public server the site does not permit outbound, so addresses will work and names will not. The last two are the pair that has to be read together: 10.60.4.62 appears twice, once configured statically and once handed out by DHCP, and .62 sits inside the scope with no exclusion covering it. Neither host is individually malformed, which is the point — the defect only exists in the relationship between them, and it presents as seconds-long dropouts that follow the address rather than either machine. Placing either of those two anywhere else means the collision was never spotted.',
            pbqConfig: {
                pbqType: 'drag-drop', dragDrop: {
                    zones: [
                        { id: 'mask', label: 'Subnet mask does not match the segment' },
                        { id: 'gw', label: 'Default gateway is not the segment router' },
                        { id: 'nolease', label: 'No DHCP lease was obtained' },
                        { id: 'dns', label: 'Resolver the site does not permit' },
                        { id: 'dup', label: 'Duplicate address on the segment' },
                    ],
                    items: [
                        { id: 'h514', label: '10.60.5.14 · mask 255.255.255.0 · gateway 10.60.4.1 · resolver 10.60.9.53', correctZone: 'mask' },
                        { id: 'h490', label: '10.60.4.90 · mask 255.255.254.0 · gateway 10.60.5.1 · resolver 10.60.9.53', correctZone: 'gw' },
                        { id: 'h169', label: '169.254.88.4 · mask 255.255.0.0 · no gateway · no resolver', correctZone: 'nolease' },
                        { id: 'h4120', label: '10.60.4.120 · mask 255.255.254.0 · gateway 10.60.4.1 · resolver 8.8.8.8, which the site blocks outbound', correctZone: 'dns' },
                        { id: 'h462s', label: '10.60.4.62 · mask 255.255.254.0 · gateway 10.60.4.1 · resolver 10.60.9.53 · entered by hand on the host', correctZone: 'dup' },
                        { id: 'h462d', label: '10.60.4.62 · mask 255.255.254.0 · gateway 10.60.4.1 · resolver 10.60.9.53 · held on a lease from the scope', correctZone: 'dup' },
                    ],
                }
            },
        }),

        q({
            domain: D.trouble, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Six wireless complaints came in from one building, and for each one the survey tool and the spectrum analyser were left running long enough to produce numbers. Only the readings are given. Place each set of readings on the condition that produces that particular combination of numbers.',
            explanation: 'The readings separate these, and no two of them look alike once you stop reading the complaint and start reading the numbers. A client at minus 86 dBm with 7 dB of signal to noise, negotiated down to the slowest rate the radio has, and no other AP audible anywhere near it, is simply too far from anything: that is a coverage hole, not interference. A client sitting four metres from one AP at minus 41 dBm while still associated to a far weaker one it walked past twenty minutes ago has plenty of coverage and is refusing to let go, which is a roaming problem living in the client, not the infrastructure. The two contention cases differ in one telling number. On the AP whose neighbours share its own channel, utilisation and retries are both high but frames still decode cleanly, because carrier sense makes those radios take turns rather than corrupt each other; that is co-channel contention, and its cost is airtime, not errors. On the AP whose strongest neighbours sit on channels 4 and 8, the frame check sequence error rate is high and retries climb with it, because partially overlapping channels put energy into the receiver that it cannot decode at all. The last two are both non-Wi-Fi, and each is caught by a mismatch: one shows 12 percent 802.11 utilisation against a band the analyser says is 85 percent busy, with the emission persisting when every AP is powered down; the other has excellent signal, excellent noise margin and almost no retries, yet throughput collapses at two fixed times a day, which no 802.11 condition explains.',
            pbqConfig: {
                pbqType: 'drag-drop', dragDrop: {
                    zones: [
                        { id: 'cochannel', label: 'Co-channel contention' },
                        { id: 'adjacent', label: 'Adjacent-channel interference' },
                        { id: 'coverage', label: 'Insufficient coverage at the client' },
                        { id: 'nonwifi', label: 'Non-802.11 energy in the band' },
                        { id: 'sticky', label: 'Client holding a distant AP instead of roaming' },
                    ],
                    items: [
                        { id: 'far', label: 'RSSI −86 dBm, SNR 7 dB, rate negotiated to 6 Mbps, no other AP audible above −90 dBm', correctZone: 'coverage' },
                        { id: 'stick', label: 'Associated to AP-7 at −79 dBm while standing 4 m from AP-12, which it hears at −41 dBm; the association has not moved in twenty minutes', correctZone: 'sticky' },
                        { id: 'cci', label: 'AP-3, channel 6: utilisation 78%, retries 9%, FCS error rate low, five same-SSID neighbours heard on channel 6 above −75 dBm', correctZone: 'cochannel' },
                        { id: 'aci', label: 'AP-9, channel 6: utilisation 71%, FCS error rate high and retries climbing with it, strongest neighbours above −70 dBm sit on channels 4 and 8', correctZone: 'adjacent' },
                        { id: 'cw', label: 'AP-14, channel 11: 802.11 utilisation 12%, analyser reports the band 85% busy with a continuous wideband emission centred on 2.44 GHz that persists with every AP powered off', correctZone: 'nonwifi' },
                        { id: 'pulse', label: 'Atrium clients: RSSI −58 dBm, SNR 31 dB, retries under 2%, throughput collapses for about forty minutes at 12:00 and again at 18:00 every weekday', correctZone: 'nonwifi' },
                    ],
                }
            },
        }),

        q({
            domain: D.ops, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Six DHCP scopes are listed with the subnet they serve, the pool they hand out, and what is known about the population on that VLAN. All six scopes live on one server pair, and all six VLANs are relayed to it. Work out which single defect each scope carries.',
            explanation: 'Two of these are arithmetic and the other four are read off the relationship between the scope and the network it serves. VLAN 12 offers 10.70.12.100 through .180, which is 81 addresses, against 254 devices that all want one at once — the pool runs out before lunch and the tail of the population sits on 169.254. VLAN 22 is the same failure with smaller numbers and a smaller subnet: a /25 stops at .127, the pool from .10 to .120 is 111 addresses, and 116 always-on devices will not fit into it. VLAN 14 hands out a router option of 10.70.14.1 while the router interface on that VLAN is 10.70.14.254, which is exactly the shape of a segment where clients lease normally and reach their neighbours and nothing else. VLAN 16 has two servers handing out ranges that overlap between 10.70.16.150 and 10.70.16.220 with no knowledge of each other, so the same address is issued twice and the collision surfaces later as intermittent drops rather than an immediate failure. VLAN 18 is the one whose evidence rules out the obvious answers: the server never records a request from that subnet at all, while other VLANs on the same server lease normally, so the scope is not exhausted and the server is not down — the request is not arriving. The guest scope holds roughly a thousand addresses and issues an eight-day lease to nine hundred visitors a day who stay under three hours, so it exhausts in about a day and stays exhausted for a week; the pool is not the defect, the lease length is.',
            pbqConfig: {
                pbqType: 'drag-drop', dragDrop: {
                    zones: [
                        { id: 'toosmall', label: 'Pool is too small for the population' },
                        { id: 'overlap', label: 'Two scopes issue the same addresses' },
                        { id: 'norelay', label: 'Requests never reach the server' },
                        { id: 'wrongrouter', label: 'Router option does not match the segment' },
                        { id: 'lease', label: 'Lease duration wrong for the population' },
                    ],
                    items: [
                        { id: 's12', label: 'VLAN 12 · 10.70.12.0/24 · pool .100–.180 · 214 laptops and 40 printers, all on at 08:30', correctZone: 'toosmall' },
                        { id: 's14', label: 'VLAN 14 · 10.70.14.0/24 · pool .50–.200 · router option 10.70.14.1 · the router subinterface on this VLAN is 10.70.14.254', correctZone: 'wrongrouter' },
                        { id: 's16', label: 'VLAN 16 · 10.70.16.0/23 · primary hands out 10.70.16.20–10.70.16.220, secondary hands out 10.70.16.150–10.70.17.100, neither knows of the other', correctZone: 'overlap' },
                        { id: 's18', label: 'VLAN 18 · 10.70.18.0/24 · pool .30–.250 · every client shows 169.254; the server logs no request from 10.70.18.0/24 at all, while VLAN 12 and VLAN 14 lease from it normally', correctZone: 'norelay' },
                        { id: 's20', label: 'Guest VLAN · 10.70.20.0/22 · pool 10.70.20.10–10.70.23.250 · 8-day lease · about 900 visitors a day, each on site under three hours', correctZone: 'lease' },
                        { id: 's22', label: 'VLAN 22 · 10.70.22.0/25 · pool .10–.120 · 96 thin clients and 20 desk phones, all always on', correctZone: 'toosmall' },
                    ],
                }
            },
        }),
    ];
}

// ═══════════════ ORDER-STEPS (5) ═══════════════
// initPBQState shuffles these, so the array below is the correct order. Each
// sequence is forced by dependency or by consequence — never by a methodology
// whose step names give away their own positions. The version of this file that
// asked a candidate to "isolate from the bottom of the OSI stack upward" and
// then listed the steps in layer order is gone for exactly that reason.

function orderStepsQuestions() {
    return [

        q({
            domain: D.impl, difficulty: 'hard', bloomLevel: 'Apply',
            stem: 'A failing access switch in a third-floor IDF is being replaced during a Saturday window. The floor carries data, voice and guest VLANs, and the switch is managed over a VLAN carried on its uplink. Put the technician’s actions in the order that leaves the shortest outage and the fewest ways to be stranded.',
            explanation: 'Each position here is forced by what is still available at that moment. The retiring switch is the only record of what plugs in where, so its configuration, its port-to-panel map and its address table have to come off while it is still forwarding — once the uplink moves, that information is gone and the rest of the window turns into guesswork. Firmware and leftover configuration are checked next because both are cheap to fix on a bench and expensive to discover after the uplink has moved: a replacement still carrying its last deployment’s VLANs will silently put ports in the wrong place. The VLAN database and trunk are built while the unit is isolated, because a half-configured switch connected to a live trunk is how a loop or a VLAN leak gets introduced. The uplink then moves before any access port does, because until the trunk is up and carrying every VLAN the old switch carried, a moved access port has nowhere to send anything and every test you run will fail for the wrong reason. Moving one panel and proving a client on it gets a lease and reaches its gateway is what turns a whole-floor failure into a one-panel failure; repeating that check per panel keeps it that way. Documentation is last only because it records what actually happened, and the serial and firmware level are not known until the unit is in service. The common ordering error is building the replacement first and capturing the old configuration afterwards, which works right up until the old switch does not come back.',
            pbqConfig: {
                pbqType: 'order-steps', orderSteps: {
                    steps: [
                        'Capture the retiring switch’s running configuration, its port-to-panel map and its address table while it is still forwarding traffic.',
                        'Confirm the replacement is on the site’s approved firmware release and holds no configuration left over from its last deployment.',
                        'Build the VLAN database and the uplink trunk on the replacement while it is still isolated from the production network.',
                        'Move the uplink to the replacement and confirm the trunk comes up carrying every VLAN the retiring switch carried.',
                        'Move one patch panel of access ports, then prove a client on that panel receives a lease and reaches its default gateway.',
                        'Move the remaining panels, repeating the same lease and gateway check on each one before starting the next.',
                        'Update the port map and the asset record with the replacement’s serial number and firmware level, and close the change.',
                    ],
                }
            },
        }),

        q({
            domain: D.concepts, difficulty: 'medium', bloomLevel: 'Understand',
            stem: 'A workstation with no cached configuration is powered on, plugged into an access port, and the user immediately opens an internal HTTPS site by name. The site resolver and the DHCP server both sit on other subnets. Put the exchanges in the order they must occur on the wire.',
            explanation: 'Nothing in this chain can happen before the thing it depends on. The host starts with no address, so its first transmission has to be a broadcast that needs no address to send and no routing to reach a server — which is why the relay, not the host, is what carries the request off the subnet. The offer, the request and the acknowledgement complete the lease and are what first give the host a mask, a router and a resolver. Only after it has accepted an address does it defend it, by probing for anyone else already holding it. Resolution cannot come earlier: the resolver is on another subnet, so the host must first learn the hardware address of its own default gateway, and it cannot do that before it has an address and a mask of its own to decide the gateway is off-link. The name is then resolved to an address, the address is what the transport layer connects to, and the certificate is validated as part of establishing that encrypted session — the HTTP request is the last thing on the wire, not the first, and it travels inside a session that already exists. The two mistakes worth naming are putting resolution before the lease, which asks a host with no address to reach a server on another subnet, and putting the ARP for the gateway before the address is assigned, which asks the host to decide something is off-link before it knows where its own link ends.',
            pbqConfig: {
                pbqType: 'order-steps', orderSteps: {
                    steps: [
                        'The interface reaches link and the host broadcasts a DHCP discover, having no address of its own to send from.',
                        'The router’s relay forwards that broadcast to the server on another subnet, which answers with an offer carrying an address, mask, router and resolver.',
                        'The host broadcasts a request for the offered address and the server returns an acknowledgement.',
                        'The host probes the segment for the address it has just accepted, hears no reply, and keeps it.',
                        'The host resolves the hardware address of its default gateway, because the resolver it was given is not on its own subnet.',
                        'The resolver is queried for the site name and returns an address record.',
                        'A three-way handshake opens a transport connection to port 443 on the address that came back.',
                        'The server’s certificate chain is validated during the TLS handshake, and the HTTP request is sent inside the session that results.',
                    ],
                }
            },
        }),

        q({
            domain: D.ops, difficulty: 'hard', bloomLevel: 'Apply',
            stem: 'The single core switch at a 60-person site is due a firmware upgrade to close a defect that affects it. There is no second core switch and no maintenance contract that would replace it overnight. Put the work in the order that keeps a way back at every point.',
            explanation: 'Order here is decided by what each step protects and by what has to be true before the next one is safe. The configuration backup comes first because it is the only step that is worth anything if the device does not come back, and it costs nothing to take. Reading the target release against the features this site actually runs comes before anyone is told about a window, because that reading can end the change: announcing a window and then abandoning the release burns credibility and a Saturday. Notification and a change freeze follow, because from that point other people are relying on the site being stable and on nobody else touching it. Staging the image during the business day before the window is deliberate: copying an image is harmless while the device runs on the old one, and verifying the published hash catches a truncated or substituted file at the only time when discovering it is cheap. The reboot happens inside the window with console access held open, because console is what remains when the management path is the thing that failed to come up. Verification is against the site’s own services rather than the version banner, since a switch can boot the new image perfectly and still not pass a lease, reach a gateway or re-establish a routing adjacency. Documentation closes it, and the rollback image left on the device is part of what gets recorded, because the next person needs to know it is there. Reversing the backup and the release assessment is the ordering that most often looks fine and is not: it puts the irreversible step ahead of the cheap one.',
            pbqConfig: {
                pbqType: 'order-steps', orderSteps: {
                    steps: [
                        'Take a configuration backup off the device and confirm the copy is complete and readable somewhere other than the device.',
                        'Read the target release’s known-issue list against the features this site actually runs, and abandon the release if it regresses one of them.',
                        'Notify the affected users of the window and freeze other changes to this site for its duration.',
                        'During the business day before the window, copy the image onto the device and verify its hash against the vendor’s published value.',
                        'Inside the window, reboot into the new image with console access held open on the device.',
                        'Prove the site’s own services are back — a client lease, a gateway reachability test, and the uplink routing adjacency — before releasing the window.',
                        'Record the release, the verification results and the rollback image left on the device, and close the change.',
                    ],
                }
            },
        }),

        q({
            domain: D.trouble, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'A newly installed 10 Gbps fibre run between two IDFs shows no link at either end. Both switches report the transceivers as present. Put the actions in the order that measures before it disturbs and eliminates the most for the least effort.',
            explanation: 'The ordering rule is that nothing gets disturbed before it has been measured, because unplugging a connector destroys the reading you were about to take. Confirming that both ends carry the same type, wavelength and reach, and that each switch supports the module it holds, is free and eliminates a whole class of faults without touching the link — a long-reach module facing a short-reach one, or an unsupported third-party module, presents exactly as no link. Reading transmit and receive power at both ends as the link sits is the single most informative measurement available, and it is only available once: it tells you whether light is being generated, whether it is arriving, and therefore whether the fault is in the equipment or the glass. Reversing the strands at one end comes next because it is the cheapest reversible change there is, and a pair run straight through where a crossover is needed shows healthy transmit power at both ends and no link at all — the exact signature the previous reading would have produced. Cleaning and re-seating follows because it addresses low receive power specifically, and contamination is the most common cause of it. Only when those are exhausted is it worth measuring the permanent link against the loss budget for its length and connector count, and only when the budget is exceeded is there any point tracing the run to put a distance on the event. Recording the numbers last is what gives the next fault something to compare against; an undocumented link has to be characterised from scratch every time.',
            pbqConfig: {
                pbqType: 'order-steps', orderSteps: {
                    steps: [
                        'Confirm both ends carry transceivers of matching type, wavelength and reach, and that each switch supports the module it is holding.',
                        'Read transmit and receive power at both ends exactly as the link sits, before any connector is disturbed.',
                        'Reverse the two strands at one end, since a pair run straight through presents with healthy transmit power and no link at all.',
                        'Inspect both end faces with a fibre scope, clean them, re-seat the connectors and read receive power again.',
                        'Measure the permanent link with a light source and power meter and compare the result against the loss budget for its length and connector count.',
                        'Trace the run to put a distance on the event consuming the budget, and give that distance to the cabling contractor.',
                        'Record the launch power, receive power and total measured loss on the link record so the next fault has a baseline.',
                    ],
                }
            },
        }),

        q({
            domain: D.sec, difficulty: 'hard', bloomLevel: 'Evaluate',
            stem: 'A site is introducing port-based authentication on its access ports. It has printers, badge readers and cameras that predate the decision, and the network team manages every switch across the same network they are about to start authenticating. Put the rollout in the order that avoids locking out either the devices or the team.',
            explanation: 'The order is set by what each step makes safe for the next. An inventory of what actually attaches to the access ports comes first because the whole risk of this project lives in the devices that cannot present credentials, and you cannot plan around a population you have not counted. The authentication server, its certificate and one proven end-to-end test port come next, because every later failure is ambiguous until at least one success exists to compare against — without it, a failing port could be the switch, the server, the certificate or the client. Deciding what an unauthenticated port does, and configuring that restricted fallback, has to precede enforcement rather than follow it: if the fallback is built afterwards, the first enforced port with a problem has nowhere to put the device and the outage is total instead of degraded. Monitor-only mode across one IDF then produces the real list of what would have failed, at zero cost to users, which is the only honest way to size the exception list. Reading those logs and granting documented exceptions to the devices that genuinely cannot authenticate is what makes enforcement survivable. Enforcement starts on the pilot IDF, with the uplink and the management path left out, because that is the mistake that ends with a technician driving to the site. Rolling forward IDF by IDF, re-reading the logs after each one, keeps every remaining failure small. Turning enforcement on before monitor mode has been read is the ordering that reliably takes the printers off the network on a Monday morning.',
            pbqConfig: {
                pbqType: 'order-steps', orderSteps: {
                    steps: [
                        'Inventory everything attached to the access ports, singling out devices that cannot present credentials of their own.',
                        'Stand up the authentication server and its certificate, and prove one test port authenticates a known-good client end to end.',
                        'Decide what an unauthenticated port is allowed to reach, and configure that restricted fallback before any port enforces anything.',
                        'Enable authentication in monitor-only mode across one pilot IDF, so failures are logged and nothing is denied.',
                        'Read the monitor-mode logs, and give every device that genuinely cannot authenticate a documented exception.',
                        'Turn on enforcement in the pilot IDF, leaving the uplink and the management path out of scope so a mistake cannot cut off the team.',
                        'Roll enforcement forward one IDF at a time, re-reading the logs from each before starting the next.',
                    ],
                }
            },
        }),
    ];
}

// ═══════════════ FILL-TABLE (9) ═══════════════
// Three of these are built as PROBE -> REPAIR -> RE-PROBE, which is the shape
// of the demo simulation's fourteen scored slots: points for going and looking
// before anything is touched, an independent decision per configuration line,
// and a re-test that punishes over-fixing. Options are authored in whatever
// order reads best and shuffled deterministically before the file is written.

function fillTablesA() {
    return [

        q({
            domain: D.sec, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Branch router BR1 filters traffic sourced by the user VLAN 10.10.20.0/24 with the seven-line list below, applied inbound on that subinterface; first match wins. The server VLAN 10.10.30.0/24 sits behind the same router, and 203.0.113.20 is a public web server. THE BRANCH STANDARD — every user host resolves names through 10.10.30.53 and no other resolver; user hosts may reach the server VLAN on TCP 80, 443, 143 and 993 and on nothing else; the two administration workstations, 10.10.20.8 and 10.10.20.9, may open SSH to the server VLAN, and no other host may open SSH to anything; user hosts may reach the internet on TCP 80 and 443 only; the training lab, 10.10.20.192/26, may reach nothing beyond its own subnet. THE DEPLOYED LIST — (1) deny · 10.10.20.192/27 to any · any port. (2) permit · 10.10.20.0/24 to 10.10.30.53 · UDP 53. (3) deny · 10.10.20.0/24 to any · TCP 22. (4) permit · 10.10.20.8/31 to 10.10.30.0/24 · TCP 22. (5) permit · 10.10.20.0/24 to 10.10.30.0/24 · any port. (6) permit · 10.10.20.0/24 to any · any port. (7) deny · any to any · any port. No test results are supplied. Work out what each probe returns against the list exactly as it stands, decide line by line what has to change to bring the list in line with the standard — changing nothing the standard does not require — then work out what the same probes return once your repairs are in place.',
            explanation: 'Trace the probes first, because each one exposes a different defect and none of them is stated anywhere. The ordinary user reaching a public site on 443 falls past every line until line 6, which permits that subnet to anything — so browsing works, and the fact that it works is what hides the rest. The administrator opening SSH to a server is stopped by line 3, which denies TCP 22 from the whole /24 to any destination and sits above the permit written for exactly those two workstations; line 4 can therefore never match, and a rule that can never match is the hardest kind to notice because nothing logs it. The lab host at 10.10.20.240 reaching a server on 443 is the probe that requires arithmetic: line 1 quarantines 10.10.20.192/27, which is .192 through .223 only, so .240 is not covered by it at all and falls through to line 5, which permits the entire user subnet to the entire server VLAN. The lab is quarantined on paper and not in the list. The fourth probe, RDP from an ordinary user into a server, is permitted by that same line 5, because it permits every port rather than the four the standard names. The repairs follow from those four traces. Line 1 has the wrong mask and needs /26 so it covers the whole lab; leaving it and adding a second deny elsewhere would work but is not offered, and removing it abandons the quarantine entirely. Line 4 is correct in content and wrong in position, so it moves above line 3 — the conventional repair is to promote the specific permit rather than demote the general deny, which keeps the deny protecting every host it was written for. Lines 5 and 6 are both too broad and are narrowed to the ports the standard names; deleting either instead is the expensive mistake, because deleting line 5 takes mail and the intranet away from the whole site and deleting line 6 takes the internet away with it. Lines 2, 3 and 7 are already what the standard asks for, and every one of them is a trap for someone repairing enthusiastically: line 3 reads like the cause of the administrator problem and is not, line 2 looks narrow enough to widen and is exactly right, and line 7 is the explicit deny that makes drops visible in the log instead of silently absorbed. The re-probes are the proof. Administrator SSH now matches the promoted permit; the lab host is now caught by the corrected quarantine; RDP now falls all the way to the final deny; and ordinary browsing on 443 is still permitted, which is the row that fails for anyone who repaired by deleting.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Result or repair'],
                    rows: [
                        row('PROBE 1 · from 10.10.20.44, TCP 443 to 203.0.113.20',
                            f('Permitted by line 6', 'Permitted by line 6', 'Permitted by line 5', 'Denied by line 3', 'Denied by line 7')),
                        row('PROBE 2 · from 10.10.20.9 (administration workstation), TCP 22 to 10.10.30.15',
                            f('Denied by line 3', 'Denied by line 3', 'Permitted by line 4', 'Permitted by line 5', 'Denied by line 7')),
                        row('PROBE 3 · from 10.10.20.240 (training lab), TCP 443 to 10.10.30.20',
                            f('Permitted by line 5', 'Permitted by line 5', 'Denied by line 1', 'Permitted by line 6', 'Denied by line 7')),
                        row('PROBE 4 · from 10.10.20.44, TCP 3389 to 10.10.30.20',
                            f('Permitted by line 5', 'Permitted by line 5', 'Denied by line 3', 'Permitted by line 6', 'Denied by line 7')),

                        row('LINE 1 · deny · 10.10.20.192/27 → any · any',
                            f('Change the source to 10.10.20.192/26', 'Change the source to 10.10.20.192/26', 'Keep unchanged', 'Remove the line', 'Move it below line 5')),
                        row('LINE 2 · permit · 10.10.20.0/24 → 10.10.30.53 · UDP 53',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the line', 'Change the destination to 10.10.30.0/24', 'Change the protocol to TCP 53')),
                        row('LINE 3 · deny · 10.10.20.0/24 → any · TCP 22',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the line', 'Change the destination to 10.10.30.0/24', 'Move it above line 2')),
                        row('LINE 4 · permit · 10.10.20.8/31 → 10.10.30.0/24 · TCP 22',
                            f('Move it above line 3', 'Move it above line 3', 'Keep unchanged', 'Remove the line', 'Change the source to 10.10.20.0/24')),
                        row('LINE 5 · permit · 10.10.20.0/24 → 10.10.30.0/24 · any',
                            f('Narrow it to TCP 80, 443, 143 and 993', 'Narrow it to TCP 80, 443, 143 and 993', 'Keep unchanged', 'Remove the line', 'Move it above line 3')),
                        row('LINE 6 · permit · 10.10.20.0/24 → any · any',
                            f('Narrow it to TCP 80 and 443', 'Narrow it to TCP 80 and 443', 'Keep unchanged', 'Remove the line', 'Change the source to 10.10.20.0/25')),
                        row('LINE 7 · deny · any → any · any',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the line', 'Move it above line 6')),

                        row('RE-PROBE 1 · from 10.10.20.9, TCP 22 to 10.10.30.15, after your repairs',
                            f('Permitted by the administrator SSH permit', 'Permitted by the administrator SSH permit', 'Denied by the SSH deny', 'Denied by the final deny', 'Permitted by the server-VLAN permit')),
                        row('RE-PROBE 2 · from 10.10.20.240, TCP 443 to 10.10.30.20, after your repairs',
                            f('Denied by the lab quarantine', 'Denied by the lab quarantine', 'Permitted by the server-VLAN permit', 'Permitted by the internet permit', 'Denied by the final deny')),
                        row('RE-PROBE 3 · from 10.10.20.44, TCP 3389 to 10.10.30.20, after your repairs',
                            f('Denied by the final deny', 'Denied by the final deny', 'Permitted by the server-VLAN permit', 'Denied by the SSH deny', 'Permitted by the internet permit')),
                        row('RE-PROBE 4 · from 10.10.20.44, TCP 443 to 203.0.113.20, after your repairs',
                            f('Permitted by the internet permit', 'Permitted by the internet permit', 'Denied by the final deny', 'Permitted by the server-VLAN permit', 'Denied by the lab quarantine')),
                    ],
                }
            },
        }),

        q({
            domain: D.trouble, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Router R1 holds seven entries. Longest prefix wins, and where two entries carry the same prefix the lower administrative distance wins. THE TABLE — (A) 0.0.0.0/0 via 203.0.113.1, distance 1, static. (B) 10.40.0.0/16 via 10.40.255.2, distance 110, OSPF. (C) 10.40.8.0/24 via 10.40.255.6, distance 110, OSPF. (D) 10.40.8.128/26 via 10.40.255.10, distance 1, static. (E) 10.40.9.0/24 via 10.40.255.14, distance 1, static. (F) 10.40.9.0/24 via 10.40.255.18, distance 110, OSPF. (G) 10.40.8.0/22 via 203.0.113.1, distance 1, static. WHAT THE SITE RECORDS SAY — branch BR-2 sits behind 10.40.255.10 and serves the whole of 10.40.8.128/25; the subnet 10.40.9.0/24 used to be reached over the circuit at 10.40.255.14, which was decommissioned three weeks ago, and is now advertised into OSPF by the router at 10.40.255.18; the campus subnets 10.40.10.0/24 and 10.40.11.0/24 are learned through OSPF from 10.40.255.2; 203.0.113.1 is the internet edge. No traceroutes are supplied. Work out which entry forwards each probe as the table stands, decide entry by entry what has to change, then work out where the same probes go afterwards.',
            explanation: 'The probes are what turn a plausible-looking table into three located faults. A packet for 10.40.8.200 does not match entry D, because D is a /26 and covers only .128 through .191 — so it falls to the /24 in entry C and leaves through 10.40.255.6, which is the campus, not the branch. That is the whole of the BR-2 outage, and the mask is one bit away from correct. A packet for 10.40.8.150 does match D, which is exactly why the fault looks intermittent from the help desk: half the branch works. A packet for 10.40.9.75 matches two entries with the same prefix, so administrative distance decides and the static in entry E wins over the OSPF route in entry F at 110 — and E points into a circuit that was removed three weeks ago, so the traffic is discarded by a route that is still installed and still preferred. A packet for 10.40.10.30 is the trap that catches people who stop at entry B: the /22 in entry G covers 10.40.8.0 through 10.40.11.255, which is longer than the /16, so campus traffic is being handed to the internet edge. Entry G is a summary written for convenience that quietly outranks the routing protocol across four subnets. The repairs are therefore one mask correction and two deletions: D becomes a /25 so it covers the branch it was written for, E goes because its next hop no longer exists and its only effect is to mask the live path, and G goes because nothing in the records asks for it and it black-holes the campus. Entries A, B, C and F are correct and each is a plausible thing to touch by mistake. Removing A takes the internet away and does not affect any of the reported faults. Widening B, or repointing C, changes routes that are being learned correctly by the protocol. Lowering F to distance 1 would appear to fix 10.40.9.0/24 while leaving the dead static installed alongside it, which is a coin toss rather than a repair. The re-probes confirm all three: the branch prefix now reaches 10.40.255.10, 10.40.9.0/24 falls through to the OSPF path at 10.40.255.18, campus traffic returns to 10.40.255.2 — and the internet probe still leaves through 203.0.113.1, which is the row that catches anyone who removed the default route while tidying up.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Entry used, or repair'],
                    rows: [
                        row('PROBE 1 · a packet for 10.40.8.200',
                            f('Entry C — next hop 10.40.255.6', 'Entry C — next hop 10.40.255.6', 'Entry D — next hop 10.40.255.10', 'Entry G — next hop 203.0.113.1', 'Entry B — next hop 10.40.255.2')),
                        row('PROBE 2 · a packet for 10.40.8.150',
                            f('Entry D — next hop 10.40.255.10', 'Entry D — next hop 10.40.255.10', 'Entry C — next hop 10.40.255.6', 'Entry G — next hop 203.0.113.1', 'Entry B — next hop 10.40.255.2')),
                        row('PROBE 3 · a packet for 10.40.9.75',
                            f('Entry E — next hop 10.40.255.14', 'Entry E — next hop 10.40.255.14', 'Entry F — next hop 10.40.255.18', 'Entry B — next hop 10.40.255.2', 'Entry A — next hop 203.0.113.1')),
                        row('PROBE 4 · a packet for 10.40.10.30',
                            f('Entry G — next hop 203.0.113.1', 'Entry G — next hop 203.0.113.1', 'Entry B — next hop 10.40.255.2', 'Entry C — next hop 10.40.255.6', 'Entry A — next hop 203.0.113.1')),

                        row('ENTRY A · 0.0.0.0/0 via 203.0.113.1 [1/0] static',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the entry', 'Change the next hop to 10.40.255.2')),
                        row('ENTRY B · 10.40.0.0/16 via 10.40.255.2 [110/20] OSPF',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the entry', 'Change the prefix to 10.40.0.0/8')),
                        row('ENTRY C · 10.40.8.0/24 via 10.40.255.6 [110/30] OSPF',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the entry', 'Change the next hop to 10.40.255.10')),
                        row('ENTRY D · 10.40.8.128/26 via 10.40.255.10 [1/0] static',
                            f('Change the prefix to 10.40.8.128/25', 'Change the prefix to 10.40.8.128/25', 'Keep unchanged', 'Remove the entry', 'Change the next hop to 10.40.255.6')),
                        row('ENTRY E · 10.40.9.0/24 via 10.40.255.14 [1/0] static',
                            f('Remove the entry', 'Remove the entry', 'Keep unchanged', 'Change the next hop to 10.40.255.18', 'Change the prefix to 10.40.9.0/25')),
                        row('ENTRY F · 10.40.9.0/24 via 10.40.255.18 [110/40] OSPF',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the entry', 'Change the administrative distance to 1')),
                        row('ENTRY G · 10.40.8.0/22 via 203.0.113.1 [1/0] static',
                            f('Remove the entry', 'Remove the entry', 'Keep unchanged', 'Change the next hop to 10.40.255.2', 'Change the prefix to 10.40.8.0/21')),

                        row('RE-PROBE 1 · a packet for 10.40.8.200, after your repairs',
                            f('Entry D — next hop 10.40.255.10', 'Entry D — next hop 10.40.255.10', 'Entry C — next hop 10.40.255.6', 'Entry B — next hop 10.40.255.2', 'Discarded — no matching entry')),
                        row('RE-PROBE 2 · a packet for 10.40.9.75, after your repairs',
                            f('Entry F — next hop 10.40.255.18', 'Entry F — next hop 10.40.255.18', 'Entry E — next hop 10.40.255.14', 'Entry B — next hop 10.40.255.2', 'Discarded — no matching entry')),
                        row('RE-PROBE 3 · a packet for 10.40.10.30, after your repairs',
                            f('Entry B — next hop 10.40.255.2', 'Entry B — next hop 10.40.255.2', 'Entry G — next hop 203.0.113.1', 'Entry C — next hop 10.40.255.6', 'Discarded — no matching entry')),
                        row('RE-PROBE 4 · a packet for 198.51.100.7, after your repairs',
                            f('Entry A — next hop 203.0.113.1', 'Entry A — next hop 203.0.113.1', 'Entry B — next hop 10.40.255.2', 'Entry G — next hop 203.0.113.1', 'Discarded — no matching entry')),
                    ],
                }
            },
        }),

        q({
            domain: D.concepts, difficulty: 'hard', bloomLevel: 'Apply',
            stem: 'A branch has been allocated 10.80.16.0/21 and must be subnetted with variable-length masks, largest requirement first, packed from the start of the block with no space left between allocations. The requirements are 500 data hosts at site A, 200 data hosts at site B, 100 voice endpoints, 60 guest wireless clients and 25 management interfaces. Complete the allocation.',
            explanation: 'Size each requirement to the smallest prefix that holds it, then lay them down in order without leaving gaps, and the boundaries are forced. Five hundred hosts do not fit in a /24, which offers 254, so site A takes a /23 and its 510 usable addresses: 10.80.16.0/23 spans 10.80.16.0 through 10.80.17.255, first host .16.1, broadcast .17.255. That last value is the one most often written as 10.80.16.255, which is a perfectly ordinary host address inside a /23 and not a boundary at all. Site B needs a /24 and starts where site A ends, at 10.80.18.0, running to 10.80.18.255. Voice needs 100, so a /25 with 126 usable: 10.80.19.0/25, first host .1, broadcast .127. Guest needs 60, and this is where the arithmetic bites — a /26 gives 62 usable, which fits, while a /27 gives 30 and does not, so guest takes 10.80.19.128/26 with its broadcast at .191. Management needs 25, and a /27 with 30 usable is the smallest that holds it: 10.80.19.192/27, first host .193, broadcast .223. Two families of error account for almost every wrong answer here. The first is the off-by-one at each end: offering the network address as the first usable host, or the last usable host as the broadcast. The second is sizing by rounding down — reading 60 as "about 32" or 500 as "about 256" — which produces a plan that looks tidy and runs out of addresses in its first week.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['CIDR prefix', 'First usable host', 'Broadcast address'],
                    rows: [
                        row('Site A data — 500 hosts',
                            f('10.80.16.0/23', '10.80.16.0/23', '10.80.16.0/22', '10.80.16.0/24', '10.80.16.0/25'),
                            f('10.80.16.1', '10.80.16.1', '10.80.16.0', '10.80.17.1', '10.80.16.2'),
                            f('10.80.17.255', '10.80.17.255', '10.80.16.255', '10.80.17.254', '10.80.23.255')),
                        row('Site B data — 200 hosts',
                            f('10.80.18.0/24', '10.80.18.0/24', '10.80.17.0/24', '10.80.18.0/23', '10.80.19.0/24'),
                            f('10.80.18.1', '10.80.18.1', '10.80.18.0', '10.80.18.2', '10.80.17.255'),
                            f('10.80.18.255', '10.80.18.255', '10.80.18.254', '10.80.19.255', '10.80.18.128')),
                        row('Voice — 100 endpoints',
                            f('10.80.19.0/25', '10.80.19.0/25', '10.80.19.0/24', '10.80.19.0/26', '10.80.20.0/25'),
                            f('10.80.19.1', '10.80.19.1', '10.80.19.0', '10.80.19.2', '10.80.19.129'),
                            f('10.80.19.127', '10.80.19.127', '10.80.19.128', '10.80.19.126', '10.80.19.255')),
                        row('Guest wireless — 60 clients',
                            f('10.80.19.128/26', '10.80.19.128/26', '10.80.19.128/25', '10.80.19.128/27', '10.80.19.192/26'),
                            f('10.80.19.129', '10.80.19.129', '10.80.19.128', '10.80.19.130', '10.80.19.192'),
                            f('10.80.19.191', '10.80.19.191', '10.80.19.192', '10.80.19.190', '10.80.19.255')),
                        row('Management — 25 interfaces',
                            f('10.80.19.192/27', '10.80.19.192/27', '10.80.19.192/26', '10.80.19.192/28', '10.80.19.224/27'),
                            f('10.80.19.193', '10.80.19.193', '10.80.19.192', '10.80.19.194', '10.80.19.224'),
                            f('10.80.19.223', '10.80.19.223', '10.80.19.224', '10.80.19.222', '10.80.19.255')),
                    ],
                }
            },
        }),
    ];
}

function fillTablesB() {
    return [

        q({
            domain: D.trouble, difficulty: 'medium', bloomLevel: 'Analyze',
            stem: 'Six access-switch ports were pulled for review, each with the counters and log entries that were collected from the switch itself. No conclusions were recorded. For each port, choose the cause its own numbers support.',
            explanation: 'Each of these is decided by one number that the other candidates cannot explain. Late collisions on a port running half duplex, while the host at the other end insists it is full duplex, is the signature of a duplex mismatch and of nothing else: a genuine cable fault does not make one end half and the other full, and a loop does not produce late collisions on a single port. On the second port the link is clean at gigabit full duplex with no collisions at all, yet input and frame-check errors climb steadily under ordinary load, and the run passes through a lift machine room — errors without collisions on a full-duplex link mean corruption on the medium, not a negotiation problem. The third port cycles up and down every twenty to forty seconds while the attached device wants 22 W and the switch has 9 W left to give: the port powers the device, the budget is exceeded, power is withdrawn, and the cycle repeats. The fourth port has discards and no errors, which is the important distinction — errors mean frames arrived damaged, discards mean frames arrived fine and there was nowhere to put them, and confined to the backup window that is congestion rather than a fault. The fifth port shows one source address learned alternately in two places several times a second with broadcast counters rising everywhere at once, which is a loop: a duplicate IP address moves between two hardware addresses on one port, not one address between two ports. The sixth is the quiet one, because every counter is healthy. The host links, passes nothing, and gets no lease, while its neighbours in the same VLAN on this switch reach each other and nothing in that VLAN is reachable from any other switch — the VLAN exists locally and is not carried across the uplink, so the DHCP server on another subnet never hears from it. A cable fault would show errors, and a missing scope would not explain why the VLAN works within this switch.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Cause the counters support'],
                    rows: [
                        row('Port 3 · up at 100 Mbps half duplex · 2,140 late collisions and 1,987 FCS errors · the attached host reports the link as 1000 Mbps full duplex',
                            f('Duplex mismatch between the port and the host', 'Duplex mismatch between the port and the host', 'A failing cable or connector', 'A switching loop on the segment', 'No remaining power budget on the switch')),
                        row('Port 7 · up at 1000 Mbps full duplex · zero collisions · input and FCS error counters climbing steadily under ordinary load · the 96 m run passes through a lift machine room',
                            f('A failing cable, or a noise source along the run', 'A failing cable, or a noise source along the run', 'Duplex mismatch between the port and the host', 'Congestion on the uplink', 'The port’s VLAN is not carried across the uplink')),
                        row('Port 11 · link cycles up and down every 20 to 40 seconds · the attached camera is a 22 W device and the switch reports 9 W of unallocated power',
                            f('The switch has no remaining power budget for this device', 'The switch has no remaining power budget for this device', 'A failing cable or connector', 'Duplex mismatch between the port and the host', 'A switching loop on the segment')),
                        row('Port 15 · 1 Gbps · output discards climbing every night between 01:00 and 03:00 · zero errors of any kind · the only traffic in that window is a backup job',
                            f('Congestion — more is offered than the port can send', 'Congestion — more is offered than the port can send', 'A failing cable or connector', 'Duplex mismatch between the port and the host', 'A switching loop on the segment')),
                        row('Port 19 · the same source address is learned alternately on port 19 and port 22 several times a second, and broadcast counters are rising together on every port',
                            f('A switching loop is flooding the segment', 'A switching loop is flooding the segment', 'Two hosts hold the same IP address', 'Duplex mismatch between the port and the host', 'Congestion — more is offered than the port can send')),
                        row('Port 23 · up at 1000 Mbps full duplex, no errors, no discards · the host gets no lease and passes no traffic · its VLAN 60 neighbours on this switch reach one another, and nothing in VLAN 60 is reachable from any other switch',
                            f('The port’s VLAN is not carried across the uplink', 'The port’s VLAN is not carried across the uplink', 'A failing cable or connector', 'No DHCP scope exists for this VLAN', 'Duplex mismatch between the port and the host')),
                    ],
                }
            },
        }),

        q({
            domain: D.ops, difficulty: 'hard', bloomLevel: 'Evaluate',
            stem: 'Five links are up for review at the quarterly capacity meeting. For each one you have a week of monitoring data and nothing else. Decide what the data supports doing about that link, and nothing more than it supports.',
            explanation: 'Capacity decisions go wrong when a number is read without the numbers beside it. Link A sits at 62 percent at the ninety-fifth percentile with no errors and modest growth, which is comfortable headroom: acting on it spends money to solve a problem that will not exist for years. Link B has spent eleven consecutive weeks at 94 percent inbound with output queue drops rising, which is what genuine sustained exhaustion looks like — the queue drops are the users noticing — and it is the only link here that a circuit upgrade actually fixes. Link C is the trap: 44,000 input errors in a week is alarming, but the interface is running at 4 percent of a ten-gigabit link, so no upgrade can help. Errors at low utilisation are a physical-layer fault, and buying more bandwidth for a damaged link means paying to carry the same corrupted frames faster. Link D shows 31 percent at the ninety-fifth percentile, which would ordinarily mean no action — but percentile sampling smooths away bursts, and 200-millisecond spikes to 100 percent at a fixed time every weekday will destroy voice while leaving the average untouched. The fix is to give voice priority and hold the update traffic back, not to add bandwidth that the burst will fill just as completely. Link E is at 88 percent, close enough to Link B to be mistaken for it, except that 61 percent of the bytes belong to one job running in the middle of the afternoon. Moving that job out of the busy period is free and recovers more headroom than an upgrade would; buying a bigger circuit to carry a backup at 14:00 is the most expensive way to avoid a scheduling conversation.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Action the data supports'],
                    rows: [
                        row('Link A · 1 Gbps · 95th percentile 62% in, 18% out · zero errors · 14% growth year on year',
                            f('No action — this is inside headroom', 'No action — this is inside headroom', 'Order a circuit upgrade this quarter', 'Investigate the physical layer', 'Move the heaviest traffic out of the busy period')),
                        row('Link B · 1 Gbps · 95th percentile 94% inbound for eleven consecutive weeks · zero errors · output queue drops rising week on week',
                            f('Order a circuit upgrade this quarter', 'Order a circuit upgrade this quarter', 'No action — this is inside headroom', 'Investigate the physical layer', 'Prioritise the sensitive traffic and rate-limit the rest')),
                        row('Link C · 10 Gbps · mean utilisation 4% · 44,000 input errors over the week with FCS errors on the same interface',
                            f('Investigate the physical layer — this is not a capacity problem', 'Investigate the physical layer — this is not a capacity problem', 'Order a circuit upgrade this quarter', 'No action — this is inside headroom', 'Move the heaviest traffic out of the busy period')),
                        row('Link D · 1 Gbps · 95th percentile 31% · voice complaints coincide with bursts to 100% lasting about 200 ms every weekday at 09:05, when 400 workstations pull the same update',
                            f('Prioritise the sensitive traffic and rate-limit the rest', 'Prioritise the sensitive traffic and rate-limit the rest', 'Order a circuit upgrade this quarter', 'No action — this is inside headroom', 'Investigate the physical layer')),
                        row('Link E · 1 Gbps WAN · 95th percentile 88% inbound · 61% of the bytes belong to one backup job that starts at 14:00',
                            f('Move the heaviest traffic out of the busy period', 'Move the heaviest traffic out of the busy period', 'Order a circuit upgrade this quarter', 'No action — this is inside headroom', 'Investigate the physical layer')),
                    ],
                }
            },
        }),

        q({
            domain: D.impl, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'Three switches are cabled in a triangle and run rapid spanning tree. Bridge priorities are SW-A 32768, SW-B 32768 and SW-C 4096, and the bridge addresses end 0A, 0B and 0C respectively. Path costs are the classic values: 19 for a 100 Mbps link and 4 for a 1 Gbps link. THE CABLING — SW-A Gi0/1 runs at 100 Mbps to SW-C Gi0/1; SW-B Gi0/1 runs at 1 Gbps to SW-C Gi0/2; SW-A Gi0/2 runs at 1 Gbps to SW-B Gi0/2. Work out the topology the protocol converges on, then give the role of each port.',
            explanation: 'Elect the root first, then compute each bridge’s cheapest path to it, and only then decide the segments. SW-C wins the root election on priority alone at 4096, so the bridge addresses never come into it and every SW-C port is designated. The interesting result is on SW-A. Its direct link to the root is the slow one and costs 19, while going the long way round through SW-B costs 4 to reach SW-B plus SW-B’s own root cost of 4, which is 8. Eight is cheaper than nineteen, so SW-A’s root port is the link that does not touch the root bridge at all, and the direct link to the root is left over. On the SW-A to SW-C segment the designated port belongs to the bridge with the lower root path cost, which is SW-C at zero, so SW-A Gi0/1 is neither root nor designated and settles into the alternate role, discarding. That is the port most people mark as the root port, because it is the one physically connected to the root, and speed rather than adjacency is what actually decides. On the SW-A to SW-B segment SW-B has a root cost of 4 against SW-A’s 8, so SW-B Gi0/2 is designated and SW-A Gi0/2 is the root port that carries SW-A’s traffic. SW-B Gi0/1 is its own root port at cost 4. Blocking the gigabit link between SW-A and SW-B instead would be the answer if costs were ignored and the topology were read as a picture, and it would leave SW-A reaching the network across a hundred-megabit link while a gigabit link sat idle.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Result'],
                    rows: [
                        row('Which switch becomes the root bridge',
                            f('SW-C', 'SW-C', 'SW-A', 'SW-B')),
                        row('SW-A Gi0/1 — the 100 Mbps link to SW-C',
                            f('Alternate port (discarding)', 'Alternate port (discarding)', 'Root port', 'Designated port')),
                        row('SW-A Gi0/2 — the 1 Gbps link to SW-B',
                            f('Root port', 'Root port', 'Alternate port (discarding)', 'Designated port')),
                        row('SW-B Gi0/1 — the 1 Gbps link to SW-C',
                            f('Root port', 'Root port', 'Alternate port (discarding)', 'Designated port')),
                        row('SW-B Gi0/2 — the 1 Gbps link to SW-A',
                            f('Designated port', 'Designated port', 'Root port', 'Alternate port (discarding)')),
                        row('SW-C Gi0/1 — the 100 Mbps link to SW-A',
                            f('Designated port', 'Designated port', 'Root port', 'Alternate port (discarding)')),
                        row('SW-C Gi0/2 — the 1 Gbps link to SW-B',
                            f('Designated port', 'Designated port', 'Root port', 'Alternate port (discarding)')),
                    ],
                }
            },
        }),

        q({
            domain: D.concepts, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'The zone corp.example.com is served by NS1 at 10.90.5.10 and by NS2 at 10.90.5.11, which holds a copy transferred from NS1. Every workstation is configured with two resolvers, 10.90.5.10 first and 8.8.8.8 second. NS1 forwards names it is not authoritative for to 203.0.113.53. The site standard caps the record time-to-live at 3600 seconds on anything expected to change. THE RECORDS ON NS1 RIGHT NOW — app01 is an address record for 10.90.20.15; www is an alias for app01.corp.example.com; mail is an address record for 10.90.20.40; files is an address record for 10.90.20.61 carrying a time-to-live of 604800, edited this morning from 10.90.20.60. The zone serial has not been changed since before that edit, and NS2 still holds the copy it last transferred. No query output is supplied. Work out what each query returns as things stand, decide what has to change, then work out what the same queries return afterwards.',
            explanation: 'The four probes separate three different staleness problems that all present to a user as "the name is wrong". Asking the first resolver for www returns the alias’s target record, 10.90.20.15, because NS1 is authoritative and holds both the alias and the address it points to. Asking the second resolver for mail is where the workstation configuration shows its cost: 8.8.8.8 is a public resolver with no knowledge of an internal zone, so the name does not resolve at all, and because a client will fall to its second resolver whenever the first is briefly slow or unreachable, internal names fail intermittently for reasons that never appear in NS1’s logs. Asking NS2 for files returns the old address, and asking NS1 for the same name returns the new one — the same question producing two answers from two authoritative servers is the definitive signature of a transfer that never happened, and the reason it never happened is the serial that was not incremented. The repairs follow directly. The second resolver becomes NS2 so that a fall-through stays inside the zone. The serial is incremented so the secondary transfers the change. The week-long time-to-live is shortened, because the standard caps changeable records at an hour and a record that has just been changed is by definition one of them; leaving it means caches keep the old address for days after both servers agree. The forwarder and NS2’s secondary role are both correct and both tempting to touch: removing the forwarder is the over-fix that breaks every public name on the site while doing nothing for the reported fault, and promoting NS2 to a second primary replaces one stale copy with two divergent ones. The re-probes are what prove the difference between a repair and a rearrangement — internal names now resolve on the second resolver, both authoritative servers now agree on files, and public names still resolve through the forwarder that was left alone.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Answer, or repair'],
                    rows: [
                        row('PROBE 1 · a workstation asks its first resolver for www.corp.example.com',
                            f('10.90.20.15', '10.90.20.15', '10.90.20.40', '10.90.20.61', 'No answer — the name does not exist')),
                        row('PROBE 2 · a workstation whose first resolver did not answer asks its second resolver for mail.corp.example.com',
                            f('No answer — that resolver has no knowledge of this zone', 'No answer — that resolver has no knowledge of this zone', '10.90.20.40', '10.90.20.15', '10.90.20.61')),
                        row('PROBE 3 · a workstation asks NS2 for files.corp.example.com',
                            f('10.90.20.60', '10.90.20.60', '10.90.20.61', '10.90.20.40', 'No answer — the name does not exist')),
                        row('PROBE 4 · a workstation asks NS1 for files.corp.example.com',
                            f('10.90.20.61', '10.90.20.61', '10.90.20.60', '10.90.20.40', 'No answer — the name does not exist')),

                        row('SETTING · workstation resolvers, 10.90.5.10 then 8.8.8.8',
                            f('Change the second entry to 10.90.5.11', 'Change the second entry to 10.90.5.11', 'Keep unchanged', 'Remove the second entry', 'Change the first entry to 8.8.8.8')),
                        row('SETTING · the zone serial on NS1, unchanged since before this morning’s edit',
                            f('Increment it so the secondary transfers the change', 'Increment it so the secondary transfers the change', 'Keep unchanged', 'Set it back to yesterday’s value')),
                        row('SETTING · time-to-live of 604800 on the files record',
                            f('Shorten it to no more than 3600', 'Shorten it to no more than 3600', 'Keep unchanged', 'Raise it to 1209600')),
                        row('SETTING · NS1 forwards names it is not authoritative for to 203.0.113.53',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the forwarder', 'Change the forwarder to 10.90.5.11')),
                        row('SETTING · NS2 holds corp.example.com as a secondary',
                            f('Keep unchanged', 'Keep unchanged', 'Remove the zone from NS2', 'Make NS2 a second primary with its own copy')),

                        row('RE-PROBE 1 · the second resolver is asked for mail.corp.example.com, after your changes',
                            f('10.90.20.40', '10.90.20.40', 'No answer — that resolver has no knowledge of this zone', '10.90.20.15', '10.90.20.61')),
                        row('RE-PROBE 2 · NS2 is asked for files.corp.example.com, after your changes',
                            f('10.90.20.61', '10.90.20.61', '10.90.20.60', '10.90.20.40', 'No answer — the name does not exist')),
                        row('RE-PROBE 3 · NS1 is asked for www.example.org, a public name, after your changes',
                            f('Answered through the forwarder', 'Answered through the forwarder', 'No answer — the forwarder was removed', 'Answered by NS2 instead', '10.90.20.61')),
                    ],
                }
            },
        }),

        q({
            domain: D.impl, difficulty: 'medium', bloomLevel: 'Apply',
            stem: 'A 24-port access switch has a total power budget of 370 W. Its ports support 802.3af, which guarantees 12.95 W at the powered device, and 802.3at, which guarantees 25.5 W at the powered device. The switch does not support 802.3bt. Decide what happens when each of these is connected.',
            explanation: 'Three separate limits are in play and each row is decided by a different one. The desk phone asks for 6.4 W, well inside what 802.3af guarantees at the device, so it powers up with nothing special required. The outdoor camera with a heater asks for 51 W, which is beyond even 802.3at’s 25.5 W at the device — that is 802.3bt territory, and no port configuration on a switch that does not implement it will change that. The access point at 24.5 W is the row that separates the two standards that do exist here: it is comfortably beyond 802.3af’s 12.95 W and comfortably inside 802.3at’s 25.5 W, so the answer is a standard, not a fault. The fourth row is arithmetic rather than standards: with 348 W of a 370 W budget already committed, 22 W remain, and a device asking for 25.5 W is refused no matter which standard the port supports — a switch that can power any one device cannot necessarily power all of them, and the budget is the number that decides. The last row is not a power question at all. Balanced twisted pair is specified to 100 m end to end, and a 104 m run is outside that, so the link itself is the thing to repair; arguing about classes and budgets on a run that should not link is time spent on the wrong layer. The common errors are treating the port’s maximum as the device’s guarantee, forgetting that the budget is shared across all 24 ports, and reaching for a power explanation on a link that is simply too long.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Outcome on this switch'],
                    rows: [
                        row('Port 1 · desk phone, 6.4 W at the device, 42 m run',
                            f('Powers up within 802.3af', 'Powers up within 802.3af', 'Needs an 802.3at port', 'Refused — not enough budget remains', 'Beyond this switch — the device needs 802.3bt')),
                        row('Port 2 · outdoor pan-tilt-zoom camera with a heater, 51 W at the device',
                            f('Beyond this switch — the device needs 802.3bt', 'Beyond this switch — the device needs 802.3bt', 'Powers up within 802.3af', 'Needs an 802.3at port', 'Refused — not enough budget remains')),
                        row('Port 3 · access point, 24.5 W at the device, 88 m run',
                            f('Needs an 802.3at port', 'Needs an 802.3at port', 'Powers up within 802.3af', 'Beyond this switch — the device needs 802.3bt', 'Refused — not enough budget remains')),
                        row('Port 4 · a second access point at 25.5 W, connected once 348 W of the 370 W budget is already committed',
                            f('Refused — not enough budget remains', 'Refused — not enough budget remains', 'Powers up within 802.3af', 'Needs an 802.3at port', 'Beyond this switch — the device needs 802.3bt')),
                        row('Port 5 · badge reader, 11.8 W at the device, run measured at 104 m',
                            f('The run exceeds 100 m — repair the run before considering power', 'The run exceeds 100 m — repair the run before considering power', 'Powers up within 802.3af', 'Needs an 802.3at port', 'Refused — not enough budget remains')),
                    ],
                }
            },
        }),

        q({
            domain: D.sec, difficulty: 'hard', bloomLevel: 'Evaluate',
            stem: 'A wireless controller carries a corporate SSID and a guest SSID. The site standard says corporate users authenticate with their own directory credentials so that each session derives its own key, guests must not be able to reach one another or any internal subnet, no legacy cipher may remain enabled, and management frames on the corporate SSID must be protected. Go through the deployed settings and change only what the standard requires.',
            explanation: 'Two of these rows are the standard being broken outright, three are weaknesses that are easy to miss, and two exist to catch a candidate who changes everything that looks unfamiliar. A pre-shared key, however long, gives every user the same secret and cannot tie a session to a person, so it cannot satisfy a standard written around individual directory credentials — that is the one row where the length of the passphrase is a distraction rather than a mitigation. Leaving the legacy cipher enabled alongside the modern one means a client can still negotiate the weaker of the two, and an option that is available is an option that will be used; the standard says no legacy cipher may remain, so it goes. Unprotected management frames leave deauthentication and disassociation forgeable, which is the cheapest disruption there is against a wireless network, and enabling protection is exactly what the standard asks for. The guest network is open by design with a captive portal, and that is not the defect — the defect is that with client isolation off, every guest is on a shared segment with every other guest, which is the specific thing the standard forbids. Push-button enrolment is a documented weakness and nothing in the standard needs it. The two rows to leave alone are fast transition and the guest VLAN mapping. Fast roaming is not a weakness; disabling it because it sounds like a convenience feature degrades voice and video every time a user walks between access points, and no line of the standard mentions it. The guest VLAN already does what the standard demands of it by permitting the internet and nothing internal, and changing a control that is already correct is how a hardening exercise turns into an outage.',
            pbqConfig: {
                pbqType: 'fill-table', fillTable: {
                    columns: ['Decision'],
                    rows: [
                        row('Corporate SSID · WPA2-Personal with a 24-character passphrase',
                            f('Change to enterprise authentication against the directory', 'Change to enterprise authentication against the directory', 'Keep unchanged', 'Change to a 63-character passphrase', 'Change to an open network with a portal')),
                        row('Corporate SSID · CCMP and TKIP both enabled',
                            f('Change to CCMP only', 'Change to CCMP only', 'Keep unchanged', 'Change to TKIP only')),
                        row('Corporate SSID · protected management frames disabled',
                            f('Change to required', 'Change to required', 'Keep unchanged', 'Change to optional')),
                        row('Corporate SSID · fast transition between access points enabled',
                            f('Keep unchanged', 'Keep unchanged', 'Disable it', 'Restrict it to the 5 GHz radio')),
                        row('Guest SSID · open with a captive portal, client isolation disabled',
                            f('Enable client isolation', 'Enable client isolation', 'Keep unchanged', 'Close the network with a shared passphrase', 'Disable the captive portal')),
                        row('Guest SSID · mapped to VLAN 30, which the router permits to the internet only',
                            f('Keep unchanged', 'Keep unchanged', 'Move it to the corporate VLAN', 'Permit it to the server VLAN as well')),
                        row('Controller · push-button enrolment enabled on both SSIDs',
                            f('Disable it', 'Disable it', 'Keep unchanged', 'Leave it on the guest SSID only')),
                    ],
                }
            },
        }),
    ];
}

// ═══════════════ COMMAND (4) ═══════════════
// scorePBQ scores a command PBQ all or nothing and compares history length
// before contents, so the previous version of this file punished a candidate
// for typing anything before the fix — the exact behaviour the demo simulation
// pays four of its fourteen points for. These four invert that: the probes are
// part of the accepted sequence, so looking first is required rather than
// penalised. The scenario states an operational goal and never a command count,
// and the hints constrain behaviour without naming a tool. Every sequence in a
// question is built from a cross product, which is what guarantees the equal
// lengths scorePBQ demands.

function commandQuestions() {
    return [

        q({
            domain: D.trouble, difficulty: 'hard', bloomLevel: 'Apply',
            stem: 'A Linux workstation on the third floor reaches other machines on its own segment and nothing beyond it. Nobody has looked at the machine yet, and the ticket contains no configuration, no addresses and no test results — only the complaint. The site records say this VLAN’s router interface is 10.10.20.1.',
            explanation: 'The point of this item is that the evidence does not exist until you produce it, and the transcript is the answer. Three things have to be established before any change is defensible, and each one eliminates a different family of causes. What address and mask the interface actually holds separates a host that never got a lease from one that has an address in the wrong subnet, and it is also the only way to know whether the router the records name is on-link at all. Where the host sends traffic that is not local is a separate fact from the address: a host can hold a perfectly correct address and mask and still have no route off the segment, or have one pointing somewhere that no longer exists, and neither of those is visible from the address alone. Whether that router answers is the third, and it is the one that splits a configuration problem from a reachability problem — a correct gateway that does not respond is a different ticket from a gateway that was never configured. Answers that reach for a name-resolution tool are answering a question nobody asked: nothing in the complaint mentions names, and a host that cannot leave its own segment will fail to resolve anything for reasons that have nothing to do with resolution. Answers that go straight to a path-tracing tool skip the two cheap local facts and start measuring a path the host may have no way of entering. Changing anything before the three facts exist — releasing a lease, editing an interface — destroys the state that would have explained the fault, and it is the single most common way a five-minute problem becomes an unreproducible one.',
            pbqConfig: {
                pbqType: 'command', command: {
                    prompt: 'user@ws-3f-14:~$',
                    scenario: 'Produce the evidence this ticket is missing, from the workstation itself, without changing anything on it.',
                    acceptedCommands: seqEitherOrder(
                        ['ip addr', 'ip a', 'ip addr show', 'ifconfig'],
                        ['ip route', 'ip route show', 'route -n', 'netstat -rn'],
                        ['ping 10.10.20.1', 'ping -c 4 10.10.20.1'],
                    ),
                    hints: [
                        'Every line you type is part of the answer, and nothing here is a change window — leave the machine as you found it.',
                        'Three separate facts are missing from the ticket. Two of them are things the host believes about itself; the third is something only the network can tell you.',
                    ],
                }
            },
        }),

        q({
            domain: D.trouble, difficulty: 'hard', bloomLevel: 'Analyze',
            stem: 'One name, app01.corp.example.com, has been resolving to an address that stopped answering last night. Every other name on the site resolves normally and the server itself is up and answering on its new address. The site resolver is 10.90.5.20; the zone’s authoritative server is 10.90.5.10. Nobody has yet established whether the wrong answer is being held by the resolver or published by the authoritative server, and the two faults have completely different repairs.',
            explanation: 'This is a comparison, not a lookup, and a single answer settles nothing. Asking the site resolver what it currently hands out tells you what users are actually receiving, which is the only thing the complaint is really about. Asking the authoritative server the same question tells you what the zone actually says. It is the difference between those two answers that identifies the fault, and either answer on its own is consistent with both possible causes. If the resolver returns the old address and the authoritative server returns the new one, the zone is already correct and the resolver is serving a cached answer that has not expired — the repair is to clear that cache or wait out the record’s remaining lifetime, and editing the zone again achieves nothing because the zone was never wrong. If both return the old address, the change never reached the zone at all, and clearing caches would produce a brief improvement followed by the same wrong answer arriving again from the authority. Querying only the default resolver, which is what most people do first, cannot distinguish those two situations, and neither can pinging the name, which returns an address without saying where the address came from. Restarting a resolver before the comparison is taken is the worst move available: it clears the cache, destroys the only evidence that would have told you which fault this was, and leaves the same ticket to be reopened later with the trail gone.',
            pbqConfig: {
                pbqType: 'command', command: {
                    prompt: 'admin@jump01:~$',
                    scenario: 'Gather what is needed to tell a stale cached answer apart from a stale published record, before anything is edited or restarted.',
                    acceptedCommands: seqEitherOrder(
                        ['dig @10.90.5.20 app01.corp.example.com', 'dig @10.90.5.20 app01.corp.example.com a', 'nslookup app01.corp.example.com 10.90.5.20'],
                        ['dig @10.90.5.10 app01.corp.example.com', 'dig @10.90.5.10 app01.corp.example.com a', 'nslookup app01.corp.example.com 10.90.5.10'],
                    ),
                    hints: [
                        'One answer proves nothing here. The fault lives in the difference between two of them.',
                        'Ask each server for itself rather than accepting whichever one this host happens to be configured with.',
                    ],
                }
            },
        }),

        q({
            domain: D.ops, difficulty: 'hard', bloomLevel: 'Apply',
            stem: 'Two machines on one segment lose connectivity for a few seconds at a time, and the pattern follows the address 10.70.4.62 rather than either machine — whichever host currently holds it is the one that suffers. You are on a third Linux host on the same segment, which has been powered on for several days.',
            explanation: 'The order of these two lines is the whole answer, and typing them the other way round produces a confident wrong conclusion. The address-to-hardware mapping table on this host is a cache: it holds what the host has recently had a reason to learn, and on a machine that has been up for days it may hold nothing at all for that address, or it may hold an entry learned hours ago from whichever machine answered first. Reading it cold therefore produces either an empty result, which looks like the address is unused, or a single stale mapping, which looks like exactly one device holds it — and that is the reading that closes the ticket on the wrong machine. Generating traffic to the address first is what forces a fresh resolution onto the wire, so that every device configured with that address has an opportunity to answer and the table is repopulated with what the segment says right now rather than what it said earlier. Only then does reading the table mean anything, and a duplicate shows up as the mapping changing between two hardware addresses across repeated reads. The tempting alternatives all skip that. Pinging alone gives replies without ever showing which device sent them, and the replies will look perfectly healthy because something is answering every time. Reading the table alone gives a hardware address with no evidence of how old it is. Reaching for a packet capture is not wrong in principle but is a much heavier instrument for a fact that two lines will establish, and it does not force the second device to speak.',
            pbqConfig: {
                pbqType: 'command', command: {
                    prompt: 'user@ws-2f-08:~$',
                    scenario: 'Establish what this segment currently maps that address to, using evidence fresh enough to be trusted rather than whatever this host learned earlier.',
                    acceptedCommands: seqProduct(
                        ['ping 10.70.4.62', 'ping -c 4 10.70.4.62', 'ping -c 5 10.70.4.62'],
                        ['arp -a', 'arp -n', 'arp -a 10.70.4.62', 'ip neigh', 'ip neighbor show'],
                    ),
                    hints: [
                        'A cache only holds what the host has recently been given a reason to learn, and this host has been up for days.',
                        'The order you work in is part of what is being judged, not just the tools.',
                    ],
                }
            },
        }),

        q({
            domain: D.impl, difficulty: 'hard', bloomLevel: 'Apply',
            stem: 'A second interface, eth1, has just been cabled into the storage VLAN and configured, and the change is about to be handed back to the requester. The host already has a working default route through its original interface, and the storage gateway is 10.10.50.1. The reviewer will not accept the change without evidence from the host itself.',
            explanation: 'Handing back a change on the strength of "it looked fine" is how a second interface sits unused for a month before anyone notices. Two facts are needed and they are not the same fact. The first is that the new interface actually holds the address and mask it was meant to hold — a configuration file that was edited is not the same thing as an interface that came up, and an interface can be present, cabled and completely unaddressed. The second is that the storage gateway answers over that interface in particular, and the word "in particular" is what the whole row turns on. This host already has a working default route through its original interface, so an unqualified reachability test can be answered over the old path and come back looking perfect while the new cable is not even connected to the right switch port. Binding the test to the new interface is what makes the evidence mean anything; without it the reply proves only that the host has some route to that subnet, which it already had before the change. The usual shortcuts all fail here for the same reason: testing a name rather than the gateway address adds a resolution dependency that has nothing to do with this change, and testing from another machine proves that the gateway is up without proving anything at all about this interface.',
            pbqConfig: {
                pbqType: 'command', command: {
                    prompt: 'admin@stor-app-02:~$',
                    scenario: 'Produce the evidence a reviewer will ask for before this change is released: that the new interface holds what it should, and that the storage gateway answers over that interface rather than over the path this host already had.',
                    acceptedCommands: seqEitherOrder(
                        ['ip addr show eth1', 'ip a show eth1', 'ip addr show dev eth1', 'ifconfig eth1'],
                        ['ping -I eth1 10.10.50.1', 'ping -c 4 -I eth1 10.10.50.1', 'ping -I eth1 -c 4 10.10.50.1'],
                    ),
                    hints: [
                        'This host already reaches things without the new cable. A reply that came back over the old path proves nothing about the new one.',
                        'Verification only — nothing here should alter the configuration you are checking.',
                    ],
                }
            },
        }),
    ];
}

// ─── Assembly ────────────────────────────────────────────────────

function defineQuestions() {
    return [
        ...dragDropQuestions(),
        ...orderStepsQuestions(),
        ...fillTablesA(),
        ...fillTablesB(),
        ...commandQuestions(),
    ];
}

/** Applies the deterministic shuffles that stop the rendered widget from being
 *  a plaintext answer key. PBQQuestion.tsx renders fill-table options and
 *  drag-drop items in authored order and shuffles neither. */
function randomise(questions, seed) {
    const rnd = mulberry32(seed);
    for (const item of questions) {
        const cfg = item.pbqConfig;
        if (cfg.pbqType === 'fill-table') {
            for (const r of cfg.fillTable.rows) {
                for (const field of r.fields) field.options = shuffled(field.options, rnd);
            }
        }
        if (cfg.pbqType === 'drag-drop') {
            cfg.dragDrop.items = interleaveItems(cfg.dragDrop.items, cfg.dragDrop.zones, rnd);
        }
    }
    return questions;
}

/** How often the correct value lands at each dropdown position. A candidate who
 *  always picks the top entry should score at chance. Reported per position with
 *  the count chance would predict; the seed search below rejects any file where
 *  a position runs more than three standard deviations hot. */
function positionBias(questions) {
    const observed = [];
    const expected = [];
    const variance = [];
    let cells = 0;
    for (const item of questions) {
        if (item.pbqConfig.pbqType !== 'fill-table') continue;
        for (const r of item.pbqConfig.fillTable.rows) {
            for (const field of r.fields) {
                const n = field.options.length;
                const at = field.options.indexOf(field.correctValue);
                cells++;
                observed[at] = (observed[at] || 0) + 1;
                for (let p = 0; p < n; p++) {
                    expected[p] = (expected[p] || 0) + 1 / n;
                    variance[p] = (variance[p] || 0) + (1 / n) * (1 - 1 / n);
                }
            }
        }
    }
    const positions = expected.map((e, p) => ({
        position: p,
        observed: observed[p] || 0,
        expected: +e.toFixed(2),
        sigma: +(((observed[p] || 0) - e) / Math.sqrt(variance[p])).toFixed(2),
    }));
    return { cells, positions, worst: Math.max(...positions.map((x) => Math.abs(x.sigma))) };
}

/** What a candidate scores with no Network+ knowledge at all, by always
 *  reaching for the same place in every dropdown. The clamp matters: someone
 *  who "always picks the fourth entry" picks the last one when a list is
 *  shorter, which is how the fourth-position strategy quietly becomes the
 *  last-position strategy on the small tables. All of these have to sit at
 *  chance, and the per-question figure has to sit there too — a flat file-wide
 *  distribution can still hide one table stacked on a single position. */
function strategyScores(questions) {
    const cells = [];
    for (const item of questions) {
        if (item.pbqConfig.pbqType !== 'fill-table') continue;
        const per = [];
        for (const r of item.pbqConfig.fillTable.rows) {
            for (const field of r.fields) {
                per.push(field);
                cells.push(field);
            }
        }
        item.__cells = per;
    }
    const rate = (pick) => cells.filter((f) => pick(f) === f.correctValue).length / cells.length;
    const byPosition = [];
    for (let k = 0; k < 6; k++) byPosition.push(rate((f) => f.options[Math.min(k, f.options.length - 1)]));
    const worstQuestion = Math.max(...questions
        .filter((x) => x.__cells && x.__cells.length >= 5)
        .map((x) => {
            const tally = {};
            for (const f of x.__cells) {
                const i = f.options.indexOf(f.correctValue);
                tally[i] = (tally[i] || 0) + 1;
            }
            return Math.max(...Object.values(tally)) / x.__cells.length;
        }));
    for (const item of questions) delete item.__cells;
    return { cells: cells.length, byPosition, worstStrategy: Math.max(...byPosition), worstQuestion };
}

// Search for the first seed whose shuffle leaves no dropdown position running
// hot — file-wide or inside any single table. Deterministic: the same seed is
// found on every run, so the emitted file is reproducible from this script.
let questions = null, chosenSeed = null, bias = null, strat = null;
for (let seed = 1; seed <= 5000; seed++) {
    const candidate = randomise(defineQuestions(), seed);
    const b = positionBias(candidate);
    if (b.worst > 2.2) continue;
    const s = strategyScores(candidate);
    if (s.worstStrategy > 0.32 || s.worstQuestion > 0.55) continue;
    questions = candidate; chosenSeed = seed; bias = b; strat = s; break;
}
if (!questions) throw new Error('no seed produced an acceptably flat option-position distribution');

const out = {
    examId: EXAM_ID,
    examName: 'CompTIA Network+ (N10-009)',
    source: SOURCE,
    authoredAt: '2026-08-29',
    note: 'Performance-based questions. Not reviewed by a certified subject matter expert.',
    optionShuffleSeed: chosenSeed,
    questions,
};

mkdirSync('./seed', { recursive: true });
writeFileSync('./seed/network-plus-pbqs.json', JSON.stringify(out, null, 2), 'utf8');

const byType = {}, byDomain = {};
for (const x of questions) {
    byType[x.pbqConfig.pbqType] = (byType[x.pbqConfig.pbqType] || 0) + 1;
    byDomain[x.domain] = (byDomain[x.domain] || 0) + 1;
}
console.log(`wrote ${questions.length} PBQs -> seed/network-plus-pbqs.json`);
console.log('by type:  ', byType);
console.log('by domain:', byDomain);
console.log(`option shuffle seed ${chosenSeed}; ${bias.cells} dropdown cells`);
console.log('correct-option position:', bias.positions.map((p) => `#${p.position}: ${p.observed} vs ${p.expected} expected (${p.sigma}sd)`).join(' | '));
console.log('always-pick-position-k scores:', strat.byPosition.map((r, k) => `k=${k}: ${(r * 100).toFixed(1)}%`).join('  '));
console.log(`worst single table stacked on one position: ${(strat.worstQuestion * 100).toFixed(0)}%`);
