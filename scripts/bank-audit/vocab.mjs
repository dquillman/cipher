// Domain vocabulary per exam. A question that contains none of its exam's terms
// anywhere in its stem or options is almost certainly off-topic. This is a
// coarse screen, not a grader — it is deliberately generous, so anything it
// flags is worth a human look.

export const INFOSEC = /encrypt|firewall|malware|phish|SIEM|vulnerab|authenticat|MFA|TLS|SSL|VPN|IDS|IPS|zero.trust|hash|certificate|ransomware|penetration test|ACL|RBAC|DLP|WAF|password|credential|patch|least privilege|segmentation|honeypot|forensic|CVE|exploit|malicious|packet|network traffic|server|endpoint|EDR|log(s|ging| file)|backup|API|database|cloud|SQL|XSS|DDoS|botnet|spoof|token|cipher|PKI|SSO|IAM|port scan|sandbox|antivirus|data breach|social engineer|insider threat|remote access|configuration|protocol/i;

export const NETWORKING = /subnet|router|switch|VLAN|DNS|DHCP|TCP|UDP|IP address|OSI|latency|bandwidth|gateway|NAT|BGP|OSPF|fiber|ethernet|wireless|SSID|firewall|packet|port|topology|cable|CIDR|traceroute|ping|throughput|PoE|SNMP|VPN|load balanc/i;

export const ITSUPPORT = /Windows|Linux|macOS|BIOS|UEFI|driver|malware|command prompt|PowerShell|registry|permissions|user account|install|boot|partition|antivirus|patch|backup|printer|mobile device|encryption|firewall|group policy|task manager|troubleshoot|operating system/i;

export const PROJECT = /project|stakeholder|scope|schedule|budget|risk register|sprint|scrum|backlog|charter|deliverable|milestone|WBS|earned value|resource|procurement|agile|iteration|retrospective|velocity|baseline|change request|lessons learned/i;

export const PAYROLL = /payroll|wage|FLSA|W-2|W-4|1099|garnish|withhold|tax|FICA|overtime|exempt|deduction|401\(k\)|IRS|gross pay|net pay|salar|timekeep|pay period|reimburs|benefit|unemployment|SUTA|FUTA|remit|earnings|paycheck|compensat/i;

export const AUDIT = /audit|internal control|assurance|risk|governance|compliance|materiality|sampling|workpaper|independence|fraud|COSO|engagement|finding|evidence|objectivity|IIA|standard/i;

export const HR = /employee|recruit|hiring|onboard|compensation|benefit|performance review|EEOC|FMLA|ADA|labor|union|termination|workforce|talent|training|HR|discrimination|harassment|retention|job analysis/i;

export const ITIL = /service|incident|problem|change enablement|SLA|ITIL|configuration item|service desk|continual improvement|value stream|practice|release|deployment|request fulfil|availability|capacity/i;

export const QUALITY = /six sigma|DMAIC|defect|variation|control chart|process capability|Cp|Cpk|root cause|pareto|fishbone|SIPOC|standard deviation|sample|hypothesis|regression|lean|waste|kaizen|value stream|measurement system/i;

// exam id -> [human name, vocabulary]
export const EXAM_VOCAB = {
    '79cuGMNydTwDMhyiDjry': ['CompTIA Security+ (SY0-701)', INFOSEC],
    'Vs3aNmifAJc9bYRFCxXc': ['Certified Payroll Professional (CPP)', PAYROLL],
};

// Anything not listed above still gets counted and broken down by source; it
// just does not get an on-topic percentage. Add ids here as you confirm them —
// audit-sources.mjs prints every id it finds.
export const VOCAB_BY_NAME = {
    security: INFOSEC, network: NETWORKING, itsupport: ITSUPPORT,
    project: PROJECT, payroll: PAYROLL, audit: AUDIT,
    hr: HR, itil: ITIL, quality: QUALITY,
};
