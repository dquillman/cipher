/**
 * Seed PBQ (Performance-Based Questions) for CompTIA exams.
 *
 * Usage:
 *   node functions/scripts/seed_pbq_comptia.js
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin default credentials.
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

const SECURITY_PLUS_ID = '79cuGMNydTwDMhyiDjry';
const NETWORK_PLUS_ID = 'gp6QwBz0FXFIntLSQSYr';
const A_PLUS_CORE2_ID = 'cxBsVz8AVaocdEYbgSMA';

const questions = [

    // ═══════════════════════════════════════════════════════════════
    // SECURITY+ PBQs
    // ═══════════════════════════════════════════════════════════════

    // ── Drag-Drop: Classify attack types ──
    {
        examId: SECURITY_PLUS_ID,
        type: 'pbq',
        domain: 'Threats, Vulnerabilities, and Mitigations',
        stem: 'A security analyst is reviewing recent incident reports. Drag each attack technique to the correct attack category.',
        pbqConfig: {
            pbqType: 'drag-drop',
            dragDrop: {
                zones: [
                    { id: 'social', label: 'Social Engineering' },
                    { id: 'network', label: 'Network Attack' },
                    { id: 'application', label: 'Application Attack' },
                    { id: 'crypto', label: 'Cryptographic Attack' },
                ],
                items: [
                    { id: 'a1', label: 'Pretexting', correctZone: 'social' },
                    { id: 'a2', label: 'ARP Poisoning', correctZone: 'network' },
                    { id: 'a3', label: 'SQL Injection', correctZone: 'application' },
                    { id: 'a4', label: 'Birthday Attack', correctZone: 'crypto' },
                    { id: 'a5', label: 'Tailgating', correctZone: 'social' },
                    { id: 'a6', label: 'Cross-Site Scripting', correctZone: 'application' },
                    { id: 'a7', label: 'VLAN Hopping', correctZone: 'network' },
                    { id: 'a8', label: 'Rainbow Table', correctZone: 'crypto' },
                ],
            },
        },
        explanation: 'Social engineering targets people (pretexting, tailgating). Network attacks target infrastructure (ARP poisoning, VLAN hopping). Application attacks exploit code flaws (SQLi, XSS). Cryptographic attacks target encryption weaknesses (birthday attack, rainbow tables).',
        options: [],
        correctAnswer: 0,
    },

    // ── Fill-Table: Firewall ACL configuration ──
    {
        examId: SECURITY_PLUS_ID,
        type: 'pbq',
        domain: 'Security Architecture',
        stem: 'You are configuring a firewall ACL for a web server in the DMZ. Complete the firewall rules to allow only required traffic. The web server IP is 10.0.1.50.',
        pbqConfig: {
            pbqType: 'fill-table',
            fillTable: {
                columns: ['Action', 'Protocol', 'Destination Port'],
                rows: [
                    {
                        label: 'Inbound HTTPS',
                        fields: [
                            { correctValue: 'Allow', options: ['Allow', 'Deny'] },
                            { correctValue: 'TCP', options: ['TCP', 'UDP', 'ICMP'] },
                            { correctValue: '443', options: ['22', '80', '443', '3389'] },
                        ],
                    },
                    {
                        label: 'Inbound HTTP',
                        fields: [
                            { correctValue: 'Allow', options: ['Allow', 'Deny'] },
                            { correctValue: 'TCP', options: ['TCP', 'UDP', 'ICMP'] },
                            { correctValue: '80', options: ['22', '80', '443', '3389'] },
                        ],
                    },
                    {
                        label: 'Inbound SSH (management)',
                        fields: [
                            { correctValue: 'Allow', options: ['Allow', 'Deny'] },
                            { correctValue: 'TCP', options: ['TCP', 'UDP', 'ICMP'] },
                            { correctValue: '22', options: ['22', '80', '443', '3389'] },
                        ],
                    },
                    {
                        label: 'Inbound RDP',
                        fields: [
                            { correctValue: 'Deny', options: ['Allow', 'Deny'] },
                            { correctValue: 'TCP', options: ['TCP', 'UDP', 'ICMP'] },
                            { correctValue: '3389', options: ['22', '80', '443', '3389'] },
                        ],
                    },
                ],
            },
        },
        explanation: 'A DMZ web server needs HTTPS (443) and HTTP (80) inbound for clients, SSH (22) for remote management, and RDP (3389) should be denied as it is a Windows remote access protocol not needed on a web server and is a common attack vector.',
        options: [],
        correctAnswer: 0,
    },

    // ── Order-Steps: Incident response procedure ──
    {
        examId: SECURITY_PLUS_ID,
        type: 'pbq',
        domain: 'Security Operations',
        stem: 'A ransomware infection has been detected on a workstation. Arrange the incident response steps in the correct order per NIST SP 800-61.',
        pbqConfig: {
            pbqType: 'order-steps',
            orderSteps: {
                steps: [
                    'Preparation — Ensure IR plan, tools, and communication channels are ready',
                    'Detection & Analysis — Confirm the ransomware variant and scope of infection',
                    'Containment — Isolate affected systems from the network',
                    'Eradication — Remove the ransomware and close the attack vector',
                    'Recovery — Restore systems from clean backups and verify integrity',
                    'Post-Incident Activity — Document lessons learned and update defenses',
                ],
            },
        },
        explanation: 'NIST SP 800-61 defines the incident response lifecycle: Preparation → Detection & Analysis → Containment → Eradication → Recovery → Lessons Learned. Skipping steps or reordering (e.g., eradicating before containing) risks reinfection or evidence loss.',
        options: [],
        correctAnswer: 0,
    },

    // ── Command: Manage certificates ──
    {
        examId: SECURITY_PLUS_ID,
        type: 'pbq',
        domain: 'Security Architecture',
        stem: 'You need to generate a new 2048-bit RSA private key and then create a Certificate Signing Request (CSR) for the domain "secure.example.com". Enter the commands in the correct order.',
        pbqConfig: {
            pbqType: 'command',
            command: {
                prompt: '$ ',
                scenario: 'Generate a 2048-bit RSA private key named "server.key", then create a CSR named "server.csr" using that key.',
                acceptedCommands: [
                    [
                        'openssl genrsa -out server.key 2048',
                        'openssl req -new -key server.key -out server.csr',
                    ],
                    [
                        'openssl genpkey -algorithm RSA -out server.key -pkeyopt rsa_keygen_bits:2048',
                        'openssl req -new -key server.key -out server.csr',
                    ],
                ],
                hints: [
                    'Use the openssl command-line tool',
                    'genrsa generates RSA keys; req creates CSRs',
                ],
            },
        },
        explanation: 'The openssl genrsa command generates an RSA private key. The openssl req -new command creates a CSR using that key. The CSR is then sent to a Certificate Authority (CA) for signing. The -out flag specifies the output file.',
        options: [],
        correctAnswer: 0,
    },

    // ── Drag-Drop: Match security controls to categories ──
    {
        examId: SECURITY_PLUS_ID,
        type: 'pbq',
        domain: 'General Security Concepts',
        stem: 'Your organization is implementing a defense-in-depth strategy. Place each security measure in the correct control category.',
        pbqConfig: {
            pbqType: 'drag-drop',
            dragDrop: {
                zones: [
                    { id: 'preventive', label: 'Preventive' },
                    { id: 'detective', label: 'Detective' },
                    { id: 'corrective', label: 'Corrective' },
                    { id: 'deterrent', label: 'Deterrent' },
                ],
                items: [
                    { id: 'b1', label: 'Firewall rules', correctZone: 'preventive' },
                    { id: 'b2', label: 'IDS alert', correctZone: 'detective' },
                    { id: 'b3', label: 'Backup restoration', correctZone: 'corrective' },
                    { id: 'b4', label: 'Warning banner', correctZone: 'deterrent' },
                    { id: 'b5', label: 'Access control list', correctZone: 'preventive' },
                    { id: 'b6', label: 'Log monitoring', correctZone: 'detective' },
                    { id: 'b7', label: 'Patch deployment', correctZone: 'corrective' },
                    { id: 'b8', label: 'Security camera', correctZone: 'deterrent' },
                ],
            },
        },
        explanation: 'Preventive controls stop threats (firewalls, ACLs). Detective controls identify threats (IDS, log monitoring). Corrective controls fix damage (backups, patches). Deterrent controls discourage attacks (banners, cameras).',
        options: [],
        correctAnswer: 0,
    },

    // ── Fill-Table: Wireless security configuration ──
    {
        examId: SECURITY_PLUS_ID,
        type: 'pbq',
        domain: 'Security Architecture',
        stem: 'Configure the wireless access point settings for a corporate network following security best practices.',
        pbqConfig: {
            pbqType: 'fill-table',
            fillTable: {
                columns: ['Value'],
                rows: [
                    {
                        label: 'Security Protocol',
                        fields: [{ correctValue: 'WPA3-Enterprise', options: ['WEP', 'WPA2-Personal', 'WPA2-Enterprise', 'WPA3-Enterprise', 'Open'] }],
                    },
                    {
                        label: 'Authentication',
                        fields: [{ correctValue: '802.1X', options: ['Pre-shared Key', '802.1X', 'MAC Filtering', 'Open System'] }],
                    },
                    {
                        label: 'Encryption',
                        fields: [{ correctValue: 'AES-GCMP-256', options: ['TKIP', 'AES-CCMP', 'AES-GCMP-256', 'RC4'] }],
                    },
                    {
                        label: 'SSID Broadcast',
                        fields: [{ correctValue: 'Disabled', options: ['Enabled', 'Disabled'] }],
                    },
                ],
            },
        },
        explanation: 'Corporate wireless should use WPA3-Enterprise with 802.1X (RADIUS) authentication for individual credentials. AES-GCMP-256 is the strongest encryption available in WPA3. Disabling SSID broadcast adds a minor layer of obscurity (security through obscurity, but still recommended as part of defense-in-depth).',
        options: [],
        correctAnswer: 0,
    },

    // ═══════════════════════════════════════════════════════════════
    // NETWORK+ PBQs
    // ═══════════════════════════════════════════════════════════════

    // ── Drag-Drop: OSI model classification ──
    {
        examId: NETWORK_PLUS_ID,
        type: 'pbq',
        domain: 'Networking Fundamentals',
        stem: 'Drag each protocol or device to its correct OSI model layer.',
        pbqConfig: {
            pbqType: 'drag-drop',
            dragDrop: {
                zones: [
                    { id: 'layer7', label: 'Layer 7 — Application' },
                    { id: 'layer4', label: 'Layer 4 — Transport' },
                    { id: 'layer3', label: 'Layer 3 — Network' },
                    { id: 'layer2', label: 'Layer 2 — Data Link' },
                ],
                items: [
                    { id: 'n1', label: 'HTTP', correctZone: 'layer7' },
                    { id: 'n2', label: 'TCP', correctZone: 'layer4' },
                    { id: 'n3', label: 'IP', correctZone: 'layer3' },
                    { id: 'n4', label: 'Switch (MAC table)', correctZone: 'layer2' },
                    { id: 'n5', label: 'DNS', correctZone: 'layer7' },
                    { id: 'n6', label: 'UDP', correctZone: 'layer4' },
                    { id: 'n7', label: 'Router', correctZone: 'layer3' },
                    { id: 'n8', label: 'ARP', correctZone: 'layer2' },
                ],
            },
        },
        explanation: 'HTTP and DNS operate at Layer 7 (Application). TCP and UDP operate at Layer 4 (Transport). IP and routers operate at Layer 3 (Network). Switches (using MAC tables) and ARP operate at Layer 2 (Data Link).',
        options: [],
        correctAnswer: 0,
    },

    // ── Fill-Table: Subnet configuration ──
    {
        examId: NETWORK_PLUS_ID,
        type: 'pbq',
        domain: 'Networking Fundamentals',
        stem: 'A company has been assigned the network 192.168.10.0/24. Complete the subnet configuration for the following VLANs. Each VLAN needs at least 30 usable hosts.',
        pbqConfig: {
            pbqType: 'fill-table',
            fillTable: {
                columns: ['Subnet Mask', 'Network Address', 'Broadcast'],
                rows: [
                    {
                        label: 'VLAN 10 (Sales)',
                        fields: [
                            { correctValue: '255.255.255.192', options: ['255.255.255.0', '255.255.255.128', '255.255.255.192', '255.255.255.224'] },
                            { correctValue: '192.168.10.0', options: ['192.168.10.0', '192.168.10.64', '192.168.10.128', '192.168.10.192'] },
                            { correctValue: '192.168.10.63', options: ['192.168.10.31', '192.168.10.63', '192.168.10.127', '192.168.10.255'] },
                        ],
                    },
                    {
                        label: 'VLAN 20 (Engineering)',
                        fields: [
                            { correctValue: '255.255.255.192', options: ['255.255.255.0', '255.255.255.128', '255.255.255.192', '255.255.255.224'] },
                            { correctValue: '192.168.10.64', options: ['192.168.10.0', '192.168.10.64', '192.168.10.128', '192.168.10.192'] },
                            { correctValue: '192.168.10.127', options: ['192.168.10.63', '192.168.10.127', '192.168.10.191', '192.168.10.255'] },
                        ],
                    },
                    {
                        label: 'VLAN 30 (Management)',
                        fields: [
                            { correctValue: '255.255.255.192', options: ['255.255.255.0', '255.255.255.128', '255.255.255.192', '255.255.255.224'] },
                            { correctValue: '192.168.10.128', options: ['192.168.10.0', '192.168.10.64', '192.168.10.128', '192.168.10.192'] },
                            { correctValue: '192.168.10.191', options: ['192.168.10.127', '192.168.10.159', '192.168.10.191', '192.168.10.255'] },
                        ],
                    },
                ],
            },
        },
        explanation: 'A /26 subnet (255.255.255.192) provides 62 usable hosts per subnet (2^6 - 2 = 62), which satisfies the 30-host minimum. The first subnet starts at .0 (broadcast .63), second at .64 (broadcast .127), third at .128 (broadcast .191). A /27 would only give 30 hosts — cutting it too close with no room for growth.',
        options: [],
        correctAnswer: 0,
    },

    // ── Order-Steps: Network troubleshooting methodology ──
    {
        examId: NETWORK_PLUS_ID,
        type: 'pbq',
        domain: 'Network Troubleshooting',
        stem: 'A user reports they cannot access the company intranet. Arrange the CompTIA troubleshooting methodology steps in the correct order.',
        pbqConfig: {
            pbqType: 'order-steps',
            orderSteps: {
                steps: [
                    'Identify the problem — gather information, question users, identify symptoms',
                    'Establish a theory of probable cause — consider multiple approaches, use OSI model',
                    'Test the theory to determine cause — confirm the theory; if not confirmed, re-establish',
                    'Establish a plan of action and identify potential effects',
                    'Implement the solution or escalate as necessary',
                    'Verify full system functionality and implement preventive measures',
                    'Document findings, actions, and outcomes',
                ],
            },
        },
        explanation: 'The CompTIA troubleshooting methodology follows a structured 7-step approach: Identify → Theory → Test → Plan → Implement → Verify → Document. This systematic process ensures thorough problem resolution and prevents skipping critical steps like documentation.',
        options: [],
        correctAnswer: 0,
    },

    // ── Command: Network diagnostics ──
    {
        examId: NETWORK_PLUS_ID,
        type: 'pbq',
        domain: 'Network Troubleshooting',
        stem: 'A user cannot reach a remote server at 10.0.5.20. You need to check connectivity and trace the route to identify where packets are being dropped. Enter the diagnostic commands.',
        pbqConfig: {
            pbqType: 'command',
            command: {
                prompt: 'C:\\> ',
                scenario: 'First, verify basic connectivity to 10.0.5.20 using a ping test. Then, trace the network path to identify where the connection fails.',
                acceptedCommands: [
                    ['ping 10.0.5.20', 'tracert 10.0.5.20'],
                    ['ping 10.0.5.20', 'traceroute 10.0.5.20'],
                ],
                hints: [
                    'Use standard Windows network diagnostic commands',
                    'Test connectivity first, then trace the route',
                ],
            },
        },
        explanation: 'ping tests basic ICMP connectivity to the destination. tracert (Windows) / traceroute (Linux) shows each hop along the route, helping identify where packets are being dropped or experiencing high latency. Always start with ping before tracert to confirm the basic problem.',
        options: [],
        correctAnswer: 0,
    },

    // ── Drag-Drop: Match ports to services ──
    {
        examId: NETWORK_PLUS_ID,
        type: 'pbq',
        domain: 'Networking Fundamentals',
        stem: 'You are reviewing firewall logs and see traffic on several ports. Drag each service to the correct well-known port number.',
        pbqConfig: {
            pbqType: 'drag-drop',
            dragDrop: {
                zones: [
                    { id: 'p22', label: 'Port 22' },
                    { id: 'p53', label: 'Port 53' },
                    { id: 'p443', label: 'Port 443' },
                    { id: 'p3389', label: 'Port 3389' },
                ],
                items: [
                    { id: 'p1', label: 'SSH', correctZone: 'p22' },
                    { id: 'p2', label: 'SFTP', correctZone: 'p22' },
                    { id: 'p3', label: 'DNS', correctZone: 'p53' },
                    { id: 'p4', label: 'HTTPS', correctZone: 'p443' },
                    { id: 'p5', label: 'TLS Web Traffic', correctZone: 'p443' },
                    { id: 'p6', label: 'RDP', correctZone: 'p3389' },
                ],
            },
        },
        explanation: 'SSH and SFTP both use port 22 (SFTP runs over the SSH protocol). DNS uses port 53. HTTPS and TLS web traffic use port 443. RDP (Remote Desktop Protocol) uses port 3389.',
        options: [],
        correctAnswer: 0,
    },

    // ═══════════════════════════════════════════════════════════════
    // A+ CORE 2 PBQs
    // ═══════════════════════════════════════════════════════════════

    // ── Order-Steps: Malware removal process ──
    {
        examId: A_PLUS_CORE2_ID,
        type: 'pbq',
        domain: 'Security',
        stem: 'A user\'s computer is showing signs of malware infection. Arrange the CompTIA malware removal steps in the correct order.',
        pbqConfig: {
            pbqType: 'order-steps',
            orderSteps: {
                steps: [
                    'Investigate and verify malware symptoms',
                    'Quarantine infected systems',
                    'Disable System Restore to prevent reinfection from restore points',
                    'Remediate infected systems — update anti-malware signatures and run full scan',
                    'Schedule scans and run updates',
                    'Enable System Restore and create a new restore point',
                    'Educate the end user on malware prevention',
                ],
            },
        },
        explanation: 'CompTIA\'s malware removal process: 1) Investigate symptoms, 2) Quarantine, 3) Disable System Restore (old restore points may contain malware), 4) Remediate (scan/clean), 5) Schedule ongoing protection, 6) Re-enable System Restore with clean state, 7) Educate user. The order prevents reinfection and ensures a clean baseline.',
        options: [],
        correctAnswer: 0,
    },

    // ── Fill-Table: Email client configuration ──
    {
        examId: A_PLUS_CORE2_ID,
        type: 'pbq',
        domain: 'Software Troubleshooting',
        stem: 'Configure the email client for a user who needs to access their corporate email using secure IMAP and SMTP settings.',
        pbqConfig: {
            pbqType: 'fill-table',
            fillTable: {
                columns: ['Port', 'Encryption'],
                rows: [
                    {
                        label: 'Incoming Mail (IMAPS)',
                        fields: [
                            { correctValue: '993', options: ['110', '143', '993', '995'] },
                            { correctValue: 'SSL/TLS', options: ['None', 'STARTTLS', 'SSL/TLS'] },
                        ],
                    },
                    {
                        label: 'Outgoing Mail (SMTPS)',
                        fields: [
                            { correctValue: '587', options: ['25', '110', '465', '587'] },
                            { correctValue: 'STARTTLS', options: ['None', 'STARTTLS', 'SSL/TLS'] },
                        ],
                    },
                ],
            },
        },
        explanation: 'IMAPS (secure IMAP) uses port 993 with SSL/TLS encryption. SMTP submission uses port 587 with STARTTLS (upgrades an unencrypted connection to encrypted). Port 25 is for server-to-server relay and is typically blocked for clients. Port 465 was historically used for SMTPS but 587 with STARTTLS is the current standard.',
        options: [],
        correctAnswer: 0,
    },

    // ── Command: Windows system management ──
    {
        examId: A_PLUS_CORE2_ID,
        type: 'pbq',
        domain: 'Operating Systems',
        stem: 'A technician needs to check the integrity of Windows system files and repair any corruption. Enter the commands in the correct order.',
        pbqConfig: {
            pbqType: 'command',
            command: {
                prompt: 'C:\\> ',
                scenario: 'First, run the System File Checker to scan for and repair corrupted system files. If that doesn\'t resolve the issue, use DISM to repair the Windows image.',
                acceptedCommands: [
                    ['sfc /scannow', 'dism /online /cleanup-image /restorehealth'],
                    ['sfc /scannow', 'DISM /Online /Cleanup-Image /RestoreHealth'],
                ],
                hints: [
                    'SFC is the first-line tool for system file repair',
                    'DISM can repair the component store that SFC relies on',
                ],
            },
        },
        explanation: 'sfc /scannow scans all protected system files and replaces corrupted versions from a cached copy. If SFC reports it cannot fix files, DISM /Online /Cleanup-Image /RestoreHealth repairs the Windows component store (the source SFC uses). Always run SFC first, then DISM if needed.',
        options: [],
        correctAnswer: 0,
    },

    // ── Drag-Drop: Windows tools to tasks ──
    {
        examId: A_PLUS_CORE2_ID,
        type: 'pbq',
        domain: 'Operating Systems',
        stem: 'Match each Windows administrative task to the correct tool or command.',
        pbqConfig: {
            pbqType: 'drag-drop',
            dragDrop: {
                zones: [
                    { id: 'disk', label: 'Disk Management (diskmgmt.msc)' },
                    { id: 'devmgr', label: 'Device Manager (devmgmt.msc)' },
                    { id: 'event', label: 'Event Viewer (eventvwr.msc)' },
                    { id: 'task', label: 'Task Manager (taskmgr)' },
                ],
                items: [
                    { id: 'w1', label: 'Extend a partition', correctZone: 'disk' },
                    { id: 'w2', label: 'Initialize a new SSD', correctZone: 'disk' },
                    { id: 'w3', label: 'Update a driver', correctZone: 'devmgr' },
                    { id: 'w4', label: 'Disable a hardware device', correctZone: 'devmgr' },
                    { id: 'w5', label: 'View application crash logs', correctZone: 'event' },
                    { id: 'w6', label: 'Check for Blue Screen error codes', correctZone: 'event' },
                    { id: 'w7', label: 'End a frozen process', correctZone: 'task' },
                    { id: 'w8', label: 'Monitor CPU and memory usage', correctZone: 'task' },
                ],
            },
        },
        explanation: 'Disk Management handles partition/volume operations (extend, shrink, initialize). Device Manager manages hardware drivers (update, disable, rollback). Event Viewer shows system/application/security logs. Task Manager monitors performance and manages running processes.',
        options: [],
        correctAnswer: 0,
    },

    // ── Fill-Table: User account security settings ──
    {
        examId: A_PLUS_CORE2_ID,
        type: 'pbq',
        domain: 'Security',
        stem: 'Configure the local security policy password settings for a workstation following corporate security best practices.',
        pbqConfig: {
            pbqType: 'fill-table',
            fillTable: {
                columns: ['Value'],
                rows: [
                    {
                        label: 'Minimum Password Length',
                        fields: [{ correctValue: '12', options: ['4', '6', '8', '12', '16'] }],
                    },
                    {
                        label: 'Maximum Password Age',
                        fields: [{ correctValue: '90 days', options: ['30 days', '60 days', '90 days', '180 days', 'Never'] }],
                    },
                    {
                        label: 'Account Lockout Threshold',
                        fields: [{ correctValue: '5 attempts', options: ['3 attempts', '5 attempts', '10 attempts', 'Unlimited'] }],
                    },
                    {
                        label: 'Lockout Duration',
                        fields: [{ correctValue: '30 minutes', options: ['5 minutes', '15 minutes', '30 minutes', '60 minutes', 'Until admin unlock'] }],
                    },
                ],
            },
        },
        explanation: 'Industry best practices: Minimum 12 characters (NIST recommends 8+ but 12 is standard corporate policy). 90-day maximum age balances security with usability. 5-attempt lockout prevents brute-force without being too aggressive. 30-minute lockout duration deters attackers while allowing legitimate users to retry.',
        options: [],
        correctAnswer: 0,
    },

    // ── Order-Steps: Windows 11 clean install ──
    {
        examId: A_PLUS_CORE2_ID,
        type: 'pbq',
        domain: 'Operating Systems',
        stem: 'A technician is performing a clean installation of Windows 11. Arrange the installation steps in the correct order.',
        pbqConfig: {
            pbqType: 'order-steps',
            orderSteps: {
                steps: [
                    'Boot from the USB installation media',
                    'Select language, time, and keyboard input',
                    'Click "Install Now" and enter the product key',
                    'Accept the license terms and select "Custom: Install Windows only"',
                    'Select or create the target partition',
                    'Wait for file copying, installation, and automatic reboots',
                    'Complete the Out-of-Box Experience (OOBE) — region, account, privacy settings',
                    'Install drivers and Windows Updates',
                ],
            },
        },
        explanation: 'The Windows clean install follows a defined sequence: Boot media → Language selection → Install/Key → License/Custom install → Partition → File copy/reboots → OOBE setup → Post-install drivers and updates. Choosing "Custom" instead of "Upgrade" ensures a clean installation.',
        options: [],
        correctAnswer: 0,
    },
];

async function main() {
    console.log(`Seeding ${questions.length} PBQ questions...`);
    const batch = db.batch();
    for (const q of questions) {
        const ref = db.collection('questions').doc();
        batch.set(ref, {
            ...q,
            isPublished: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'seed-pbq-v1',
        });
    }
    await batch.commit();
    console.log(`✔ Seeded ${questions.length} PBQ questions (${questions.filter(q => q.examId === SECURITY_PLUS_ID).length} Security+, ${questions.filter(q => q.examId === NETWORK_PLUS_ID).length} Network+, ${questions.filter(q => q.examId === A_PLUS_CORE2_ID).length} A+ Core 2)`);
}

main().catch(console.error);
