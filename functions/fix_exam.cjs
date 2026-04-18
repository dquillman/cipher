const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'exam-coach-ai-platform'
});

const db = admin.firestore();

async function fixExam() {
  const examId = '79cuGMNydTwDMhyiDjry'; // CompTIA Security+ (SY0-701)

  const correctDomains = [
    'General Security Concepts',
    'Threats, Vulnerabilities, and Mitigations',
    'Security Architecture',
    'Security Operations',
    'Security Program Management and Oversight'
  ];

  const correctBlueprint = [
    {
      domain: 'General Security Concepts',
      weight: 12,
      subDomain: 'CIA Triad; Security Controls; Threat Intelligence.'
    },
    {
      domain: 'Threats, Vulnerabilities, and Mitigations',
      weight: 22,
      subDomain: 'Malware Types; Social Engineering; Network-based Attacks; Vulnerability Management.'
    },
    {
      domain: 'Security Architecture',
      weight: 18,
      subDomain: 'Secure Network Design; Cloud Security; Host Security (OS, Endpoint); Cryptography.'
    },
    {
      domain: 'Security Operations',
      weight: 28,
      subDomain: 'Incident Response; Forensics; Security Assessment & Testing; Monitoring and Alerting.'
    },
    {
      domain: 'Security Program Management and Oversight',
      weight: 20,
      subDomain: 'Security Governance; Risk Management (Frameworks, Assessment); Compliance (PCI DSS, GDPR).'
    }
  ];

  // 1. Update Exam Document
  await db.collection('exams').doc(examId).update({
    domains: correctDomains,
    blueprint: correctBlueprint,
    updatedAt: new Date()
  });

  console.log('Exam document updated.');

  // 2. Update Questions (Normalize Domain Names)
  const questionsSnap = await db.collection('questions').where('examId', '==', examId).get();

  let batch = db.batch();
  let count = 0;

  questionsSnap.docs.forEach(doc => {
    const data = doc.data();
    let newDomain = data.domain;

    // Fix the split domains
    if (['Threats', 'Vulnerabilities', 'and Mitigations'].includes(data.domain)) {
      newDomain = 'Threats, Vulnerabilities, and Mitigations';
    } else if (data.domain === 'Security Program Management') {
      newDomain = 'Security Program Management and Oversight';
    }

    if (newDomain !== data.domain) {
      batch.update(doc.ref, { domain: newDomain });
      count++;
    }
  });

  await batch.commit();
  console.log('Updated ' + count + ' questions with correct domains.');
}

fixExam().catch(console.error);
