const admin = require('firebase-admin');
const path = require('path');

// Adjust path if needed
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🔥 PUT YOUR UID HERE
const UID = 'PASTE_YOUR_UID_HERE';

// 🔥 PUT YOUR EXAM ID HERE
const EXAM_ID = 'PASTE_YOUR_EXAM_ID_HERE';

(async () => {
  console.log('Running diagnostic...');
  console.log('UID:', UID);
  console.log('Exam:', EXAM_ID);
  console.log('--------------------------');

  const snap = await db
    .collection('quizRuns')
    .doc(UID)
    .collection('runs')
    .where('status', '==', 'completed')
    .get();

  let totalAnswers = 0;
  let totalRuns = 0;
  let domainCounts = {};
  let missingDomain = 0;
  let quizTypeCounts = {};

  snap.forEach(doc => {
    const run = doc.data();

    if (run.examId !== EXAM_ID) return;

    if (
      run.mode === 'diagnostic' ||
      run.quizType === 'diagnostic' ||
      run.mode === 'simulation' ||
      run.quizType === 'simulation'
    ) {
      return;
    }

    totalRuns++;

    quizTypeCounts[run.quizType] =
      (quizTypeCounts[run.quizType] || 0) + 1;

    const answers = (run.answers || []).filter(
      a => a?.selectedOption !== undefined
    );

    answers.forEach(a => {
      totalAnswers++;

      if (!a.domain) {
        missingDomain++;
      } else {
        domainCounts[a.domain] =
          (domainCounts[a.domain] || 0) + 1;
      }
    });
  });

  console.log('Total completed runs:', totalRuns);
  console.log('Quiz type breakdown:', quizTypeCounts);
  console.log('Total answers counted:', totalAnswers);
  console.log('Domain counts:', domainCounts);
  console.log('Missing domain answers:', missingDomain);
  console.log('--------------------------');
})();
