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
