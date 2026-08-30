/**
 * Self-test for the checks in load-pmp-earned-value.mjs.
 *
 *   node selftest-pmp-earned-value.mjs
 *
 * Follows the convention docs/pmp-formula-reference.md sets for
 * functions/scripts/audit_pmp_math.js: after changing any checker, audit a
 * fixture of deliberately-broken input and assert each defect is caught.
 *
 * It earns its place. When the comparative and ecoTask checks were first
 * written, both LOOKED right, the seed validated clean, and both were in fact
 * inert — the comparative anchor rejected any value followed by a comma, which
 * is the exact shape of "TCPI is 0.82, below the 0.75", and the ecoTask regex
 * had lost its escapes to a shell layer. A clean validation run proved nothing.
 *
 * Copies the seed, mutates the copy in place, restores it, and never passes
 * --apply. Firestore is untouched.
 */
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SEED = './seed/pmp-earned-value.json';
const BACKUP = './seed/.pmp-earned-value.selftest-backup.json';
copyFileSync(SEED, BACKUP);

const base = JSON.parse(readFileSync(BACKUP, 'utf8'));

function run() {
    try {
        execSync('node load-pmp-earned-value.mjs --validate-only', { encoding: 'utf8', stdio: 'pipe' });
        return { failed: false, out: '' };
    } catch (e) {
        return { failed: true, out: (e.stdout || '') + (e.stderr || '') };
    }
}

const cases = [];
function testCase(name, mutate, expectSubstring) {
    const seed = JSON.parse(JSON.stringify(base));
    mutate(seed);
    writeFileSync(SEED, JSON.stringify(seed, null, 2), 'utf8');
    const r = run();
    const caught = r.failed && r.out.includes(expectSubstring);
    cases.push({ name, caught, expectSubstring, sample: caught ? '' : r.out.split('\n').filter((l) => l.trim().startsWith('-')).slice(0, 4).join(' | ') || '(validator PASSED — defect not caught)' });
}

// 1. The exact Q14 defect: an inverted comparative between two correct numbers.
testCase(
    'Q14 inverted comparative (0.82 "below" 0.75)',
    (s) => {
        const q = s.questions[13];
        q.options[0] = 'TCPI is 0.82, below the 0.75 achieved so far, so the approved target allows the remaining work to be performed less efficiently than the team has managed to date and is realistic';
        s.mathChecks.find((c) => c.q === 14 && c.formula === 'cpi').text = 'below the 0.75';
    },
    'is not below'
);

// 2. The PV variant leak: planned value present only on the CPI x SPI item.
testCase(
    'EAC variant leak (PV present only where CPI x SPI is keyed)',
    (s) => {
        for (const n of [5, 6, 8, 10, 11, 12]) {
            const q = s.questions[n - 1];
            q.stem = q.stem.replace(/,? ?planned value (of|is|at|stands at) \$[\d,]+,?/i, '');
            const row = s.eacFamily.find((r) => r.q === n);
            row.supplies = row.supplies.filter((f) => f !== 'PV');
        }
        const q7 = s.questions[6];
        q7.stem = q7.stem.replace('and actual cost to date of $500,000', 'actual cost to date of $500,000 and planned value of $500,000');
        s.eacFamily.find((r) => r.q === 7).supplies.push('PV');
    },
    'variant leak'
);

// 3. A dishonest supplies declaration: stem names PV, declaration omits it.
testCase(
    'dishonest eacFamily declaration',
    (s) => { s.eacFamily.find((r) => r.q === 5).supplies = ['BAC', 'EV', 'AC']; },
    'the declaration omits it'
);

// 4. An unsupportable ECO task number.
testCase(
    'ecoTask asserts an unverifiable task number',
    (s) => { s.questions[16].ecoTask = 'Business Environment · Task 5 — Plan and manage risk'; },
    'asserts an ECO task number'
);

// 5. Control: the seed as authored must still pass.
testCase.name; // no-op
writeFileSync(SEED, JSON.stringify(base, null, 2), 'utf8');
const control = run();
cases.push({ name: 'control: unmodified seed passes', caught: !control.failed, sample: control.failed ? control.out.split('\n').filter((l) => l.trim().startsWith('-')).slice(0, 6).join(' | ') : '' });

copyFileSync(BACKUP, SEED);
unlinkSync(BACKUP);

let bad = 0;
for (const c of cases) {
    console.log(`${c.caught ? 'OK  ' : 'FAIL'}  ${c.name}${c.caught ? '' : '\n        ' + c.sample}`);
    if (!c.caught) bad++;
}
console.log(bad === 0 ? '\nall self-tests pass' : `\n${bad} self-test(s) failed`);
process.exit(bad === 0 ? 0 : 1);
