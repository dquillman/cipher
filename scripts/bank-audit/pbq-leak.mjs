/**
 * How much of a PBQ can be answered without reading it?
 *
 * The loader used to ask only "does a perfect answer score full marks". That
 * passes content a zero-knowledge answer also passes, which is how 44 of the 89
 * scored decisions on the first live Security+ PBQ set (49%) ended up
 * recoverable from layout alone — items authored grouped by zone, correct
 * options sitting at index 0 or at the row's own index.
 *
 * PBQQuestion.tsx now shuffles items, zones and options at render, so the
 * player is safe either way. This module guards the other end: a seed file
 * should not be an answer key on its own, and a future renderer change should
 * not silently re-open the hole.
 *
 * Each strategy below is one a candidate could actually execute while knowing
 * nothing about the subject.
 */

/** Naive walk: place the nth item into the nth zone, spilling into the last. */
function dragDropLayoutScore(cfg) {
    const { items, zones } = cfg.dragDrop;
    let correct = 0;
    items.forEach((item, i) => {
        const guess = zones[Math.min(i, zones.length - 1)].id;
        if (guess === item.correctZone) correct++;
    });
    return { correct, total: items.length };
}

/** Proportional walk: spread items evenly across zones in listed order. */
function dragDropProportionalScore(cfg) {
    const { items, zones } = cfg.dragDrop;
    const per = items.length / zones.length;
    let correct = 0;
    items.forEach((item, i) => {
        const guess = zones[Math.min(Math.floor(i / per), zones.length - 1)].id;
        if (guess === item.correctZone) correct++;
    });
    return { correct, total: items.length };
}

/** Are the items simply listed in zone order? Then any grouping strategy wins. */
function dragDropIsSorted(cfg) {
    const idx = Object.fromEntries(cfg.dragDrop.zones.map((z, i) => [z.id, i]));
    const seq = cfg.dragDrop.items.map((it) => idx[it.correctZone]);
    return seq.every((v, i) => i === 0 || v >= seq[i - 1]);
}

/** Always pick the first option; or always pick the option at the row's index. */
function fillTableLayoutScore(cfg) {
    const rows = cfg.fillTable.rows;
    let first = 0, diagonal = 0, total = 0;
    rows.forEach((row, ri) => {
        row.fields.forEach((f) => {
            total++;
            const at = f.options.indexOf(f.correctValue);
            if (at === 0) first++;
            if (at === ri) diagonal++;
        });
    });
    return { correct: Math.max(first, diagonal), total, first, diagonal };
}

/** What a coin-flip candidate expects, so "leak" means better than luck. */
function chanceScore(cfg) {
    switch (cfg.pbqType) {
        case 'drag-drop': {
            const { items, zones } = cfg.dragDrop;
            return items.length / zones.length;
        }
        case 'fill-table': {
            let e = 0;
            cfg.fillTable.rows.forEach((r) => r.fields.forEach((f) => { e += 1 / f.options.length; }));
            return e;
        }
        case 'order-steps': {
            // One position right by luck, whatever the length (derangement limit).
            return 1;
        }
        default:
            return 0;
    }
}

/**
 * Returns { scored, free, chance, pct, strategies } for one pbqConfig.
 * `free` is the best zero-knowledge score; `pct` is how much of the question
 * that recovers.
 */
export function leakOf(cfg) {
    const strategies = [];
    let free = 0, scored = 0;

    if (cfg.pbqType === 'drag-drop') {
        const naive = dragDropLayoutScore(cfg);
        const prop = dragDropProportionalScore(cfg);
        scored = naive.total;
        free = Math.max(naive.correct, prop.correct);
        if (dragDropIsSorted(cfg)) strategies.push('items listed in zone order');
        if (prop.correct > naive.correct) strategies.push('proportional walk down the zone list');
        else if (naive.correct > 0) strategies.push('nth item into nth zone');
    } else if (cfg.pbqType === 'fill-table') {
        const r = fillTableLayoutScore(cfg);
        scored = r.total;
        free = r.correct;
        if (r.first === r.total) strategies.push('correct option is always first');
        else if (r.diagonal === r.total) strategies.push('correct option index equals row index');
        else if (r.first > r.total / 2) strategies.push(`correct option is first in ${r.first}/${r.total} cells`);
        else if (r.diagonal > r.total / 2) strategies.push(`correct option sits at the row index in ${r.diagonal}/${r.total} cells`);
    } else if (cfg.pbqType === 'order-steps') {
        // The app shuffles these, and the authored array IS the key, so a seed
        // reader always wins. Nothing to measure at the layout level.
        scored = cfg.orderSteps.steps.length;
        free = 0;
    } else if (cfg.pbqType === 'command') {
        scored = 1;
        free = 0;
    }

    const chance = chanceScore(cfg);
    return { scored, free, chance, pct: scored ? free / scored : 0, strategies };
}

/**
 * Audits a list of pbqConfigs. Anything where a zero-knowledge candidate beats
 * chance by more than `tolerance` of the question is reported.
 */
export function auditLeak(configs, { tolerance = 0.15 } = {}) {
    let scored = 0, free = 0, chance = 0;
    const offenders = [];
    configs.forEach((cfg, i) => {
        const r = leakOf(cfg);
        scored += r.scored;
        free += r.free;
        chance += r.chance;
        if (r.scored && (r.free - r.chance) / r.scored > tolerance) {
            offenders.push({ index: i, type: cfg.pbqType, ...r });
        }
    });
    return {
        scored,
        free,
        chance: Math.round(chance * 10) / 10,
        pct: scored ? Math.round((free / scored) * 100) : 0,
        chancePct: scored ? Math.round((chance / scored) * 100) : 0,
        offenders,
    };
}

// ─── Set-level position tests ───────────────────────────────────
//
// Ported from load-netplus-pbqs.mjs, which caught skew the per-question checks
// above miss: a set can look fine question by question and still have the key
// sitting at the top of the dropdown far more often than chance across the
// whole file.
//
// One correction to the note that came with them. They were written believing
// "the widget does not shuffle" — that was true until 2026-08-30, when
// PBQQuestion.tsx gained useShuffledOnce/useOptionShuffler and both were
// deployed. The player is shuffled now. These checks still matter, because a
// seed file should not be an answer key on its own and a future renderer change
// must not silently re-open the hole.

/** Where does the correct value sit in its dropdown, across the whole set?
 *  Reports a sigma per position, so a skew that no single question would flag
 *  still shows up. */
export function optionPositionReport(questions) {
    const observed = [], expected = [], variance = [];
    let cells = 0;
    for (const q of questions) {
        const cfg = q.pbqConfig || q;
        if (cfg?.pbqType !== 'fill-table') continue;
        for (const r of cfg.fillTable.rows) {
            for (const f of r.fields) {
                const n = f.options.length;
                const at = f.options.indexOf(f.correctValue);
                if (at < 0) continue;
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
        expected: e,
        sigma: variance[p] > 0 ? ((observed[p] || 0) - e) / Math.sqrt(variance[p]) : 0,
    }));
    return { cells, positions };
}

/** What "always pick the kth entry in every dropdown" scores. Clamped to the
 *  last option, because that is what someone reaching for a fixed position
 *  actually does on a shorter list. */
export function fixedPositionScores(questions) {
    const cells = [];
    for (const q of questions) {
        const cfg = q.pbqConfig || q;
        if (cfg?.pbqType !== 'fill-table') continue;
        for (const r of cfg.fillTable.rows) cells.push(...r.fields);
    }
    if (!cells.length) return [];
    const max = Math.max(...cells.map((f) => f.options.length));
    return Array.from({ length: max }, (_, k) =>
        cells.filter((f) => f.options[Math.min(k, f.options.length - 1)] === f.correctValue).length / cells.length);
}

/** Monotonic in EITHER direction, plus items grouped by zone when the counts
 *  would allow an interleave. Stricter than the walk strategies above. */
export function dragDropOrderErrors(cfg, at) {
    const errs = [];
    if (cfg.pbqType !== 'drag-drop') return errs;
    const order = new Map(cfg.dragDrop.zones.map((z, i) => [z.id, i]));
    const s = cfg.dragDrop.items.map((it) => order.get(it.correctZone));
    if (s.some((v) => v === undefined)) return errs;
    const up = s.every((v, i) => i === 0 || v >= s[i - 1]);
    const down = s.every((v, i) => i === 0 || v <= s[i - 1]);
    if (up || down) {
        errs.push(`${at}: correctZone sequence [${s.join(',')}] is monotonic — items authored in answer order`);
    }
    const counts = {};
    for (const v of s) counts[v] = (counts[v] || 0) + 1;
    const avoidable = Math.max(...Object.values(counts)) <= Math.ceil(s.length / 2);
    const runs = s.filter((v, i) => i > 0 && v === s[i - 1]).length;
    if (avoidable && runs > 0) {
        errs.push(`${at}: ${runs} adjacent item pair(s) share a zone though the counts allow a full interleave`);
    }
    return errs;
}

/** Command questions where the scenario or a hint gives away how many lines to
 *  type, or where a single command is accepted for a task whose whole point is
 *  probe-then-act. */
export function commandGiveawayErrors(cfg, at) {
    const errs = [];
    if (cfg.pbqType !== 'command') return errs;
    const c = cfg.command || {};
    const COUNT = /(one|two|three|1|2|3)\s+commands?|single command|commands?\s*:\s*[123]/i;
    if (c.scenario && COUNT.test(c.scenario)) errs.push(`${at}: scenario states how many commands to type`);
    (c.hints || []).forEach((h, i) => {
        if (COUNT.test(h)) errs.push(`${at}: hint ${i + 1} states how many commands to type`);
    });
    return errs;
}

// ─── Authoring-time de-correlation ──────────────────────────────

/** Deterministic PRNG so an emitted seed file is stable and diffable. */
export function rngFrom(seed) {
    let h = 2166136261;
    for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}

function shuffleWith(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

/** Search for an arrangement a zero-knowledge candidate does worst against.
 *  One shuffle can land correlated by luck, so try many and keep the best. An
 *  arrangement is only accepted if it also clears dragDropOrderErrors, which
 *  rejects monotonic sequences a raw score can still tolerate. */
export function arrangeConfig(cfg, seedBase, attempts = 400) {
    // drag-drop only. fill-table option order is set by
    // balanceOptionPositions, which sees the whole file; running both over
    // the same cells means each undoes the other.
    if (cfg.pbqType !== 'drag-drop') return cfg;
    let best = null;
    for (let n = 0; n < attempts; n++) {
        const rng = rngFrom(`${seedBase}:${n}`);
        const c = JSON.parse(JSON.stringify(cfg));
        c.dragDrop.items = shuffleWith(c.dragDrop.items, rng);
        c.dragDrop.zones = shuffleWith(c.dragDrop.zones, rng);
        const { free, chance, scored } = leakOf(c);
        const excess = scored ? (free - chance) / scored : 0;
        const structural = dragDropOrderErrors(c, 'x').length;
        const cost = excess + structural;   // any monotonic/interleave error outweighs a small excess
        if (!best || cost < best.cost) best = { c, cost };
        if (best.cost <= 0) break;
    }
    return best.c;
}

/** Per-question arranging cannot see the whole file, so a set can still end up
 *  with the key sitting at one dropdown position far more often than chance.
 *  This walks every cell and moves the correct value to whichever position is
 *  least used so far, which drives both the sigma and the "always pick the kth
 *  entry" score down to chance. Mutates in place; call after arrangeConfig. */
export function balanceOptionPositions(questions) {
    // Cells differ in how many options they have, so position 0 is reachable by
    // every cell while position 3 is reachable only by the long ones. Balancing
    // on raw counts therefore over-corrects and makes the skew worse. Track the
    // expected count per position too, and place each key where the deficit
    // (expected minus actual) is largest among the positions THIS cell can
    // reach.
    const cells = [];
    for (const q of questions) {
        const cfg = q.pbqConfig || q;
        if (cfg?.pbqType !== 'fill-table') continue;
        cfg.fillTable.rows.forEach((row, ri) => {
            for (const f of row.fields) {
                if (f.options.indexOf(f.correctValue) >= 0) { f.__rowIndex = ri; cells.push(f); }
            }
        });
    }
    const maxN = cells.length ? Math.max(...cells.map((f) => f.options.length)) : 0;
    const expected = Array(maxN).fill(0);
    for (const f of cells) {
        for (let p = 0; p < f.options.length; p++) expected[p] += 1 / f.options.length;
    }
    // Longest lists first: they are the only ones that can reach the high
    // positions, so they get to claim them before the short lists crowd the low
    // ones.
    const order = cells.map((f, i) => ({ f, i })).sort((a, b) => b.f.options.length - a.f.options.length);
    const used = Array(maxN).fill(0);
    let moved = 0;
    for (const { f } of order) {
        const n = f.options.length;
        const at = f.options.indexOf(f.correctValue);
        let target = 0, bestDeficit = -Infinity;
        for (let p = 0; p < n; p++) {
            // Nudge away from the row's own index too: "the answer is on the
            // diagonal" is the other fixed-position tell, and it costs nothing
            // to break ties against it.
            const deficit = expected[p] - used[p] - (p === f.__rowIndex ? 0.001 : 0);
            if (deficit > bestDeficit) { bestDeficit = deficit; target = p; }
        }
        if (target !== at) {
            const a = f.options.slice();
            [a[at], a[target]] = [a[target], a[at]];
            f.options = a;
            moved++;
        }
        used[target] += 1;
    }
    for (const f of cells) delete f.__rowIndex;
    return { moved, histogram: used, expected };
}

