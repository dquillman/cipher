# Import mapping - a-plus-v15/security.json

Applies to: `content-staging/a-plus-v15/security.json` (52 items, source
`authored-2026-08-eco-refresh`).
Target: exam `cxBsVz8AVaocdEYbgSMA` ("CompTIA A+ (Core 2)"), production bank
dump `banks/a-plus.json` (105 questions).

This file is the contract. Nothing here is left for the importer to infer.

## 1. Normalization decision (both silent-join fields, one rule)

The staged file is authored against the **official CompTIA 220-1202 objectives
document**; the production bank uses its own shorter labels. The staged file
stays document-faithful and the **importer normalizes on write**. Two fields
are affected, and both are handled by the same pass:

| staged value | written to Firestore as | why |
| --- | --- | --- |
| `domain: "2.0 Security"` | `domain: "Security"` | The bank stores bare domain names. `exam.domains` is `["Operating Systems","Security","Software Troubleshooting","Operational Procedures"]` and `byDomain` is keyed the same way. Writing `"2.0 Security"` creates a 53rd phantom domain that matches nothing in `byDomain` and no blueprint row. |
| `difficulty: "easy" / "medium" / "hard"` | `difficulty: "Easy" / "Medium" / "Hard"` | All 100 bank questions that carry the field use Title Case (`Easy` 10, `Medium` 45, `Hard` 45). Lowercase values silently miss every difficulty filter and every mixer that groups on this string. |

Rule, verbatim: **strip the leading `N.N ` from `domain`; apply
`str[0].upper() + str[1:]` to `difficulty`. Both transforms happen in the same
import pass, before the write, and neither is optional.**

Do not "fix" this by editing the staged JSON to the bank's labels - the
`objective` ids (2.1-2.11) only make sense against the numbered domain, and the
next ECO refresh reads this file against the document again.

## 2. Field mapping to the production question object

Union of keys across the 105 live questions, with what to do for each:

| bank field | present on | action for these 52 items |
| --- | --- | --- |
| `_id` | 105/105 | Firestore doc id. Let the SDK generate it; do not author. |
| `examId` | 105/105 | Set to `cxBsVz8AVaocdEYbgSMA` on every item. |
| `stem` | 105/105 | copy as-is |
| `options` | 105/105 | copy as-is (4 strings) |
| `correctAnswer` | 105/105 | copy as-is (int 0-3) |
| `explanation` | 105/105 | copy as-is |
| `domain` | 105/105 | normalized per section 1 |
| `difficulty` | 100/105 | normalized per section 1 |
| `source` | 105/105 | copy as-is (`authored-2026-08-eco-refresh`) |
| `bloomLevel` | 105/105 | **not authored.** Effectively required - every live question has it. Set `"Apply"` for all 52: each item asks the candidate to act on a scenario rather than recall a definition. If a grader later disagrees on the ~12 pure-terminology items (14, 15, 16, 17, 46-52), re-tag those to `"Remember"`; nothing in the app breaks either way. |
| `bloomConfidence` | 105/105 | **not authored.** Set `0.6` for all 52 to mark these as human-assigned rather than model-scored, so they are distinguishable from the `AI-AutoLeveler` items that carry 0.95. |
| `type` | 5/105 | omit - only the 5 `seed-matching-v1` items set it. These 52 are all standard multiple choice. |
| `matchPairs` | 5/105 | omit - matching items only. |
| `isPublished` | 5/105 | omit at the question level. Publication is controlled by `exam.isPublished` (currently `false`). |
| `imageUrl` | 1/105 | omit - no item references an image. |
| `objective` | **0/105** | **Not a bank field.** See section 3. |

## 3. The `objective` field

Every one of the 105 live questions has no `objective` key at all. The staged
items all carry one (2.1-2.11). Two acceptable outcomes, pick one before load:

- **Preferred:** write `objective` through as an additive optional field. It is
  purely additive, no reader indexes on it, and it is the only link back to the
  220-1202 document for the next audit. Existing questions keep no value.
- **Fallback:** drop it at import and keep the objective coverage in this file.
  Choosing this means the next blueprint audit has to re-derive the mapping by
  hand - do not choose it silently.

Either way, **do not** write `objective: "None"` or `objective: null` onto the
existing 105 questions to "make them consistent."

## 4. Post-load counter updates

Loading 52 Security items changes counts the dump holds as denormalized values:

- `count`: 105 -> 157
- `byDomain.Security`: 27 -> 79

`byDomain` totals 105 today (32/27/23/23) and must total 157 after. If the
importer does not recompute both, they go stale on write.

### 4a. `exam.blueprint` weights - stale, must be rewritten in this same pass

The dump carries `exam.blueprint` weights **31 / 25 / 22 / 22** (Operating
Systems / Security / Software Troubleshooting / Operational Procedures). Those
are pre-V15 numbers. The current 220-1202 (Core 2 V15) document is:

| domain | stale weight | correct weight |
| --- | --- | --- |
| Operating Systems | 31 | **28** |
| Security | 25 | **28** |
| Software Troubleshooting | 22 | **23** |
| Operational Procedures | 22 | **21** |

This is not derivable from the question load and no counter recompute touches
it, so it must be written explicitly. Leaving it alone reproduces at the exam
level exactly the blueprint drift this ECO refresh exists to remove: the bank
would be refreshed against the current document while the exam object still
advertises the superseded split.

### 4b. Security `subDomain` string is under-described

The Security `subDomain` string reads:

> `Physical Security; Malware Removal; Encryption/Authentication; Mobile Security.`

It names none of the browser/internet security or social engineering material.
Those two areas carry **19 of the 52 staged items** (2.5 social engineering,
threats and vulnerabilities = 11; 2.11 browser configuration and security = 8),
so after load the string omits the topic of more than a third of the incoming
Security questions. Extend it - e.g. append `Social Engineering and Threats;
Browser Security.` - in the same write that fixes the weights.

Note for whoever runs this: Security is 28% of the real 220-1202 exam. After
load the bank is 79/157 = 50% Security. That is a bank-composition problem to
solve by growing the other three domains, not by trimming this file.

## 5. Blueprint coverage statement for 2.0 (read before calling this complete)

This file is **not** blueprint-complete for Domain 2.0, and it is not claimed to
be. Coverage by objective (52 items):

| obj | items | note |
| --- | --- | --- |
| 2.1 | 5 | vestibule, bollards, MFA/TOTP, JIT+PAM/Zero Trust, SSO/SAML federation |
| 2.2 | 10 | share vs NTFS, BitLocker To Go, OU scope/GPO, folder redirection, security groups, UAC/Run as administrator, log-in options/Windows Hello, local vs Microsoft account, Defender activate+definitions, account types |
| 2.3 | 3 | WPA2 vs WPA3/SAE, TKIP vs AES, RADIUS/802.1X |
| 2.4 | 4 | rootkit/OS reinstall, fileless/EDR, cryptominer, MDR vs XDR |
| 2.5 | 11 | QR code phishing, whaling, evil twin, zero-day, SQL injection, XSS, on-path, DDoS, shoulder surfing, vishing, supply chain |
| 2.6 | 2 | step 2 quarantine, step 3/9 System Restore |
| 2.7 | 3 | AutoRun, failed-attempts lockout, UEFI password |
| 2.8 | 2 | remote wipe, configuration profiles/BYOD |
| 2.9 | 2 | SSD shredding vs degaussing, certification of destruction/recycling |
| 2.10 | 2 | UPnP, screened subnet |
| 2.11 | 8 | hashing, pop-up blocker, private browsing, clearing cache/cookies, secure DNS, proxy, extensions, password managers |

Coverage inside 2.0 is deliberately uneven and this file is **not** a usable
standalone 2.0 bank on its own. 2.2 (10) + 2.5 (11) + 2.11 (8) = 29 of 52, while
2.1 - the largest bullet list in the domain - has 5 and 2.10, whose 12 bullets
cover router, wireless and firewall hardening, has 2. 2.6 (a ten-step procedure)
has 2 and 2.7 has 3. Treat this file as a Security *increment*, not as domain
coverage, until the follow-up batch below lands.

**Known untested bullets, by objective.** The follow-up batch takes **2.1 and
2.10 first** - they are the starved objectives, not merely the next ones in
numeric order. Everything after those two is in numeric order and is lower
priority:

- **2.1 (take first)** - badge readers as a standalone control, alarm systems,
  door/equipment locks, security guards, fences, key fobs, smart cards, mobile
  digital key, the biometric sub-list (retina, fingerprint, palm, FRT, voice),
  lighting, magnetometers, ACLs, hardware token MFA, DLP, IAM, directory
  services. (SSO/SAML is now covered by one item and is off this list.)
- **2.10 (take second)** - change default passwords as a key, firmware updates,
  physical placement, secure management access, changing the SSID, disabling
  SSID broadcast, guest access, disabling unused ports.
- **2.2** - "Active Directory - Joining domain" is no longer tested here. The
  item that covered it was replaced (see section 6) because it duplicated 1.7
  "Domain joined vs. workgroup" and tested nothing security-specific. Do not
  re-add it to this domain; if the bank wants it, it belongs under 1.7.
- **2.3** - Kerberos and TACACS+ as keys rather than distractors; multifactor on
  wireless.
- **2.4** - Trojan, virus, spyware, ransomware, stalkerware, adware/PUP as keys;
  Recovery Console/environment/modes; user education and antiphishing training.
- **2.5** - spoofing, impersonation, spear phishing, dumpster diving, tailgating,
  DoS as distinct from DDoS, dictionary vs brute force, BEC as a key, plus the
  vulnerability bullets: unprotected systems (missing AV/firewall), EOL, BYOD.
- **2.6** - steps 4, 6, 7, 8 and 10 of the ten-step procedure.
- **2.7** - data-at-rest encryption, the full password-considerations sub-list,
  log-off/secure hardware/secure PII end-user practices, restrict log-in times,
  timeout/screen lock, account expiration as a key, change default admin
  account/password, disable unused services.
- **2.8** - the screen-lock sub-list (facial, PIN, fingerprint, pattern, swipe),
  OS and application patch management, endpoint AV/anti-malware, content
  filtering, remote backup applications, failed log-in restrictions,
  corporate-owned vs BYOD as a key, profile security requirements.
- **2.9** - drilling, incineration, erasing/wiping, low-level vs standard format
  as a key, regulatory and environmental requirements.
- **2.11** - browser patching, trusted vs untrusted sources for extensions as a
  key, valid certificates / secure sites, sign-in and browser data
  synchronization, ad blockers as a key.

"Embedded" security appears nowhere in Domain 2.0 of 220-1202 and is correctly
absent.

## 6. Verification claims - measured, not asserted

Every figure below was measured against the file as it now stands
(`security.json`, 52 items). Two earlier claims were overstated and are
restated here with their true values.

| claim | status | measured value |
| --- | --- | --- |
| 52 items, 8 keys each, 4 options each, no duplicate options, `correctAnswer` int 0-3 | holds | 52/52 |
| pure ASCII, no BOM | holds | 0 bytes > 127 |
| `correctAnswer` near-uniform | holds | 13 / 13 / 13 / 13 |
| difficulty split 25/50/25 | holds | 13 easy / 26 medium / 13 hard |
| objective ids all valid 220-1202 v2.0 | holds | set used = {2.1-2.11}, no invented ids |
| no superseded terminology | holds | zero occurrences of mantrap, DMZ, demilitarized, bare "WPA " (WEP appears once, in item 8's explanation, correctly as the historical predecessor TKIP bridged from) |
| max option-length spread within an item is 12 chars | holds | 12 (item 1, item 46) |
| **key exceeds the longest distractor by at most +2** | **false as originally claimed - restated** | ceiling is **+3**, on items 2, 19, 21 and 28. The two items that exceeded it, 29 (+5) and 16 (+4), were trimmed. Mean key-minus-longest-distractor is **-2.58** and the key is the longest option in **18 of 52** - there is no length cue in either direction. |
| **no stem opens with a generic unnamed role** | **false as originally claimed - now fixed** | two stems opened with one ("A compliance officer asks Noor...", item 26; "An auditor tells Devin...", item 3). Both were rewritten to lead with the named practitioner. Verified: zero stems now begin with A / An / The / Employees / Staff / Users. |

Also corrected from the original claim set: the file is **67,418 bytes**, not
67,357.

### 6a. Item-level changes in this revision

| item | change |
| --- | --- |
| 3 | stem re-led with the named practitioner ("Devin, a systems technician, is told by an auditor...") |
| 5 | difficulty medium -> **hard** (independent share/NTFS evaluation, most-restrictive-wins over the network) |
| 7 | difficulty easy -> **medium** (four-way-handshake capture -> SAE is not recall) |
| 16 | key trimmed to "An evil twin attack" - length only, same concept |
| 19 | distractor-B rebuttal now answers B's actual claim (shadow-copy disk space), and the lead sentence was reworded so the two do not repeat each other verbatim |
| 26 | stem re-led with the named practitioner ("Noor is asked by a compliance officer...") |
| 29 | key trimmed to "Compare the computed SHA-256 hash to the vendor's published one." - length only, same concept |
| 30 | **replaced.** Was a 2.2 domain-join item that tested nothing security-specific and duplicated 1.7. Now a 2.1 item on SSO/SAML federation. `objective` 2.2 -> 2.1; difficulty and key position unchanged (easy, index 0) so the distributions above are untouched |
| 34 | stem no longer describes a UAC credential prompt - the installer now exits with "This installation requires administrative privileges," so Run as administrator is the action that changes the outcome rather than a restatement of the current state; the distractor-D rebuttal was updated to match |
| 44 | key reduced to the remediation the scenario requires: "Remove the extension from the browser." The conditional reinstall was dropped from both key and explanation |
| 45 | difficulty hard -> **easy** (recognition-level: password reuse -> password manager) |

The three difficulty moves are mutually offsetting, so the split is still
exactly 13 / 26 / 13.
