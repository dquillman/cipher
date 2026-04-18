const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'exam-coach-ai-platform' });
const db = admin.firestore();

const SECURITY_PLUS_ID = '79cuGMNydTwDMhyiDjry';
const NETWORK_PLUS_ID = 'gp6QwBz0FXFIntLSQSYr';
const A_PLUS_CORE2_ID = 'cxBsVz8AVaocdEYbgSMA';

const questions = [
    // ===== CompTIA Security+ SY0-701 =====
    {
        examId: SECURITY_PLUS_ID,
        type: 'matching',
        domain: 'General Security Concepts',
        stem: 'Match each security control category to its correct example:',
        matchPairs: [
            { term: 'Technical Control', definition: 'Firewall rules blocking unauthorized traffic' },
            { term: 'Administrative Control', definition: 'Security awareness training for employees' },
            { term: 'Physical Control', definition: 'Biometric locks on the server room door' },
            { term: 'Operational Control', definition: 'Daily log review procedures by the SOC team' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Security controls are classified by how they are implemented. Technical controls use technology (firewalls, encryption). Administrative controls are policies and training. Physical controls protect physical assets (locks, cameras). Operational controls are day-to-day procedures carried out by people.',
    },
    {
        examId: SECURITY_PLUS_ID,
        type: 'matching',
        domain: 'Threats, Vulnerabilities, and Mitigations',
        stem: 'Match each attack type to its description:',
        matchPairs: [
            { term: 'Phishing', definition: 'Fraudulent emails trick users into revealing credentials' },
            { term: 'DDoS', definition: 'Overwhelming a server with traffic from multiple sources' },
            { term: 'SQL Injection', definition: 'Inserting malicious database queries via input fields' },
            { term: 'Tailgating', definition: 'Following an authorized person through a secure door' },
            { term: 'Privilege Escalation', definition: 'Exploiting a flaw to gain higher access than authorized' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Each attack targets a different layer. Phishing exploits human trust via email. DDoS targets availability by flooding resources. SQL injection exploits unvalidated input to manipulate databases. Tailgating bypasses physical security. Privilege escalation abuses system vulnerabilities to gain admin-level access.',
    },
    {
        examId: SECURITY_PLUS_ID,
        type: 'matching',
        domain: 'Security Architecture',
        stem: 'Match each cryptographic method to its key characteristic:',
        matchPairs: [
            { term: 'Symmetric Encryption (AES)', definition: 'Uses the same key for encryption and decryption' },
            { term: 'Asymmetric Encryption (RSA)', definition: 'Uses a public/private key pair' },
            { term: 'Hashing (SHA-256)', definition: 'Produces a fixed-length digest that cannot be reversed' },
            { term: 'Digital Signature', definition: 'Provides authentication and non-repudiation' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Symmetric encryption is fast and uses one shared key (AES, DES). Asymmetric uses key pairs — public for encryption, private for decryption (RSA, ECC). Hashing creates a one-way fingerprint for integrity verification. Digital signatures combine hashing with asymmetric encryption to prove identity and prevent repudiation.',
    },
    {
        examId: SECURITY_PLUS_ID,
        type: 'matching',
        domain: 'Security Operations',
        stem: 'Match each well-known port number to the service it supports:',
        matchPairs: [
            { term: 'Port 22', definition: 'SSH — Secure remote shell access' },
            { term: 'Port 443', definition: 'HTTPS — Encrypted web traffic' },
            { term: 'Port 3389', definition: 'RDP — Remote Desktop Protocol' },
            { term: 'Port 53', definition: 'DNS — Domain name resolution' },
            { term: 'Port 389', definition: 'LDAP — Directory services queries' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Knowing port numbers is critical for firewall rules and log analysis. SSH (22) provides encrypted remote access. HTTPS (443) secures web communication. RDP (3389) enables remote desktop connections. DNS (53) resolves domain names to IPs. LDAP (389) queries directory services like Active Directory.',
    },
    {
        examId: SECURITY_PLUS_ID,
        type: 'matching',
        domain: 'Security Program Management and Oversight',
        stem: 'Match each incident response phase to the correct action:',
        matchPairs: [
            { term: 'Identification', definition: 'Detect and confirm that a security event has occurred' },
            { term: 'Containment', definition: 'Isolate affected systems to prevent further spread' },
            { term: 'Eradication', definition: 'Remove the root cause and any malicious artifacts' },
            { term: 'Recovery', definition: 'Restore systems to normal operation and verify integrity' },
            { term: 'Lessons Learned', definition: 'Document findings and update procedures to prevent recurrence' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'The incident response lifecycle follows a structured order. Identification detects the event. Containment limits damage (short-term and long-term). Eradication removes the threat entirely. Recovery restores services with validation. Lessons Learned is the post-incident review that improves future response.',
    },

    // ===== CompTIA Network+ N10-008 =====
    {
        examId: NETWORK_PLUS_ID,
        type: 'matching',
        domain: 'Networking Fundamentals',
        stem: 'Match each OSI model layer to its primary function:',
        matchPairs: [
            { term: 'Layer 1 — Physical', definition: 'Transmits raw electrical or optical signals over cables' },
            { term: 'Layer 2 — Data Link', definition: 'Handles MAC addressing and frame delivery on a local segment' },
            { term: 'Layer 3 — Network', definition: 'Routes packets between networks using IP addresses' },
            { term: 'Layer 4 — Transport', definition: 'Manages end-to-end delivery with TCP or UDP' },
            { term: 'Layer 7 — Application', definition: 'Provides network services directly to user applications' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'The OSI model defines how data moves through a network. Physical (L1) deals with cables and signals. Data Link (L2) uses MAC addresses for local delivery. Network (L3) routes packets via IP. Transport (L4) ensures reliable or fast delivery via TCP/UDP. Application (L7) interfaces with software like browsers and email clients.',
    },
    {
        examId: NETWORK_PLUS_ID,
        type: 'matching',
        domain: 'Networking Fundamentals',
        stem: 'Match each network device to the OSI layer it primarily operates at:',
        matchPairs: [
            { term: 'Hub', definition: 'Layer 1 — Broadcasts all traffic to every port' },
            { term: 'Switch', definition: 'Layer 2 — Forwards frames based on MAC addresses' },
            { term: 'Router', definition: 'Layer 3 — Routes packets between different networks' },
            { term: 'Firewall', definition: 'Layer 3-7 — Filters traffic based on rules and inspection' },
            { term: 'Wireless Access Point', definition: 'Layer 2 — Bridges wireless clients to the wired network' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Each device operates at a specific OSI layer. Hubs (L1) blindly repeat signals. Switches (L2) use MAC address tables for efficient forwarding. Routers (L3) make forwarding decisions based on IP. Firewalls inspect traffic across multiple layers. Access points bridge 802.11 wireless to 802.3 wired at Layer 2.',
    },
    {
        examId: NETWORK_PLUS_ID,
        type: 'matching',
        domain: 'Network Implementation',
        stem: 'Match each cable type to its best use case:',
        matchPairs: [
            { term: 'Cat 6 UTP', definition: 'Standard Ethernet LAN connections up to 10 Gbps at 55m' },
            { term: 'Single-mode Fiber', definition: 'Long-distance WAN links spanning kilometers' },
            { term: 'Multimode Fiber', definition: 'High-speed backbone connections within a building' },
            { term: 'Coaxial (RG-6)', definition: 'Cable TV and broadband internet service delivery' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Cable selection depends on distance, speed, and environment. Cat 6 UTP is the standard for office LANs. Single-mode fiber uses a narrow core for long distances with minimal signal loss. Multimode fiber handles shorter high-speed runs within buildings. Coaxial (RG-6) is common for cable TV and ISP last-mile connections.',
    },
    {
        examId: NETWORK_PLUS_ID,
        type: 'matching',
        domain: 'Network Security',
        stem: 'Match each network port to the protocol it serves:',
        matchPairs: [
            { term: 'Port 67/68', definition: 'DHCP — Dynamically assigns IP addresses to clients' },
            { term: 'Port 25', definition: 'SMTP — Sends outgoing email between mail servers' },
            { term: 'Port 143', definition: 'IMAP — Retrieves email while keeping it on the server' },
            { term: 'Port 161/162', definition: 'SNMP — Monitors and manages network devices' },
            { term: 'Port 636', definition: 'LDAPS — Encrypted directory service queries' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Port-protocol mapping is essential for network administration. DHCP (67/68) automates IP configuration. SMTP (25) handles mail transfer. IMAP (143) synchronizes email across devices. SNMP (161/162) enables network monitoring. LDAPS (636) is the secure version of LDAP for directory queries.',
    },
    {
        examId: NETWORK_PLUS_ID,
        type: 'matching',
        domain: 'Network Troubleshooting',
        stem: 'Match each troubleshooting step to its correct position in the CompTIA methodology:',
        matchPairs: [
            { term: 'Step 1', definition: 'Identify the problem — gather information and question users' },
            { term: 'Step 2', definition: 'Establish a theory of probable cause' },
            { term: 'Step 3', definition: 'Test the theory to determine the actual cause' },
            { term: 'Step 4', definition: 'Establish a plan of action to resolve the problem' },
            { term: 'Step 5', definition: 'Implement the solution or escalate as necessary' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'The CompTIA troubleshooting methodology is a structured 7-step process. It starts with identifying the problem through user interviews and observation. Then establish and test theories before acting. Create a plan, implement it, verify everything works, and document the outcome. Skipping steps leads to incomplete fixes.',
    },

    // ===== CompTIA A+ Core 2 (220-1102) =====
    {
        examId: A_PLUS_CORE2_ID,
        type: 'matching',
        domain: 'Operating Systems',
        stem: 'Match each Windows command-line tool to its function:',
        matchPairs: [
            { term: 'ipconfig /all', definition: 'Display detailed IP configuration including DHCP and DNS' },
            { term: 'netstat -an', definition: 'List all active connections and listening ports' },
            { term: 'nslookup', definition: 'Query DNS servers to resolve domain names' },
            { term: 'tracert', definition: 'Trace the route packets take to reach a destination' },
            { term: 'sfc /scannow', definition: 'Scan and repair protected Windows system files' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Windows command-line tools are essential for troubleshooting. ipconfig shows network configuration. netstat reveals active connections and open ports. nslookup tests DNS resolution. tracert maps the network path to a host. sfc (System File Checker) repairs corrupted OS files using cached copies.',
    },
    {
        examId: A_PLUS_CORE2_ID,
        type: 'matching',
        domain: 'Security',
        stem: 'Match each security concept to its definition:',
        matchPairs: [
            { term: 'Authentication', definition: 'Verifying the identity of a user or device' },
            { term: 'Authorization', definition: 'Determining what resources a verified user can access' },
            { term: 'Principle of Least Privilege', definition: 'Granting only the minimum permissions needed for a task' },
            { term: 'Multi-Factor Authentication', definition: 'Requiring two or more verification methods to log in' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Authentication confirms who you are (password, biometric). Authorization decides what you can do (file permissions, group policies). Least Privilege limits access to only what is necessary, reducing attack surface. MFA combines something you know, have, or are — making credential theft alone insufficient for access.',
    },
    {
        examId: A_PLUS_CORE2_ID,
        type: 'matching',
        domain: 'Software Troubleshooting',
        stem: 'Match each malware removal step to its correct order:',
        matchPairs: [
            { term: 'Step 1', definition: 'Investigate and verify malware symptoms' },
            { term: 'Step 2', definition: 'Quarantine infected systems from the network' },
            { term: 'Step 3', definition: 'Disable System Restore and remediate in Safe Mode' },
            { term: 'Step 4', definition: 'Schedule scans, update OS, and re-enable System Restore' },
            { term: 'Step 5', definition: 'Educate the end user on malware prevention' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'The CompTIA malware removal process follows a strict order. First verify symptoms to confirm infection. Quarantine prevents spread. Disable System Restore so malware cannot hide in restore points, then scan in Safe Mode. After remediation, update everything and re-enable System Restore. Finally, train the user to avoid reinfection.',
    },
    {
        examId: A_PLUS_CORE2_ID,
        type: 'matching',
        domain: 'Security',
        stem: 'Match each Windows security feature to its purpose:',
        matchPairs: [
            { term: 'BitLocker', definition: 'Full-disk encryption to protect data at rest' },
            { term: 'Windows Firewall', definition: 'Filters inbound and outbound network traffic by port and application' },
            { term: 'User Account Control (UAC)', definition: 'Prompts for elevation before allowing administrative changes' },
            { term: 'Windows Defender', definition: 'Built-in antivirus and anti-malware real-time protection' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'BitLocker encrypts entire drives using TPM, protecting data if a device is lost or stolen. Windows Firewall controls network access with allow/block rules. UAC prevents unauthorized privilege escalation by requiring explicit consent. Windows Defender provides real-time scanning against viruses, ransomware, and spyware.',
    },
    {
        examId: A_PLUS_CORE2_ID,
        type: 'matching',
        domain: 'Operational Procedures',
        stem: 'Match each backup type to its characteristic:',
        matchPairs: [
            { term: 'Full Backup', definition: 'Copies all selected data regardless of previous backups' },
            { term: 'Incremental Backup', definition: 'Copies only data changed since the last backup of any type' },
            { term: 'Differential Backup', definition: 'Copies all data changed since the last full backup' },
            { term: 'Synthetic Full', definition: 'Combines a full backup with subsequent incrementals into a new full' },
        ],
        options: [],
        correctAnswer: 0,
        explanation: 'Full backups are comprehensive but slow and large. Incremental backups are fast (only changes since last backup) but restore requires the full + all incrementals. Differential backups grow over time (all changes since last full) but restore only needs the full + latest differential. Synthetic full merges backups to create a consolidated copy without re-reading source data.',
    },
];

async function main() {
    console.log(`Seeding ${questions.length} matching questions...`);

    const batch = db.batch();
    for (const q of questions) {
        const ref = db.collection('questions').doc();
        batch.set(ref, {
            ...q,
            isPublished: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source: 'seed-matching-v1',
        });
        console.log(`  + ${q.examId === SECURITY_PLUS_ID ? 'Security+' : q.examId === NETWORK_PLUS_ID ? 'Network+' : 'A+ Core 2'} | ${q.domain} | ${q.stem.substring(0, 50)}...`);
    }

    await batch.commit();
    console.log(`\nDone! ${questions.length} matching questions added.`);
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
