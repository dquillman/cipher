# Rejected staged output

`authored-not-classified-REJECTED.json` — the `cpp-redomain-b` builder was asked
to CLASSIFY bank questions 101-200 into the seven domains of the CPP outline
effective 5 Sep 2026. It instead authored 100 brand-new questions. Wrong
deliverable, and its correction pass was blocked by a safety classifier so it
was never fixed.

Kept rather than deleted because the questions may be salvageable later, but they
are UNVERIFIED and off-spec: the sample stems are definitional ("A compound
journal entry in payroll:") rather than the scenario-first style the bank uses.
Do not upload without a full authoring review.

Held in a subdirectory so `upload-staged-banks.js` cannot pick it up — that
script globs `*.json` in the exam directory only.
