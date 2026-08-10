# Handoff: one Security 2.6 item removed from the A+ Software Troubleshooting piece

Not a bank file. Deliberately `.md`, not `.json`, so no loader globbing
`content-staging/**/*.json` picks it up.

## Why

Three items in `a-plus-v15/software-troubleshooting.json` were pure objective 2.6
(SOHO malware removal, Domain 2.0 Security), not 3.4. They have been deleted from
that file. Two of them are already covered in `a-plus-v15/security.json` and must
NOT be re-added:

- removed "Omar / quarantine the infected system" (step 2) duplicates `security.json` idx 17 (Kwame, same step, same key)
- removed "Omar / disable System Restore before remediation" (steps 3 and 9) duplicates `security.json` idx 18 (same rationale, same key)

Only the third is additive: it tests step 6 (scan and removal techniques, safe mode /
preinstallation environment), which no item in `security.json` currently covers.
It is reproduced below, retagged and length-normalized. `correctAnswer` is 2 as
written; re-order the options if `security.json` needs a different position to keep
its own key distribution balanced.

```json
{
  "stem": "After quarantining an infected workstation and updating definitions, Lena runs a full scan from the normal Windows desktop. The scan reports and removes several items, but on the next boot the same unwanted notifications and outbound connections return, and the scanner now reports the machine as clean. What is the most appropriate next scan and removal technique?",
  "options": [
    "Repeat the same full scan from the normal desktop, since some threats need two passes.",
    "Restore the machine to a restore point that predates the reported infection date.",
    "Rescan from Safe Mode or a preinstallation environment with current definitions.",
    "Uninstall and reinstall the web browser to clear the component making the pop-ups."
  ],
  "correctAnswer": 2,
  "explanation": "A threat that reappears after removal and then hides from the scanner is loading with the OS and protecting itself, so scanning from an environment where its components are not running, such as Safe Mode or a preinstallation environment, is the technique that lets the scanner see and delete them. Repeating the same scan from the running desktop recreates the exact conditions that already failed, because the threat is still resident and able to conceal itself. System Restore does not remove malware reliably and can roll back to a point that is itself infected, which is why restore is disabled during remediation in the first place. Reinstalling the browser clears one symptom while a persistent system-level component survives to re-infect the fresh install.",
  "domain": "Security",
  "objective": "2.6",
  "difficulty": "medium",
  "source": "authored-2026-08-eco-refresh"
}
```

## Also for the Security piece owner

`security.json` idx 18 (2.6, System Restore) is the file's worst length outlier:
its key runs 178 characters against distractors of 78 / 76 / 83. Across the whole
file a candidate who reads nothing and always picks the longest option scores
41.4% (mean key 69.7 chars vs 60.3 for distractors). `operating-systems.json` is
worse at 53.4%. Both should get the same normalization pass that
`software-troubleshooting.json` just received.
